// Tareas del profesor con datos de Firestore (fase 07 W6, D199–D202). Puro (sin Firebase ni
// reloj): qué se escribe al guardar, publicar o editar una tarea (`armarTarea`), cómo se ve en la
// lista y en el constructor, y las tarjetas de Premios. Lo usan los adaptadores de Postgres
// (`lib/data/tareas.ts`), las páginas del profe y las pruebas.
import { z } from "zod";
import { notasPremioIndividual } from "@/lib/equipo";
import {
  cerradaParaTodosEn,
  estadoEfectivo,
  estadoEn,
  prorrogasVigentes,
} from "@/lib/estado-tarea";
import {
  comparaFecha,
  diaDeInstante,
  diasEntre,
  FECHA_ENTREGA_MAX_DIAS,
  hora24DeInstante,
  horaPasada,
} from "@/lib/fecha";
import { NOTA_MAX } from "@/lib/grades";
import {
  type DecisionesPremio,
  type DecisionPremio,
  type Entrega,
  type Equipo,
  FORMATOS_PREGUNTA,
  type Prorrogas,
  rutasImagen,
  type SeccionId,
  sumaValores as sumaModelo,
  type TareaDoc,
  TIPOS_TAREA,
  type Usuario,
  zDecisionPremio,
  zDia,
  zHora,
  zMaxImagenes,
  zPuntaje,
  zSeccion,
  zTarea,
  zTareaBorrador,
  zTareaDoc,
} from "@/lib/modelo";
import { zOpId } from "@/lib/offline/operacion";
import {
  type EstadoPremio,
  estadoPremio,
  resolverEmpate,
  type TarjetaPremio,
} from "@/lib/premios";
import { listaSecciones, ordenarSecciones } from "@/lib/secciones";
import {
  type AccionTarea,
  type AvanceTarea,
  type DatosBorrador,
  type ErrorTarea,
  fechaCampo,
  horaCampo,
  MAX_PREGUNTAS,
  type ModoConstructor,
  type PerdidaEliminar,
  SIN_PERDIDA,
  type TareaProfe,
} from "@/lib/tareas-profe";

type ConId<T> = { id: string } & T;

/* ---------- Entrada de las Server Actions ---------- */

/** Ids de documento de Firestore (los automáticos y los del seed, con guiones). */
export const zIdTareaProfe = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,120}$/, "Id inválido");

/** Lo que manda el constructor (`tareaAGuardar`): a medias en un borrador. */
export const zEntradaTarea = z.object({
  titulo: z.string().trim().max(120),
  tipo: z.enum(TIPOS_TAREA),
  fecha: zDia.nullable(),
  // Ausente en los envíos encolados antes de la hora (D352): cuenta como `null`, fin del día
  hora: zHora.nullable().optional(),
  // Códigos con forma válida y sin repetir; que existan en el catálogo lo mira la acción (D323)
  secciones: z
    .array(zSeccion)
    .min(1)
    .max(9 * 26)
    .refine((xs) => new Set(xs).size === xs.length, "Sección repetida"),
  premio: z.string().trim().max(200).nullable(),
  preguntas: z
    .array(
      z.object({
        id: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, "Id inválido"),
        enunciado: z.string().trim().max(500),
        formato: z.enum(FORMATOS_PREGUNTA),
        // Varias imágenes (D373); ausente o `null` = una sola. En texto se ignora al guardar
        maxImagenes: zMaxImagenes.nullable().optional(),
        valor: zPuntaje.refine((n) => n > 0).nullable(),
      }),
    )
    .min(1)
    .max(MAX_PREGUNTAS),
});
export type EntradaTarea = z.infer<typeof zEntradaTarea>;

export const zGuardarTarea = z.object({
  /** `null`: tarea nueva (id automático). */
  id: zIdTareaProfe.nullable(),
  accion: z.enum(["borrador", "publicar", "guardar"]),
  tarea: zEntradaTarea,
  /** Id del intento (D293): si la cola lo reintenta, la tarea no se crea dos veces. */
  opId: zOpId.optional(),
});
export type GuardarTarea = z.infer<typeof zGuardarTarea>;

export const zDecidirPremio = z.object({
  tareaId: zIdTareaProfe,
  seccion: zSeccion,
  decision: zDecisionPremio,
});
export type DecidirPremio = z.infer<typeof zDecidirPremio>;

export type ResultadoTarea =
  | { ok: true; id: string }
  | { ok: false; error: ErrorTarea };

/* ---------- Armar el documento ---------- */

type Armar = {
  entrada: EntradaTarea;
  accion: AccionTarea;
  /** Documento actual; `null` si la tarea es nueva. */
  previa: TareaDoc | null;
  /** ¿La tarea tiene ya alguna entrega? Congela tipo, secciones y preguntas (D200). */
  conEntregas: boolean;
  autorId: string;
  /** Día civil de Caracas: la fecha de entrega no puede ser anterior (salvo la ya guardada). */
  hoy: string;
  /** Instante del guardado: su hora en Caracas es la que la de entrega de hoy no puede pasar (D354). */
  ahora: number;
};

type Armada =
  | { ok: true; tarea: TareaDoc; fotoSuelta?: string }
  | { ok: false; error: ErrorTarea };

function idsUnicos(preguntas: ReadonlyArray<{ id: string }>): boolean {
  return new Set(preguntas.map((p) => p.id)).size === preguntas.length;
}

type Vencimiento = { fecha: string | null; hora: string | null };

const vencimientoDe = (t: TareaDoc | null): Vencimiento => ({
  fecha: t?.fechaEntrega ?? null,
  hora: t?.horaEntrega ?? null,
});

/**
 * Fecha válida para publicar: de hoy a un año (D228), o la que ya tenía la tarea. Si es hoy, su
 * hora no puede haber pasado (D354), salvo que sean la fecha y la hora guardadas.
 */
function fechaOk(
  v: Vencimiento,
  a: Pick<Armar, "hoy" | "ahora">,
  guardada: Vencimiento,
): ErrorTarea | null {
  const { fecha, hora } = v;
  if (fecha === null) return "invalida";
  if (fecha !== guardada.fecha && comparaFecha(fecha, a.hoy) < 0)
    return "fecha-pasada";
  if (
    fecha !== guardada.fecha &&
    diasEntre(a.hoy, fecha) > FECHA_ENTREGA_MAX_DIAS
  )
    return "fecha-lejana";
  if (
    hora !== null &&
    fecha === a.hoy &&
    horaPasada(hora, hora24DeInstante(a.ahora)) &&
    !(fecha === guardada.fecha && hora === guardada.hora)
  )
    return "hora-pasada";
  return null;
}

const horaDe = (e: Pick<EntradaTarea, "hora">) => e.hora ?? null;

/**
 * Preguntas como se guardan: `maxImagenes` solo en las de imagen con «Varias» (D373); en texto, o
 * `null` (una imagen), no se escribe.
 */
function preguntasDe(entrada: Pick<EntradaTarea, "preguntas">) {
  return entrada.preguntas.map(({ maxImagenes, ...p }) =>
    p.formato === "imagen" && maxImagenes != null ? { ...p, maxImagenes } : p,
  );
}

/**
 * Con entregas las preguntas no cambian (D200), salvo subir el límite de imágenes (D373): una
 * respuesta ya enviada sigue cabiendo. Bajarlo, o cualquier otro cambio, no se aplica.
 */
function conLimitesAmpliados<
  P extends { id: string; formato: string; maxImagenes?: number | undefined },
>(guardadas: readonly P[], entrada: Pick<EntradaTarea, "preguntas">): P[] {
  const pedidas = new Map(entrada.preguntas.map((p) => [p.id, p]));
  return guardadas.map((p) => {
    const nueva = pedidas.get(p.id)?.maxImagenes;
    if (p.formato !== "imagen" || nueva == null) return p;
    return nueva > (p.maxImagenes ?? 1) ? { ...p, maxImagenes: nueva } : p;
  });
}

/** Tarea publicada completa (D004): todo escrito y la suma en 20 exactos. */
function publicada(
  a: Armar,
  base: { estado: "abierta"; autorId: string | null },
): Armada {
  const { entrada } = a;
  const err = fechaOk(
    { fecha: entrada.fecha, hora: horaDe(entrada) },
    a,
    vencimientoDe(a.previa),
  );
  if (err) return { ok: false, error: err };
  if (
    !entrada.titulo ||
    entrada.preguntas.some((p) => !p.enunciado || p.valor === null) ||
    sumaModelo(entrada.preguntas.map((p) => ({ valor: p.valor ?? 0 }))) !==
      NOTA_MAX
  ) {
    return { ok: false, error: "invalida" };
  }
  const r = zTarea.safeParse({
    titulo: entrada.titulo,
    tipo: entrada.tipo,
    secciones: ordenarSecciones(entrada.secciones),
    estado: base.estado,
    fechaEntrega: entrada.fecha,
    horaEntrega: horaDe(entrada),
    premio: premioDe(entrada),
    ...fotoDe(premioDe(entrada), a.previa),
    preguntas: preguntasDe(entrada),
    importada: false,
    autorId: base.autorId,
    actualizadoEn: a.ahora,
  });
  return r.success
    ? { ok: true, tarea: r.data }
    : { ok: false, error: "invalida" };
}

/** Grupal o individual: el premio es opcional en las dos (D263). */
function premioDe(e: Pick<EntradaTarea, "premio">): string | null {
  return e.premio ? e.premio : null;
}

/**
 * La foto del premio no la toca el constructor (D265): se conserva mientras siga habiendo premio.
 * Sin premio se va, y su clave sale en `fotoSuelta` para borrarla de B2 después del commit.
 */
function fotoDe(
  premio: string | null,
  previa: TareaDoc | null,
): { premioFoto?: string } {
  const foto = previa?.premioFoto;
  return premio !== null && foto ? { premioFoto: foto } : {};
}

function conFotoSuelta(r: Armada, previa: TareaDoc | null): Armada {
  const vieja = previa?.premioFoto;
  if (!r.ok || !vieja || r.tarea.premioFoto === vieja) return r;
  return { ...r, fotoSuelta: vieja };
}

/**
 * Documento que se escribe (D199, D200). Borrador o nueva: «borrador» guarda lo que haya (con
 * título) y «publicar» exige la tarea completa. Abierta: solo «guardar»; con entregas, solo
 * título, fecha, premio y subir el límite de imágenes (D373; lo demás de las preguntas, el tipo y
 * las secciones quedan como estaban). Cerrada
 * (`evaluada`) o importada del Excel: no se cambia.
 */
export function armarTarea(a: Armar): Armada {
  return conFotoSuelta(armarSinFoto(a), a.previa);
}

function armarSinFoto(a: Armar): Armada {
  const { entrada, previa, accion } = a;
  if (!idsUnicos(entrada.preguntas)) return { ok: false, error: "invalida" };
  // Cerrada a mano o vencida (D451): no se edita; la salida es reabrirla (D455)
  if (
    previa &&
    (previa.importada || estadoEfectivo(previa, a.ahora) === "cerrada")
  ) {
    return { ok: false, error: "cerrada" };
  }
  const autorId = previa ? previa.autorId : a.autorId;

  if (previa?.estado === "abierta") {
    if (accion !== "guardar") return { ok: false, error: "invalida" };
    if (!a.conEntregas) return publicada(a, { estado: "abierta", autorId });
    const err = fechaOk(
      { fecha: entrada.fecha, hora: horaDe(entrada) },
      a,
      vencimientoDe(previa),
    );
    if (err) return { ok: false, error: err };
    const { premioFoto: _foto, ...sinFoto } = previa;
    const premio = premioDe(entrada);
    const r = zTarea.safeParse({
      ...sinFoto,
      titulo: entrada.titulo,
      fechaEntrega: entrada.fecha,
      horaEntrega: horaDe(entrada),
      premio,
      ...fotoDe(premio, previa),
      preguntas: conLimitesAmpliados<TareaDoc["preguntas"][number]>(
        previa.preguntas,
        entrada,
      ),
      actualizadoEn: a.ahora,
    });
    return r.success
      ? { ok: true, tarea: r.data }
      : { ok: false, error: "invalida" };
  }

  if (accion === "guardar") return { ok: false, error: "invalida" };
  if (accion === "publicar")
    return publicada(a, { estado: "abierta", autorId });

  const r = zTareaBorrador.safeParse({
    titulo: entrada.titulo,
    tipo: entrada.tipo,
    secciones: ordenarSecciones(entrada.secciones),
    estado: "borrador",
    fechaEntrega: entrada.fecha,
    horaEntrega: horaDe(entrada),
    premio: premioDe(entrada),
    ...fotoDe(premioDe(entrada), previa),
    preguntas: preguntasDe(entrada),
    importada: false,
    autorId,
    actualizadoEn: a.ahora,
  });
  return r.success
    ? { ok: true, tarea: r.data }
    : { ok: false, error: "invalida" };
}

/** Cerrar = dejar de recibir entregas (`abierta` → `evaluada`, D196, D202). */
export function puedeCerrar(t: TareaDoc): boolean {
  return t.estado === "abierta" && !t.importada;
}

/* ---------- Lista y constructor ---------- */

export type ResumenEntregas = {
  entregadas: number;
  evaluadas: number;
  /** Titulares (cédula o equipo) con entrega enviada o evaluada: cuentan en el total (D316). */
  titulares: ReadonlySet<string>;
};

const SIN_ENTREGAS: ResumenEntregas = {
  entregadas: 0,
  evaluadas: 0,
  titulares: new Set(),
};

/** Entregas por tarea: enviadas sin evaluar («Por evaluar»), evaluadas y de quién son. */
export function resumenEntregas(
  entregas: ReadonlyArray<Pick<Entrega, "tareaId" | "estado" | "titularId">>,
): Map<string, ResumenEntregas> {
  const m = new Map<
    string,
    { entregadas: number; evaluadas: number; titulares: Set<string> }
  >();
  for (const e of entregas) {
    if (e.estado === "borrador") continue;
    const r = m.get(e.tareaId) ?? {
      entregadas: 0,
      evaluadas: 0,
      titulares: new Set<string>(),
    };
    if (e.estado === "evaluada") r.evaluadas += 1;
    else r.entregadas += 1;
    r.titulares.add(e.titularId);
    m.set(e.tareaId, r);
  }
  return m;
}

/**
 * Titulares vivos por sección, para el total del avance («12 de 69 evaluadas»): cuántos alumnos
 * y qué equipos (sus ids: un equipo eliminado deja entregas cuyo titular ya no está, D316).
 */
export type Conteos = {
  alumnos: Readonly<Record<SeccionId, number>>;
  equipos: Readonly<Record<SeccionId, readonly string[]>>;
};

/**
 * `Conteos` de cada sección del catálogo (D323): las que no tienen alumnos o equipos salen con
 * 0 y `[]`, así una sección nueva nunca da `undefined`. `alumnos`: cuántos hay en cada una.
 */
export function conteosDe(
  secciones: readonly SeccionId[],
  alumnos: Readonly<Record<SeccionId, number>>,
  equipos: ReadonlyArray<{ id: string; seccion: SeccionId }>,
): Conteos {
  return {
    alumnos: Object.fromEntries(secciones.map((s) => [s, alumnos[s] ?? 0])),
    equipos: Object.fromEntries(
      secciones.map((s) => [
        s,
        equipos.filter((e) => e.seccion === s).map((e) => e.id),
      ]),
    ),
  };
}

/**
 * Total del avance (D316): titulares con entrega (enviada o evaluada, aunque su equipo ya no
 * exista) + titulares vivos de las secciones de la tarea sin entrega. Así `hechas <= total`
 * siempre. En la individual los alumnos llegan contados, no por id: un alumno eliminado se lleva
 * sus entregas individuales (D268), así que los que entregaron están vivos y el total es el mayor
 * de los dos.
 */
export function totalTitulares(
  t: Pick<TareaDoc, "tipo" | "secciones">,
  c: Conteos,
  resumen: ResumenEntregas = SIN_ENTREGAS,
): number {
  const conEntrega = resumen.entregadas + resumen.evaluadas;
  if (t.tipo === "grupal") {
    const sinEntrega = t.secciones
      .flatMap((sec) => c.equipos[sec] ?? [])
      .filter((id) => !resumen.titulares.has(id)).length;
    return conEntrega + sinEntrega;
  }
  const vivos = t.secciones.reduce((s, sec) => s + (c.alumnos[sec] ?? 0), 0);
  return Math.max(vivos, conEntrega);
}

/**
 * Tarjeta de la lista. Estado efectivo en `ahora` (D451): una abierta vencida llega cerrada, con
 * cuántas prórrogas siguen vigentes (D452). Avance: con alguna evaluada (o cerrada), «n de N
 * evaluadas»; si no, «n de N entregaron». Un borrador no lleva avance. `evaluadaToda`: alguna
 * entrega y ninguna sin nota (D454; `total` cuenta también a quien no entregó, así que no sirve).
 * Sin `ahora` (vista previa), el estado guardado.
 */
export function tareaProfeDe(
  t: ConId<TareaDoc>,
  resumen: ResumenEntregas | undefined,
  conteos: Conteos,
  perdida: PerdidaEliminar = SIN_PERDIDA,
  ahora?: number,
): TareaProfe {
  const r = resumen ?? SIN_ENTREGAS;
  const total = totalTitulares(t, conteos, r);
  const estado = estadoEn(t, ahora);
  let avance: AvanceTarea | null = null;
  if (estado !== "borrador") {
    avance =
      r.evaluadas > 0 || estado === "cerrada"
        ? { tipo: "evaluadas", hechas: r.evaluadas, total }
        : { tipo: "entregas", hechas: r.entregadas + r.evaluadas, total };
  }
  const prorrogas =
    estado === "cerrada" && ahora !== undefined
      ? prorrogasVigentes(t, ahora).length
      : 0;
  return {
    id: t.id,
    titulo: t.titulo,
    tipo: t.tipo,
    estado,
    fecha: t.fechaEntrega,
    hora: t.horaEntrega ?? null,
    secciones: listaSecciones(t.secciones),
    premio: t.premio,
    preguntas: t.preguntas.length,
    suma: sumaModelo(t.preguntas.map((p) => ({ valor: p.valor ?? 0 }))),
    avance,
    porEvaluar: r.entregadas,
    ...(estado !== "borrador" && r.evaluadas > 0 && r.entregadas === 0
      ? { evaluadaToda: true }
      : {}),
    ...(prorrogas > 0 ? { prorrogas } : {}),
    perdida,
  };
}

/* ---------- Eliminar una tarea (D242, D243) ---------- */

type EntregaPerdida = Pick<
  Entrega,
  "tareaId" | "estado" | "integrantes" | "seccion"
>;

/** Lo que pierde una tarea al eliminarla (el texto de la confirmación), de sus entregas. */
export function perdidaAlEliminar(
  entregas: ReadonlyArray<Omit<EntregaPerdida, "tareaId">>,
): PerdidaEliminar {
  let notas = 0;
  let sinEvaluar = 0;
  const conNotas = new Set<SeccionId>();
  for (const e of entregas) {
    if (e.estado === "evaluada") {
      notas += e.integrantes.length;
      conNotas.add(e.seccion);
    } else if (e.estado === "entregada") sinEvaluar += 1;
  }
  return {
    notas,
    sinEvaluar,
    secciones: ordenarSecciones(conNotas),
  };
}

/** `perdidaAlEliminar` de cada tarea, en una sola pasada por todas las entregas. */
export function perdidasPorTarea(
  entregas: ReadonlyArray<EntregaPerdida>,
): Map<string, PerdidaEliminar> {
  const por = new Map<string, EntregaPerdida[]>();
  for (const e of entregas) {
    const l = por.get(e.tareaId);
    if (l) l.push(e);
    else por.set(e.tareaId, [e]);
  }
  return new Map([...por].map(([id, l]) => [id, perdidaAlEliminar(l)]));
}

/** Tope de escrituras de una transacción de Firestore. */
export const MAX_ESCRITURAS_TX = 500;

export type PlanEliminar = {
  /**
   * Secciones cuyo `ranking/{s}` se recalcula: las de sus entregas (sin entregas, la tarea no
   * aportaba puntos y el ranking no cambia).
   */
  secciones: SeccionId[];
  /** Claves de B2 de las imágenes de respuesta: se borran después del commit (D229). */
  imagenes: string[];
  /** Tarea + entregas + un ranking por sección. */
  escrituras: number;
};

/**
 * Qué toca eliminar una tarea. Una entrega por titular y tarea (`idEntrega`): con 69 alumnos en
 * las dos secciones son ≤ 69 entregas, 72 escrituras, lejos del tope de 500 (D242).
 */
export function planEliminar(
  entregas: ReadonlyArray<Pick<Entrega, "seccion" | "respuestas">>,
): PlanEliminar {
  const secciones = new Set<SeccionId>();
  const imagenes: string[] = [];
  for (const e of entregas) {
    secciones.add(e.seccion);
    for (const r of Object.values(e.respuestas)) {
      imagenes.push(...rutasImagen(r));
    }
  }
  const s = ordenarSecciones(secciones);
  return {
    secciones: s,
    imagenes: [...new Set(imagenes)],
    escrituras: 1 + entregas.length + s.length,
  };
}

/** Lo que carga el constructor: los campos como se escriben y las preguntas con su id. */
export function datosBorradorDe(t: TareaDoc): DatosBorrador {
  return {
    titulo: t.titulo,
    tipo: t.tipo,
    fecha: fechaCampo(t.fechaEntrega),
    hora: horaCampo(t.horaEntrega ?? null),
    secciones: [...t.secciones],
    premio: t.premio ?? "",
    preguntas: t.preguntas.map(({ id, enunciado, formato, valor, ...p }) => ({
      id,
      enunciado,
      formato,
      ...(formato === "imagen" && p.maxImagenes
        ? { maxImagenes: p.maxImagenes }
        : {}),
      valor,
    })),
  };
}

/**
 * Modo del constructor (D200). Cerrada a mano o vencida en `ahora` (D451): solo lectura, la salida
 * es «Reabrir tarea» (D455). Sin `ahora`, el estado guardado.
 */
export function modoConstructor(
  t: TareaDoc,
  conEntregas: boolean,
  ahora?: number,
): ModoConstructor {
  if (t.estado === "borrador") return "borrador";
  if (estadoEn(t, ahora) === "cerrada" || t.importada) return "cerrada";
  return conEntregas ? "con-entregas" : "publicada";
}

/* ---------- Premios ---------- */

type EntregaPremio = Pick<
  Entrega,
  "tareaId" | "tipo" | "titularId" | "seccion" | "estado" | "evaluacion"
>;

/** Lo que hace falta de cada alumno para el premio individual (D264). */
export type AlumnoPremio = Pick<Usuario, "cedula" | "rol" | "seccion" | "base">;

/**
 * Estado del premio de una tarea en una sección. Grupal: compiten sus equipos con la nota grupal
 * sin base (D014). Individual (D263, D264): compiten sus alumnos con su nota final (con base).
 * Cerrada: la fecha es la de la última evaluación (o la de entrega). Con empate y decisión del
 * profe, la decisión manda (D123, D124); una decisión por alguien que ya no empata no cuenta.
 */
export function estadoPremioSeccion(
  t: Pick<TareaDoc, "estado" | "premio" | "fechaEntrega" | "tipo"> & {
    id: string;
    horaEntrega?: string | null | undefined;
    decisionesPremio?: DecisionesPremio | undefined;
    prorrogas?: Prorrogas | null | undefined;
  },
  seccion: SeccionId,
  equipos: ReadonlyArray<ConId<Pick<Equipo, "seccion">>>,
  entregas: ReadonlyArray<EntregaPremio>,
  alumnos: ReadonlyArray<AlumnoPremio> = [],
  /** Instante de la petición: «vence» / «venció» de una abierta por fecha y hora (D357). */
  ahora?: number,
): EstadoPremio {
  const deSeccion = entregas.filter(
    (e) =>
      e.tareaId === t.id &&
      e.tipo === t.tipo &&
      e.seccion === seccion &&
      e.estado !== "borrador",
  );
  const notas =
    t.tipo === "individual"
      ? notasPremioIndividual(t.id, seccion, alumnos, deSeccion)
      : equipos
          .filter((e) => e.seccion === seccion)
          .map((eq) => {
            const e = deSeccion.find((x) => x.titularId === eq.id);
            return {
              id: eq.id,
              nota:
                e?.estado === "evaluada" && e.evaluacion
                  ? e.evaluacion.puntaje
                  : null,
            };
          });
  const compiten = new Set(notas.map((n) => n.id));
  const entregaron = deSeccion.filter((e) => compiten.has(e.titularId)).length;
  const ultima = Math.max(
    0,
    ...deSeccion.map((e) => e.evaluacion?.evaluadaEn ?? 0),
  );
  // El premio se resuelve al cerrar para todos (D453): con prórrogas vigentes sigue en juego
  const cerrada = cerradaParaTodosEn(t, ahora);
  const fecha = cerrada && ultima > 0 ? diaDeInstante(ultima) : t.fechaEntrega;
  const estado = estadoPremio(
    {
      hora: t.horaEntrega ?? null,
      ...(ahora !== undefined ? { ahora } : {}),
      estado:
        t.estado === "borrador" ? "borrador" : cerrada ? "evaluada" : "abierta",
      premio: t.premio ?? undefined,
      fecha,
      avance: { entregaron, total: notas.length },
    },
    notas,
  );
  const decision: DecisionPremio | undefined = t.decisionesPremio?.[seccion];
  return decision ? resolverEmpate(estado, decision) : estado;
}

/** ¿La decisión encaja con el tipo de tarea? «dar» es de grupales; «darAlumno», de individuales. */
export function decisionEncaja(
  tipo: TareaDoc["tipo"],
  decision: DecisionPremio,
): boolean {
  if (decision.tipo === "compartir") return true;
  return tipo === "grupal"
    ? decision.tipo === "dar"
    : decision.tipo === "darAlumno";
}

type TareaPremio = Pick<TareaDoc, "estado" | "importada" | "fechaEntrega"> & {
  horaEntrega?: string | null | undefined;
  prorrogas?: Prorrogas | null | undefined;
};

/** Cerrada para todos primero, después abiertas (también con prórrogas) y borradores (D453). */
const ordenPremio = (t: TareaPremio, ahora: number | undefined) =>
  t.estado === "borrador" ? 2 : cerradaParaTodosEn(t, ahora) ? 0 : 1;

/**
 * ¿Se puede poner o cambiar el premio? Ni cerrada para todos (D453) ni importada del Excel (D200,
 * D266). Sin `ahora`, cerrada a mano.
 */
export function premioEditable(t: TareaPremio, ahora?: number): boolean {
  return !cerradaParaTodosEn(t, ahora) && !t.importada;
}

/**
 * Tarjetas de Premios (D201): cada tarea con premio, una por sección (el premio se disputa en
 * cada una). Un borrador grupal, o una grupal abierta sin premio, da una tarjeta «por definir».
 * Una individual sale solo si tiene premio (es opcional y son muchas, D263). Las cerradas sin
 * premio y las importadas del Excel no salen. `alumnos`: los de las dos secciones (individuales).
 */
export function tarjetasPremios(
  tareas: ReadonlyArray<ConId<TareaDoc>>,
  equipos: ReadonlyArray<ConId<Pick<Equipo, "seccion">>>,
  entregas: ReadonlyArray<EntregaPremio>,
  alumnos: ReadonlyArray<AlumnoPremio> = [],
  /** Instante de la petición (D357). */
  ahora?: number,
): TarjetaPremio[] {
  const conPremio = tareas
    .filter((t) => !t.importada && (t.tipo === "grupal" || t.premio !== null))
    .sort(
      (a, b) =>
        ordenPremio(a, ahora) - ordenPremio(b, ahora) ||
        comparaFecha(
          b.fechaEntrega ?? "0001-01-01",
          a.fechaEntrega ?? "0001-01-01",
        ),
    );
  return conPremio.flatMap((t): TarjetaPremio[] => {
    const comun = {
      tarea: t.titulo,
      tareaId: t.id,
      tipoTarea: t.tipo,
      premio: t.premio,
      premioFoto: t.premioFoto ?? null,
      editable: premioEditable(t, ahora),
    };
    if (t.estado === "borrador" || !t.premio) {
      if (cerradaParaTodosEn(t, ahora)) return [];
      return [
        {
          ...comun,
          id: t.id,
          seccion: listaSecciones(t.secciones),
          borrador: t.estado === "borrador",
          estado: { tipo: "por-definir" },
        },
      ];
    }
    return t.secciones.map((s) => ({
      ...comun,
      id: `${t.id}__${s}`,
      seccion: s,
      seccionId: s,
      borrador: false,
      estado: estadoPremioSeccion(t, s, equipos, entregas, alumnos, ahora),
    }));
  });
}

/* ---------- Crear y editar el premio (W11, D266) ---------- */

/** Tarea que se puede elegir en «Crear premio»: sin premio, ni cerrada ni importada. */
export type TareaParaPremio = {
  id: string;
  titulo: string;
  tipo: TareaDoc["tipo"];
  /** «5A» o «4B y 5A» (`listaSecciones`). */
  seccion: string;
  borrador: boolean;
};

export function tareasParaPremio(
  tareas: ReadonlyArray<ConId<TareaDoc>>,
  /** Instante de la petición: una cerrada para todos ya no se elige (D453). */
  ahora?: number,
): TareaParaPremio[] {
  return tareas
    .filter((t) => t.premio === null && premioEditable(t, ahora))
    .sort(
      (a, b) =>
        ordenPremio(a, ahora) - ordenPremio(b, ahora) ||
        comparaFecha(
          a.fechaEntrega ?? "9999-12-31",
          b.fechaEntrega ?? "9999-12-31",
        ),
    )
    .map((t) => ({
      id: t.id,
      titulo: t.titulo,
      tipo: t.tipo,
      seccion: listaSecciones(t.secciones),
      borrador: t.estado === "borrador",
    }));
}

/** Texto del premio que llega del diálogo (el archivo va aparte, en el FormData). */
export const zTextoPremio = z.string().trim().min(1).max(200);

/** Qué hacer con la foto al guardar: dejarla, quitarla o poner una nueva (su clave ya subida). */
export type CambioFoto =
  | { tipo: "mantener" }
  | { tipo: "quitar" }
  | { tipo: "nueva"; clave: string };

export type PremioArmado =
  | {
      ok: true;
      campos: { premio: string; premioFoto: string | null };
      /** Foto anterior que deja de usarse: se borra de B2 después del commit. */
      anterior: string | null;
    }
  | { ok: false; error: "cerrada" | "invalida" };

/**
 * Campos que escribe «Crear / Editar premio» sobre la tarea (D266). Solo en tareas no cerradas ni
 * importadas; el documento resultante tiene que seguir validando. Guardar dos veces lo mismo deja
 * lo mismo (el doble envío no duplica nada: es un `update` del documento).
 */
export function armarPremio(
  previa: TareaDoc,
  premio: string,
  foto: CambioFoto,
  /** Instante del guardado: cerrada para todos ya no se cambia (D453). */
  ahora?: number,
): PremioArmado {
  if (!premioEditable(previa, ahora)) return { ok: false, error: "cerrada" };

  const texto = zTextoPremio.safeParse(premio);
  if (!texto.success) return { ok: false, error: "invalida" };
  const vieja = previa.premioFoto ?? null;
  const premioFoto =
    foto.tipo === "mantener"
      ? vieja
      : foto.tipo === "quitar"
        ? null
        : foto.clave;
  if (
    !zTareaDoc.safeParse({ ...previa, premio: texto.data, premioFoto }).success
  )
    return { ok: false, error: "invalida" };
  return {
    ok: true,
    campos: { premio: texto.data, premioFoto },
    anterior: vieja !== null && vieja !== premioFoto ? vieja : null,
  };
}
