// Reabrir una tarea cerrada (tanda 2026-11-20 Q4, D455–D456). Puro (sin base ni reloj): qué se
// escribe al reabrir para todos o para algunos, a quiénes se les puede dar prórroga y los textos
// del diálogo. Lo usan `lib/data/tareas.ts` (dentro de la transacción), la página del
// constructor y las pruebas.
import { z } from "zod";
import {
  estadoEfectivo,
  prorrogaDe,
  prorrogasVigentes,
  type TareaConVencimiento,
} from "@/lib/estado-tarea";
import {
  comparaFecha,
  diasEntre,
  FECHA_ENTREGA_MAX_DIAS,
  vencida,
} from "@/lib/fecha";
import {
  type Entrega,
  type Equipo,
  type Prorroga,
  type Prorrogas,
  type SeccionId,
  type TareaDoc,
  type Usuario,
  zDia,
  zHora,
  zInstante,
  zTitularId,
} from "@/lib/modelo";
import { ordenarSecciones } from "@/lib/secciones";
import {
  ERRORES,
  type ErrorTarea,
  fechaIso,
  horaValor,
} from "@/lib/tareas-profe";

/** Tope de titulares de una vez: 9 años × 26 secciones de un liceo grande caben de sobra. */
const MAX_TITULARES = 2000;

/** Ids de tarea (los de `zIdTareaProfe`, sin importar el módulo del constructor). */
const zIdTarea = z.string().regex(/^[A-Za-z0-9_-]{1,120}$/, "Id inválido");

/**
 * Lo que manda el diálogo «Reabrir tarea». `todos`: fecha y hora nuevas para todos. `algunos`: la
 * lista COMPLETA de titulares con prórroga (los que no van, la pierden) y su fecha y hora; vacía
 * quita todas. `actualizadoEn`: el de la tarea que veía el profe (D455).
 */
export const zReabrirTarea = z
  .object({
    id: zIdTarea,
    actualizadoEn: zInstante,
    para: z.enum(["todos", "algunos"]),
    fecha: zDia.nullable(),
    hora: zHora.nullable(),
    titulares: z
      .array(zTitularId)
      .max(MAX_TITULARES)
      .refine((xs) => new Set(xs).size === xs.length, "Titular repetido"),
  })
  .refine(
    (r) =>
      r.fecha !== null || (r.para === "algunos" && r.titulares.length === 0),
    "Falta la fecha",
  );
export type ReabrirTarea = z.infer<typeof zReabrirTarea>;

/** Lo que cambia en la fila de la tarea. */
export type CambiosReabrir = Pick<
  TareaDoc,
  "estado" | "fechaEntrega" | "horaEntrega"
> & { prorrogas: Prorrogas | null };

export type Reabierta =
  | { ok: true; cambios: CambiosReabrir | null }
  | { ok: false; error: ErrorTarea };

/**
 * Fecha y hora nuevas: de hoy a un año (D228) y todavía sin vencer en `ahora` (en Caracas). Sin
 * hora, al final del día (D352).
 */
export function errorVencimientoNuevo(
  fecha: string,
  hora: string | null,
  hoy: string,
  ahora: number,
): ErrorTarea | null {
  if (comparaFecha(fecha, hoy) < 0) return "fecha-pasada";
  if (diasEntre(hoy, fecha) > FECHA_ENTREGA_MAX_DIAS) return "fecha-lejana";
  if (vencida(fecha, hora, ahora)) return "hora-pasada";
  return null;
}

const mismaProrroga = (a: Prorroga | undefined, b: Prorroga) =>
  a !== undefined && a.fecha === b.fecha && a.hora === b.hora;

function mismasProrrogas(a: Prorrogas | null, b: Prorrogas | null): boolean {
  const ka = Object.keys(a ?? {});
  const kb = Object.keys(b ?? {});
  if (ka.length !== kb.length) return false;
  return kb.every((k) => {
    const p = b?.[k];
    return p !== undefined && mismaProrroga(a?.[k], p);
  });
}

/**
 * Qué escribe «Reabrir tarea» (D455, D456). Para todos: `abierta` con la fecha y hora nuevas y sin
 * prórrogas. Para algunos: el estado no cambia (sigue cerrada para los demás) y las prórrogas
 * pasan a ser exactamente las pedidas. `cambios: null` = ya estaba así (un reintento del mismo
 * pedido no falla). Solo una tarea publicada, no importada, y cerrada en `ahora` (D451); si otro
 * profe la tocó desde que se abrió el diálogo (`actualizadoEn`), `cambio`. `validos`: los titulares
 * que pueden recibir prórroga (alumnos o equipos de sus secciones).
 */
export function armarReabrir(a: {
  previa: TareaDoc & { prorrogas?: Prorrogas | undefined };
  envio: ReabrirTarea;
  validos: ReadonlySet<string>;
  hoy: string;
  ahora: number;
}): Reabierta {
  const { previa, envio, ahora } = a;
  if (previa.estado === "borrador" || previa.importada)
    return { ok: false, error: "invalida" };
  const actuales = previa.prorrogas ?? null;
  const { fecha, hora } = envio;
  const pedidas: Prorrogas | null =
    envio.para === "algunos" && envio.titulares.length > 0 && fecha
      ? Object.fromEntries(envio.titulares.map((id) => [id, { fecha, hora }]))
      : null;
  const yaEsta =
    envio.para === "todos"
      ? previa.estado === "abierta" &&
        previa.fechaEntrega === fecha &&
        (previa.horaEntrega ?? null) === hora &&
        actuales === null
      : mismasProrrogas(actuales, pedidas);
  if (yaEsta) return { ok: true, cambios: null };
  if (previa.actualizadoEn !== envio.actualizadoEn)
    return { ok: false, error: "cambio" };
  if (estadoEfectivo(previa, ahora) !== "cerrada")
    return { ok: false, error: "cambio" };
  if (fecha !== null) {
    const err = errorVencimientoNuevo(fecha, hora, a.hoy, ahora);
    if (err) return { ok: false, error: err };
  }
  if (envio.para === "todos") {
    if (fecha === null) return { ok: false, error: "invalida" };
    return {
      ok: true,
      cambios: {
        estado: "abierta",
        fechaEntrega: fecha,
        horaEntrega: hora,
        prorrogas: null,
      },
    };
  }
  if (envio.titulares.some((id) => !a.validos.has(id)))
    return { ok: false, error: "invalida" };
  return {
    ok: true,
    cambios: {
      estado: previa.estado,
      fechaEntrega: previa.fechaEntrega,
      horaEntrega: previa.horaEntrega ?? null,
      prorrogas: pedidas,
    },
  };
}

/* ---------- El formulario del diálogo ---------- */

export type ErroresReabrir = {
  fecha?: string;
  hora?: string;
  titulares?: string;
};

/**
 * Valida el diálogo al pulsar (como «Publicar», D354: `ahora` se toma al pulsar, no al pintar) y
 * arma lo que se envía. Para algunos sin nadie marcado: si había prórrogas, las quita (no pide
 * fecha); si no, falta marcar a alguien.
 */
export function validarReabrir(
  campos: {
    para: "todos" | "algunos";
    tipo: TareaDoc["tipo"];
    /** Lo de los campos: "dd/mm/aaaa" y "HH:MM" o "". */
    fecha: string;
    hora: string;
    marcados: readonly string[];
    /** ¿Tiene prórrogas vigentes? Desmarcar a todos las quita. */
    conProrrogas: boolean;
  },
  hoy: string,
  ahora: number,
):
  | { ok: true; fecha: string | null; hora: string | null }
  | { ok: false; errores: ErroresReabrir } {
  const quitaTodas = campos.para === "algunos" && campos.marcados.length === 0;
  if (quitaTodas)
    return campos.conProrrogas
      ? { ok: true, fecha: null, hora: null }
      : { ok: false, errores: { titulares: sinMarcadosError(campos.tipo) } };
  const errores: ErroresReabrir = {};
  const fecha = fechaIso(campos.fecha);
  const hora = horaValor(campos.hora);
  if (campos.hora.trim() && hora === null) errores.hora = ERRORES.hora;
  if (!fecha) errores.fecha = ERRORES.fecha;
  else {
    const err = errorVencimientoNuevo(fecha, hora, hoy, ahora);
    if (err === "fecha-pasada") errores.fecha = ERRORES.fechaPasada;
    else if (err === "fecha-lejana") errores.fecha = ERRORES.fechaLejana;
    else if (err === "hora-pasada" && !errores.hora)
      errores.hora = ERRORES.horaPasada;
  }
  if (errores.fecha || errores.hora) return { ok: false, errores };
  return { ok: true, fecha, hora };
}

/* ---------- Quiénes pueden recibir prórroga ---------- */

/** Una fila del diálogo: un alumno (individual) o un equipo (grupal) de las secciones de la tarea. */
export type TitularReabrir = {
  id: string;
  nombre: string;
  seccion: SeccionId;
  /** Ya tiene una entrega enviada (puede editarla mientras la prórroga siga). */
  entrego: boolean;
  /** Su prórroga vigente; `null` si no tiene. */
  prorroga: Prorroga | null;
};

const compara = new Intl.Collator("es", { sensitivity: "base" });

/** Ids de los titulares que pueden recibir prórroga (lo que comprueba el servidor). */
export function titularesValidos(
  tarea: Pick<TareaDoc, "tipo" | "secciones">,
  usuarios: ReadonlyArray<Pick<Usuario, "cedula" | "rol" | "seccion">>,
  equipos: ReadonlyArray<{ id: string } & Pick<Equipo, "seccion">>,
): Set<string> {
  if (tarea.tipo === "grupal")
    return new Set(
      equipos
        .filter((e) => tarea.secciones.includes(e.seccion))
        .map((e) => e.id),
    );
  return new Set(
    usuarios
      .filter(
        (u) =>
          u.rol === "estudiante" &&
          u.seccion !== null &&
          tarea.secciones.includes(u.seccion),
      )
      .map((u) => u.cedula),
  );
}

/**
 * Las filas del diálogo, por sección (en el orden del catálogo) y por nombre. Alumnos de las
 * secciones de la tarea (individual) o sus equipos (grupal), con su entrega y su prórroga vigente.
 */
export function titularesReabrir(datos: {
  tarea: Pick<TareaDoc, "tipo" | "secciones"> & TareaConVencimiento;
  usuarios: ReadonlyArray<
    Pick<Usuario, "cedula" | "rol" | "seccion" | "nombres" | "apellidos">
  >;
  equipos: ReadonlyArray<{ id: string } & Pick<Equipo, "seccion" | "nombre">>;
  entregas: ReadonlyArray<Pick<Entrega, "estado" | "titularId">>;
  ahora: number;
}): TitularReabrir[] {
  const { tarea, ahora } = datos;
  const vigentes = new Set(prorrogasVigentes(tarea, ahora));
  const entregaron = new Set(
    datos.entregas
      .filter((e) => e.estado !== "borrador")
      .map((e) => e.titularId),
  );
  const fila = (id: string, nombre: string, seccion: SeccionId) => ({
    id,
    nombre,
    seccion,
    entrego: entregaron.has(id),
    prorroga: vigentes.has(id) ? prorrogaDe(tarea, id) : null,
  });
  const filas: TitularReabrir[] =
    tarea.tipo === "grupal"
      ? datos.equipos
          .filter((e) => tarea.secciones.includes(e.seccion))
          .map((e) => fila(e.id, e.nombre, e.seccion))
      : datos.usuarios.flatMap((u) =>
          u.rol === "estudiante" &&
          u.seccion !== null &&
          tarea.secciones.includes(u.seccion)
            ? [
                fila(
                  u.cedula,
                  `${u.nombres} ${u.apellidos}`.replace(/\s+/g, " ").trim(),
                  u.seccion,
                ),
              ]
            : [],
        );
  const orden = ordenarSecciones(new Set(filas.map((f) => f.seccion)));
  return filas.sort(
    (a, b) =>
      orden.indexOf(a.seccion) - orden.indexOf(b.seccion) ||
      compara.compare(a.nombre, b.nombre),
  );
}

/* ---------- Textos del diálogo. PROVISIONAL (CONTENT_CHECKLIST filas 259–262) ---------- */

export const REABRIR_BOTON = "Reabrir tarea";
export const REABRIR_TITULO = "Reabrir tarea";
export const REABRIR_DESCRIPCION =
  "Elige quiénes pueden volver a entregar y hasta cuándo.";
export const REABRIR_PARA_TODOS = "Para todos";
export const REABRIR_PARA_ALGUNOS = "Para algunos";
export const REABRIR_LEYENDA_FECHA = "Nueva fecha y hora de entrega";

export function reabrirAyuda(
  para: "todos" | "algunos",
  tipo: TareaDoc["tipo"],
): string {
  if (para === "todos")
    return "Todos vuelven a poder entregar hasta la fecha y hora nuevas.";
  return tipo === "grupal"
    ? "Solo los equipos marcados podrán entregar hasta la fecha y hora nuevas. Desmarca un equipo para quitarle la prórroga."
    : "Solo los alumnos marcados podrán entregar hasta la fecha y hora nuevas. Desmarca a un alumno para quitarle la prórroga.";
}

/** Título de la lista de casillas. */
export function reabrirListaTitulo(tipo: TareaDoc["tipo"]): string {
  return tipo === "grupal" ? "Equipos" : "Alumnos";
}

/** «3 marcados» (nunca región viva: las casillas ya anuncian su estado). */
export function marcadosTexto(n: number): string {
  return `${n} ${n === 1 ? "marcado" : "marcados"}`;
}

export const YA_ENTREGO = "Ya entregó";

/** «Prórroga hasta 22/11/2026 · 3:00 p. m.»: lo arma el diálogo con `formatFechaHora`. */
export const PRORROGA_HASTA = "Prórroga hasta";

/** Para algunos sin nadie marcado y sin prórrogas que quitar: no hay nada que guardar. */
export function sinMarcadosError(tipo: TareaDoc["tipo"]): string {
  return tipo === "grupal"
    ? "Marca al menos un equipo."
    : "Marca al menos un alumno.";
}

export function botonConfirmarReabrir(
  para: "todos" | "algunos",
  quitaTodas: boolean,
): string {
  if (para === "todos") return "Reabrir para todos";
  return quitaTodas ? "Quitar las prórrogas" : "Guardar prórrogas";
}

export function toastReabrir(
  para: "todos" | "algunos",
  quitaTodas: boolean,
): string {
  if (para === "todos") return "Tarea reabierta para todos";
  return quitaTodas ? "Prórrogas quitadas" : "Prórrogas guardadas";
}
