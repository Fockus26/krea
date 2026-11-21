// De los documentos de Firestore a las props de las pantallas del estudiante (fase 07, D189).
// Puro: sin Firebase ni reloj. Lo lee el DAL (`lib/datos/estudiante.ts`) en el servidor y lo
// prueban los tests. Los datos demo (`lib/demo/*`) quedan solo para las galerías.

import type { QuestionAnswer } from "@/components/krea/question-card-detail";
import type { NavUsuario } from "@/components/layout/nav-types";
import type { DatosEquipo } from "@/components/sections/equipo/team-hero";
import type { Integrante } from "@/components/sections/equipo/team-members";
import type { PremioGanado } from "@/components/sections/equipo/team-prizes";
import type { FilaPendiente } from "@/components/sections/inicio/pending-tasks";
import type { FilaNota } from "@/components/sections/inicio/recent-grades";
import type { ResumenEquipo } from "@/components/sections/inicio/team-summary";
import type { PreguntaDetalle } from "@/components/sections/notas/question-list";
import type { FilaEntregada } from "@/components/sections/tareas/delivered-tasks";
import type { ParteDeIntegrante } from "@/components/sections/tareas/partes-integrante";
import type { FilaRepartoPanel } from "@/components/sections/tareas/reparto-panel";
import type { PreguntaEntrega } from "@/components/sections/tareas/task-answer-form";
import { type DicebearEstilo, esEstiloDicebear } from "@/lib/dicebear";
import { faltanRespuestas, inicialEdicion, yaEnviada } from "@/lib/entregas";
import { enJuegoTexto, ganadoresPremio, premioGanadoTexto } from "@/lib/equipo";
import { estadoEn, vencimientoDe } from "@/lib/estado-tarea";
import {
  claveVencimiento,
  comparaFecha,
  diaDeInstante,
  formatFecha,
  formatFechaHora,
  horaDeInstante,
  vencida,
} from "@/lib/fecha";
import { formatNota, puntosRanking } from "@/lib/grades";
import {
  capitanTexto,
  equipoChipTexto,
  equipoMetaTexto,
  lineaPendientes,
  puestoTexto,
} from "@/lib/inicio";
import {
  type Ajuste,
  type Entrega,
  type Equipo,
  type Parte,
  type RankingSeccion,
  rutasImagen,
  type Tarea,
  type Usuario,
} from "@/lib/modelo";
import { fechaNotaTexto, NO_PARTICIPASTE, promedioNotas } from "@/lib/notas";
import {
  aceptadas,
  avisoSinParteTexto,
  PARTE_IMAGEN_SIN_VISTA,
  PARTE_SIN_NOMBRE,
  partesDeIntegrante,
  partesVigentes,
  type RespuestaParte,
  repartoCapitan,
  sinParteDe,
} from "@/lib/partes";
import {
  baseChipTexto,
  capitanChipTexto,
  cedulaTexto,
  partirNombre,
} from "@/lib/perfil";
import { imagenesConAlt, respuestaFirmada } from "@/lib/question";
import { primerApellido, rankCompetition } from "@/lib/ranking";
import {
  baseDeIntegrante,
  noParticipo,
  notaDeIntegrante,
} from "@/lib/ranking-datos";
import {
  entregadaTexto,
  eyebrowTarea,
  puntosPreguntasTexto,
  venceTexto,
} from "@/lib/tareas";
import type { TitulosTopbar } from "@/lib/topbar";

export type ConId<T> = { id: string } & T;

/* ---------- Grupal por partes (D422) ---------- */

/** Lo que pinta /tareas/[tarea] del reparto: el panel del capitán o las partes del integrante. */
export type RepartoVista =
  | {
      modo: "capitan";
      filas: FilaRepartoPanel[];
      /** A quién se puede asignar: el equipo sin el capitán. */
      integrantes: Array<{ cedula: string; nombre: string }>;
      /** Lo aceptado, para precargar su formulario (D418). */
      inicial: ReturnType<typeof inicialEdicion>;
      prioridad: string[];
      /** Mayor `actualizadoEn` de lo aceptado: la `key` que remonta el formulario. */
      version: number;
      /** Confirmación de «Entregar»: quién quedará «No participó» (D420). */
      aviso: string | null;
    }
  | { modo: "integrante"; partes: ParteDeIntegrante[]; capitan: string }
  | null;

type EntradaReparto = {
  vista: EntregaVista;
  usuario: Pick<Usuario, "cedula" | "nombres">;
  equipo: Pick<Equipo, "capitanId"> | null;
  companeros: readonly Companero[];
  partes: readonly Parte[];
};

/** Solo hay reparto en una grupal abierta y sin enviar: responder (capitán) o lector. */
function conReparto(
  v: EntregaVista,
): v is Extract<EntregaVista, { estado: "responder" | "lector" }> {
  return (
    (v.estado === "responder" || v.estado === "lector") && v.tipo === "grupal"
  );
}

/**
 * Las imágenes del reparto que la página firma: todas las entregadas para el capitán, solo las
 * suyas para el integrante (D423).
 */
export function rutasReparto(e: EntradaReparto): string[] {
  if (!conReparto(e.vista) || !e.equipo) return [];
  const miembros = e.companeros.map((c) => c.cedula);
  const capitanId = e.equipo.capitanId;
  const esCapitan = e.vista.estado === "responder";
  return partesVigentes(e.partes, miembros, capitanId).flatMap((p) =>
    esCapitan || p.asignado === e.usuario.cedula
      ? rutasImagen(p.respuesta)
      : [],
  );
}

/** Respuesta de una parte, firmada para mostrarla. */
function parteFirmada(
  r: RespuestaParte,
  autor: string,
  numero: number,
  urls: ReadonlyMap<string, string>,
): QuestionAnswer {
  if (r.tipo === "texto" || r.tipo === "url") return r;
  return (
    respuestaFirmada(imagenesConAlt(r.imagenPaths, autor, numero), urls) ?? {
      tipo: "texto",
      texto: PARTE_IMAGEN_SIN_VISTA,
    }
  );
}

/**
 * /tareas/[tarea] con reparto (D422): `capitan` ve el panel y su formulario precargado con lo
 * aceptado; `integrante` (con al menos una pregunta suya) ve sus partes; si no, `null` (como hoy).
 */
export function repartoVista(
  e: EntradaReparto & { urls: ReadonlyMap<string, string> },
): RepartoVista {
  const v = e.vista;
  if (!conReparto(v) || !e.equipo) return null;
  const capitanId = e.equipo.capitanId;
  const miembros = e.companeros.map((c) => c.cedula);
  const persona = new Map(e.companeros.map((c) => [c.cedula, c]));
  const corto = (cedula: string | null) => {
    const c = cedula ? persona.get(cedula) : undefined;
    return c ? nombreCorto(c) : PARTE_SIN_NOMBRE;
  };

  if (v.estado === "responder") {
    const acept = aceptadas(e.partes, miembros, capitanId);
    const vigentes = partesVigentes(e.partes, miembros, capitanId);
    return {
      modo: "capitan",
      filas: repartoCapitan(v.preguntas, e.partes, miembros, capitanId).map(
        (f, i) => ({
          preguntaId: f.preguntaId,
          numero: i + 1,
          enunciado: v.preguntas[i]?.enunciado ?? "",
          asignado: f.asignado,
          estado: f.estado,
          respuesta: f.respuesta
            ? parteFirmada(f.respuesta, corto(f.asignado), i + 1, e.urls)
            : null,
        }),
      ),
      integrantes: e.companeros
        .filter((c) => c.cedula !== capitanId)
        .map((c) => ({ cedula: c.cedula, nombre: nombreCorto(c) })),
      inicial: inicialEdicion(
        v.preguntas,
        v.preguntas.map((p) => acept.respuestas[p.id] ?? null),
        e.urls,
      ),
      prioridad: Object.keys(acept.respuestas),
      version: acept.version,
      aviso: avisoSinParteTexto(
        sinParteDe(vigentes, miembros, e.usuario.cedula).map(corto),
      ),
    };
  }

  const mias = partesDeIntegrante(
    v.preguntas,
    e.partes,
    miembros,
    capitanId,
    e.usuario.cedula,
  );
  if (!mias) return null;
  const capitan = primerNombre(persona.get(capitanId ?? "")?.nombres ?? "");
  const yo = primerNombre(e.usuario.nombres);
  return {
    modo: "integrante",
    capitan: capitan || "el capitán",
    partes: mias.map((m, i): ParteDeIntegrante => {
      if (!m.mia) {
        const quien = m.asignado ? persona.get(m.asignado) : undefined;
        return {
          mia: false,
          bloqueadaPor:
            primerNombre(quien?.nombres ?? "") || capitan || "el capitán",
        };
      }
      const p = v.preguntas[i];
      const inicial =
        p && m.respuesta
          ? inicialEdicion([p], [m.respuesta], e.urls)[p.id]
          : undefined;
      return {
        mia: true,
        estado: m.estado,
        inicial:
          inicial === undefined
            ? null
            : typeof inicial === "string"
              ? inicial
              : Array.isArray(inicial)
                ? inicial
                : [inicial],
        respuesta: m.respuesta
          ? parteFirmada(m.respuesta, yo, i + 1, e.urls)
          : null,
      };
    }),
  };
}

/** Lo que el servidor lee para un estudiante (todo de su sección y lo suyo). */
export type DatosAlumno = {
  usuario: Usuario;
  equipo: ConId<Equipo> | null;
  /** Tareas visibles: de su sección y no borrador. */
  tareas: ReadonlyArray<ConId<Tarea>>;
  /** Entregas en las que figura como integrante (individuales y grupales). */
  entregas: ReadonlyArray<ConId<Entrega>>;
  /** Sus ajustes de puntos (destino alumno). */
  ajustes: ReadonlyArray<Ajuste>;
  /** `ranking/{seccion}`; `null` si aún no existe. */
  ranking: RankingSeccion | null;
};

/** Estilo de avatar por defecto si el guardado no es uno de los 4 (D010). */
const ESTILO_DEFECTO: DicebearEstilo = "adventurer-neutral";

export function estiloDe(estilo: string): DicebearEstilo {
  return esEstiloDicebear(estilo) ? estilo : ESTILO_DEFECTO;
}

const primerNombre = (nombres: string) => nombres.trim().split(/\s+/)[0] ?? "";

/** "Yeilin Duarte": primer nombre + primer apellido. */
export function nombreCorto(u: Pick<Usuario, "nombres" | "apellidos">): string {
  return `${primerNombre(u.nombres)} ${primerApellido(u.apellidos)}`;
}

export function nombreCompleto(
  u: Pick<Usuario, "nombres" | "apellidos">,
): string {
  return `${u.nombres} ${u.apellidos}`;
}

/** Usuario de la topbar y la barra lateral. */
export function navUsuarioDe(u: Usuario): NavUsuario {
  return {
    nombre: nombreCorto(u),
    estilo: estiloDe(u.avatar.estilo),
    seed: u.avatar.semilla,
  };
}

const TIPO_TAREA = {
  individual: "Tarea individual",
  grupal: "Tarea grupal",
} as const;

/** Títulos de la topbar móvil de las rutas con datos (D128), con las tareas reales. */
export function titulosTopbarDe(
  tareas: ReadonlyArray<ConId<Pick<Tarea, "titulo" | "tipo">>>,
): TitulosTopbar {
  return Object.fromEntries(
    tareas.flatMap((t) => [
      [`/notas/${t.id}`, t.titulo],
      [`/tareas/${t.id}`, TIPO_TAREA[t.tipo]],
    ]),
  );
}

/* ---------- Notas ---------- */

export type NotaAlumno = {
  tarea: ConId<Tarea>;
  /** Su entrega (la individual o la grupal donde figura); `null` si no hay. */
  entrega: ConId<Entrega> | null;
  /** Puntaje sobre 20 sin base; `null` = Pendiente (D003). */
  puntaje: number | null;
  /** Nota final con su base (D013, D177); `null` = Pendiente. */
  nota: number | null;
  /** Base de esa nota: la que guardó la evaluación (D403); si no, o pendiente, su base vigente. */
  base: number;
  /** Grupal evaluada en la que el profe lo marcó «No participó»: su nota es 1 fija (D365). */
  noParticipo: boolean;
  /** Día ISO: de evaluación si está evaluada, si no de entrega (o `null` sin fecha). */
  fecha: string | null;
};

function entregaDe(
  tareaId: string,
  entregas: ReadonlyArray<ConId<Entrega>>,
): ConId<Entrega> | null {
  return entregas.find((e) => e.tareaId === tareaId) ?? null;
}

/** Promedio de sus notas evaluadas (`null` si no tiene ninguna); el de la leyenda y el mensaje del día. */
export function promedioDelAlumno(
  d: Pick<DatosAlumno, "usuario" | "tareas" | "entregas">,
): number | null {
  return promedioNotas(notasDelAlumno(d).map((n) => n.nota));
}

/**
 * Notas del alumno en el orden de §3 Mis notas: evaluadas (más reciente primero), luego
 * pendientes por fecha de entrega (sin fecha al final).
 */
export function notasDelAlumno(
  d: Pick<DatosAlumno, "usuario" | "tareas" | "entregas">,
): NotaAlumno[] {
  const notas = d.tareas.map((tarea): NotaAlumno => {
    const entrega = entregaDe(tarea.id, d.entregas);
    const ev = entrega?.estado === "evaluada" ? entrega.evaluacion : null;
    if (entrega && ev) {
      return {
        tarea,
        entrega,
        puntaje: ev.puntaje,
        nota: notaDeIntegrante(entrega, d.usuario.base, d.usuario.cedula),
        base: baseDeIntegrante(entrega, d.usuario.cedula, d.usuario.base),
        noParticipo: noParticipo(entrega, d.usuario.cedula),
        fecha: diaDeInstante(ev.evaluadaEn),
      };
    }
    return {
      tarea,
      entrega,
      puntaje: null,
      nota: null,
      base: d.usuario.base,
      noParticipo: false,
      fecha: tarea.fechaEntrega,
    };
  });
  const orden = (a: string | null, b: string | null) =>
    a === null ? (b === null ? 0 : 1) : b === null ? -1 : comparaFecha(a, b);
  const evaluadas = notas
    .filter((n) => n.nota !== null)
    .sort((a, b) => orden(b.fecha, a.fecha));
  // Pendientes: la que vence antes primero, el mismo día por hora (D352)
  const vence = (n: NotaAlumno) =>
    claveVencimiento(n.fecha, n.tarea.horaEntrega) ?? "9999";
  const pendientes = notas
    .filter((n) => n.nota === null)
    .sort((a, b) => (vence(a) < vence(b) ? -1 : vence(a) > vence(b) ? 1 : 0));
  return [...evaluadas, ...pendientes];
}

/**
 * Equipo que se nombra en una fila grupal: el de la entrega (D308) — su equipo actual si es el
 * mismo; si el equipo se eliminó, el nombre que tenía (`titularNombre`). Sin entrega, el equipo
 * actual (con él la entregará). Una entrega de otro equipo que sigue vivo no lo nombra.
 */
function equipoDeFila(
  n: NotaAlumno,
  equipo: Pick<ConId<Equipo>, "id" | "nombre"> | null,
): string | undefined {
  if (n.tarea.tipo !== "grupal") return undefined;
  if (!n.entrega || n.entrega.titularId === equipo?.id) return equipo?.nombre;
  return n.entrega.titularNombre;
}

function filaNota(
  n: NotaAlumno,
  equipo: Pick<ConId<Equipo>, "id" | "nombre"> | null,
  ahora?: number,
): FilaNota {
  return {
    id: n.tarea.id,
    href: `/notas/${n.tarea.id}`,
    titulo: n.tarea.titulo,
    tipo: n.tarea.tipo,
    detalle: equipoDeFila(n, equipo),
    fecha: n.fecha
      ? fechaNotaTexto(n.nota !== null, n.fecha, n.tarea.horaEntrega, ahora)
      : "sin fecha",
    nota: n.nota,
    // La base de esa entrega (D403) escala también las grupales, por integrante (D177); el 1
    // de «No participó» no lleva base (D365): sin chip
    base: n.noParticipo ? undefined : n.base,
    aviso: n.noParticipo ? NO_PARTICIPASTE : undefined,
  };
}

/** Filas de Mis notas. `ahora`: para «vence» / «venció» de las pendientes (D357). */
export function filasMisNotas(
  d: Pick<DatosAlumno, "usuario" | "equipo" | "tareas" | "entregas">,
  ahora?: number,
): FilaNota[] {
  return notasDelAlumno(d).map((n) => filaNota(n, d.equipo, ahora));
}

/* ---------- Detalle de nota ---------- */

/** PLACEHOLDER de copy (CONTENT_CHECKLIST fila 127): respuesta que no está en la entrega. */
export const RESPUESTA_SIN_REGISTRO = "Esta nota se cargó sin tus respuestas.";
/** PLACEHOLDER de copy (fila 127): la imagen se verá cuando Storage esté conectado (W5). */
export const RESPUESTA_IMAGEN = "Respondiste con una imagen.";

export type DetalleVista =
  | { estado: "no-existe" }
  | { estado: "sin-detalle"; tipo: Tarea["tipo"]; titulo: string }
  | {
      estado: "ok";
      tipo: Tarea["tipo"];
      eyebrow: string;
      titulo: string;
      puntaje: number;
      base: number;
      final: number;
      /** El profe lo marcó «No participó» en esta grupal: `final` es 1 fija, sin base (D365). */
      noParticipo: boolean;
      /** Quién respondió, para el `alt` de las imágenes: su primer nombre o «tu equipo». */
      autor: string;
      /** Comentario general del profe (D445); ausente si no dejó. */
      comentarioGeneral?: string;
      /** Vacío si la nota vino del Excel sin desglose. */
      /** `imagenPaths`: rutas de la respuesta en imagen (una o varias, D373), sin firmar. */
      preguntas: Array<PreguntaDetalle & { imagenPaths?: string[] }>;
    };

/**
 * Detalle de una nota: `no-existe` (no es una tarea visible para él → 404), `sin-detalle`
 * (todavía no está evaluada) u `ok`. `profes`: cédula → nombre de quien evaluó (D447,
 * `evaluadoresDeTarea`); el eyebrow lleva solo su nombre corto, nunca la cédula (D380, D388).
 * Sin evaluador conocido (Excel, seed, una cuenta que ya no existe), el eyebrow va sin «por».
 */
export function detalleNota(
  d: Pick<DatosAlumno, "usuario" | "tareas" | "entregas">,
  tareaId: string,
  profes: ReadonlyMap<
    string,
    Pick<Usuario, "nombres" | "apellidos">
  > = new Map(),
): DetalleVista {
  const tarea = d.tareas.find((t) => t.id === tareaId);
  if (!tarea) return { estado: "no-existe" };
  const entrega = entregaDe(tarea.id, d.entregas);
  const ev = entrega?.estado === "evaluada" ? entrega.evaluacion : null;
  const final = entrega
    ? notaDeIntegrante(entrega, d.usuario.base, d.usuario.cedula)
    : null;
  if (!entrega || !ev || final === null) {
    return { estado: "sin-detalle", tipo: tarea.tipo, titulo: tarea.titulo };
  }
  const tipo = tarea.tipo === "grupal" ? "Grupal" : "Individual";
  const puntos = ev.puntos;
  const profe = ev.evaluadaPor ? profes.get(ev.evaluadaPor) : undefined;
  // PROVISIONAL (CONTENT_CHECKLIST fila 251): «… por Ana Pérez»
  const por = profe ? ` por ${nombreCorto(profe)}` : "";
  const general = ev.comentarioGeneral?.trim();
  return {
    estado: "ok",
    tipo: tarea.tipo,
    eyebrow: `${tipo} · evaluada el ${formatFecha(diaDeInstante(ev.evaluadaEn))}${por}`,
    ...(general ? { comentarioGeneral: general } : {}),
    titulo: tarea.titulo,
    puntaje: ev.puntaje,
    base: baseDeIntegrante(entrega, d.usuario.cedula, d.usuario.base),
    final,
    noParticipo: noParticipo(entrega, d.usuario.cedula),
    autor:
      tarea.tipo === "individual" || entrega.enviadaPor === d.usuario.cedula
        ? primerNombre(d.usuario.nombres)
        : "tu equipo",
    preguntas: puntos
      ? tarea.preguntas.map((p) => {
          const r = entrega.respuestas[p.id];
          const comentario = ev.comentarios[p.id]?.trim();
          return {
            id: p.id,
            enunciado: p.enunciado,
            valor: p.valor,
            obtenido: puntos[p.id] ?? 0,
            respuesta: !r
              ? RESPUESTA_SIN_REGISTRO
              : "texto" in r
                ? r.texto.trim() || RESPUESTA_SIN_REGISTRO
                : "url" in r
                  ? r.url
                  : RESPUESTA_IMAGEN,
            // Enlace (D468): la tarjeta lo pinta como enlace externo si pasa `hrefSeguro`
            ...(r && "url" in r ? { enlace: r.url } : {}),
            // La página la cambia por la imagen con una URL firmada (D195); si no, queda el texto
            ...(rutasImagen(r).length > 0
              ? { imagenPaths: rutasImagen(r) }
              : {}),
            comentario: comentario || undefined,
          };
        })
      : [],
  };
}

/* ---------- Ranking ---------- */

type PuestoDe = { puesto: number; total: number; puntos: number };

/** Puesto de un alumno en el ranking de su sección; `null` si no figura. */
export function puestoAlumno(
  ranking: RankingSeccion | null,
  cedula: string,
): PuestoDe | null {
  if (!ranking) return null;
  const filas = rankCompetition(
    Object.entries(ranking.alumnos).map(([id, f]) => ({
      id,
      puntos: f.puntos,
      primerApellido: primerApellido(f.apellidos),
    })),
  );
  const f = filas.find((x) => x.id === cedula);
  return f ? { puesto: f.puesto, total: filas.length, puntos: f.puntos } : null;
}

/** Puesto de un equipo en el ranking de equipos de su sección. */
export function puestoEquipo(
  ranking: RankingSeccion | null,
  equipoId: string,
): PuestoDe | null {
  if (!ranking) return null;
  const filas = rankCompetition(
    Object.entries(ranking.equipos).map(([id, f]) => ({
      id,
      puntos: f.puntos,
      primerApellido: f.nombre,
    })),
  );
  const f = filas.find((x) => x.id === equipoId);
  return f ? { puesto: f.puesto, total: filas.length, puntos: f.puntos } : null;
}

/* ---------- Inicio ---------- */

/** Cuántas notas muestra Inicio antes de «Ver todas». */
export const NOTAS_EN_INICIO = 3;

const sumaDecimas = (ns: readonly number[]) =>
  ns.reduce((s, n) => s + Math.round(n * 10), 0) / 10;

/**
 * Desglose de la tarjeta de puntos con lo que aporta cada parte (D007): las notas de 10 o más,
 * con su base, y los ajustes de conducta. Suma lo mismo que `puntosDeAlumno`.
 * "18,5 de tu nota individual + 19 de la grupal. Las notas menores de 10 no suman."
 * Plurales y «por conducta»: PLACEHOLDER de copy (CONTENT_CHECKLIST fila 127).
 */
export function desgloseReal(
  notas: ReadonlyArray<Pick<NotaAlumno, "nota"> & { tipo: Tarea["tipo"] }>,
  ajustes: ReadonlyArray<Pick<Ajuste, "valor">>,
  tieneEquipo: boolean,
): string {
  const evaluadas = notas.filter((n) => n.nota !== null);
  const ind = evaluadas.filter((n) => n.tipo === "individual");
  const gru = evaluadas.filter((n) => n.tipo === "grupal");
  const aporte = (ns: typeof evaluadas) =>
    formatNota(sumaDecimas(ns.map((n) => puntosRanking(n.nota))));
  const partes = [
    `${aporte(ind)} de ${ind.length > 1 ? "tus notas individuales" : "tu nota individual"}`,
  ];
  if (tieneEquipo || gru.length > 0) {
    partes.push(
      `${aporte(gru)} de ${gru.length > 1 ? "las grupales" : "la grupal"}`,
    );
  }
  const conducta = sumaDecimas(ajustes.map((a) => a.valor));
  let texto = partes.join(" + ");
  if (conducta !== 0) {
    texto += ` ${conducta < 0 ? "−" : "+"} ${formatNota(Math.abs(conducta))} por conducta`;
  }
  return `${texto}. Las notas menores de 10 no suman.`;
}

export type InicioVista = {
  saludo: { eyebrow: string; titulo: string; linea: string };
  /** `null` si el ranking de su sección aún no existe o no figura en él. */
  puntos: {
    puntos: number;
    puesto: number;
    total: number;
    seccion: string;
    desglose: string;
    deltaSemana: number;
  } | null;
  notas: FilaNota[];
  pendientes: FilaPendiente[];
  equipo: ResumenEquipo | null;
};

/** Titular del alumno en la tarea: su cédula o su equipo de hoy (D221), el id de la prórroga (D452). */
const titularDe = (
  d: Pick<DatosAlumno, "usuario" | "equipo">,
  t: Pick<Tarea, "tipo">,
): string | null =>
  t.tipo === "individual" ? d.usuario.cedula : (d.equipo?.id ?? null);

/** ¿Abierta para este alumno en `ahora`? Vencida sin prórroga suya = cerrada (D451, D452). */
const abiertaPara = (
  d: Pick<DatosAlumno, "usuario" | "equipo">,
  t: Tarea,
  ahora: number | undefined,
) => estadoEn(t, ahora, titularDe(d, t)) === "abierta";

/** Su fecha y hora de entrega: las de su prórroga si la tiene (D452). */
const vencimientoPara = (
  d: Pick<DatosAlumno, "usuario" | "equipo">,
  t: Tarea,
) => vencimientoDe(t, titularDe(d, t));

/**
 * Tareas abiertas para el alumno en `ahora` (D451: una vencida ya no, salvo prórroga suya) sin
 * enviar (sin entrega o en borrador), por su fecha de entrega. Sin `ahora`, el estado guardado.
 */
export function tareasAbiertas(
  d: Pick<DatosAlumno, "usuario" | "equipo" | "tareas" | "entregas">,
  ahora?: number,
): Array<ConId<Tarea>> {
  const clave = (t: Tarea) => {
    const v = vencimientoPara(d, t);
    return claveVencimiento(v.fecha, v.hora) ?? "9999";
  };
  return d.tareas
    .filter((t) => abiertaPara(d, t, ahora))
    .filter((t) => {
      return !enviada(entregaDe(t.id, d.entregas), t, true);
    })
    .sort((a, b) => {
      // La que vence antes primero; el mismo día, por hora (sin hora = al final del día, D352)
      const va = clave(a);
      const vb = clave(b);
      return va < vb ? -1 : va > vb ? 1 : 0;
    });
}

/** Filas «Por entregar» de Inicio y de /tareas. `ahora`: para «venció» por fecha y hora (D357). */
export function filasPorEntregar(
  d: Pick<DatosAlumno, "usuario" | "equipo" | "tareas" | "entregas">,
  ahora?: number,
): FilaPendiente[] {
  const capitan = d.equipo?.capitanId === d.usuario.cedula;
  return tareasAbiertas(d, ahora).map((t) => {
    const v = vencimientoPara(d, t);
    return {
      id: t.id,
      href: `/tareas/${t.id}`,
      titulo: t.titulo,
      tipo: t.tipo,
      vence: v.fecha ? formatFechaHora(v.fecha, v.hora) : "sin fecha",
      vencida:
        ahora !== undefined &&
        v.fecha !== null &&
        vencida(v.fecha, v.hora, ahora),
      premio: t.premio ?? undefined,
      entregasTu: t.tipo === "grupal" && capitan,
      avance:
        entregaDe(t.id, d.entregas)?.estado === "borrador"
          ? "borrador"
          : "sin-empezar",
    };
  });
}

/** Integrantes actuales de un equipo con sus puntos del ranking. */
export type Companero = Pick<
  Usuario,
  "cedula" | "nombres" | "apellidos" | "avatar"
>;

/** Capitán primero; después por puntos (desc) y primer apellido (HANDOFF §3 Mi equipo). */
export function ordenarIntegrantes<T extends Companero>(
  miembros: readonly T[],
  capitanId: string | null,
  puntos: (cedula: string) => number,
): T[] {
  const comp = new Intl.Collator("es", { sensitivity: "base" });
  return [...miembros].sort(
    (a, b) =>
      Number(b.cedula === capitanId) - Number(a.cedula === capitanId) ||
      puntos(b.cedula) - puntos(a.cedula) ||
      comp.compare(primerApellido(a.apellidos), primerApellido(b.apellidos)),
  );
}

const puntosEnRanking = (ranking: RankingSeccion | null) => (c: string) =>
  ranking?.alumnos[c]?.puntos ?? 0;

export function inicioVista(
  d: DatosAlumno,
  companeros: readonly Companero[],
  /** Instante de la petición: «vence» / «venció» por fecha y hora (D357). */
  ahora?: number,
): InicioVista {
  const u = d.usuario;
  const notas = notasDelAlumno(d);
  const abiertas = tareasAbiertas(d, ahora);
  const fila = puestoAlumno(d.ranking, u.cedula);
  const capitan = d.equipo?.capitanId === u.cedula;

  let equipo: ResumenEquipo | null = null;
  if (d.equipo) {
    const eq = d.equipo;
    const pe = puestoEquipo(d.ranking, eq.id);
    const miembros = ordenarIntegrantes(
      companeros,
      eq.capitanId,
      puntosEnRanking(d.ranking),
    );
    const cap = miembros.find((m) => m.cedula === eq.capitanId);
    equipo = {
      id: eq.id,
      nombre: eq.nombre,
      tema: eq.tema,
      chip: pe ? equipoChipTexto(pe.puesto, pe.total, pe.puntos) : "",
      meta: equipoMetaTexto(eq.tema, miembros.length),
      integrantes: miembros.map((m) => ({
        id: m.cedula,
        nombre: nombreCorto(m),
        estilo: estiloDe(m.avatar.estilo),
        seed: m.avatar.semilla,
      })),
      // El género no está en los datos (D075): «Capitán» por defecto
      capitan: capitanTexto(cap ? nombreCorto(cap) : "—", capitan),
    };
  }

  return {
    saludo: {
      eyebrow: `Sección ${u.seccion ?? ""} · Escuela Creativa`,
      titulo: `¡Hola, ${primerNombre(u.nombres)}!`,
      linea: lineaPendientes(
        abiertas.flatMap((t) => {
          const v = vencimientoPara(d, t);
          return v.fecha ? [{ fecha: v.fecha, hora: v.hora }] : [];
        }),
        ahora,
      ),
    },
    puntos: fila
      ? {
          puntos: fila.puntos,
          puesto: fila.puesto,
          total: fila.total,
          seccion: u.seccion ?? "",
          desglose: desgloseReal(
            notas.map((n) => ({ nota: n.nota, tipo: n.tarea.tipo })),
            d.ajustes,
            d.equipo !== null,
          ),
          // Sin historial de puestos todavía: sin chip semanal (CONTENT_CHECKLIST fila 128)
          deltaSemana: 0,
        }
      : null,
    notas: notas
      .filter((n) => n.nota !== null)
      .slice(0, NOTAS_EN_INICIO)
      .map((n) => filaNota(n, d.equipo, ahora)),
    pendientes: filasPorEntregar(d, ahora),
    equipo,
  };
}

/* ---------- Mi equipo ---------- */

export type EquipoVista = {
  equipo: DatosEquipo;
  integrantes: Integrante[];
  notas: Array<FilaNota & { enJuego?: string }>;
  premios: PremioGanado[];
};

/**
 * Mi equipo. `entregasGrupales`: las grupales de su sección (todas, para saber quién ganó cada
 * premio); el estudiante nunca las recibe, solo el resultado.
 */
export function equipoVista(
  d: Pick<DatosAlumno, "usuario" | "equipo" | "tareas" | "ranking">,
  companeros: readonly Companero[],
  entregasGrupales: ReadonlyArray<Entrega>,
  /** Para «vence» / «venció» de las notas pendientes (D357). */
  ahora?: number,
): EquipoVista | null {
  const eq = d.equipo;
  if (!eq) return null;
  const puntos = puntosEnRanking(d.ranking);
  const miembros = ordenarIntegrantes(companeros, eq.capitanId, puntos);
  const pe = puestoEquipo(d.ranking, eq.id);
  const grupales = d.tareas.filter((t) => t.tipo === "grupal");
  const notaDe = (tareaId: string, equipoId: string): number | null => {
    const e = entregasGrupales.find(
      (x) => x.tareaId === tareaId && x.titularId === equipoId,
    );
    return e?.estado === "evaluada" && e.evaluacion
      ? e.evaluacion.puntaje
      : null;
  };
  const fechaDe = (tareaId: string): string | null => {
    const e = entregasGrupales.find(
      (x) => x.tareaId === tareaId && x.titularId === eq.id,
    );
    return e?.evaluacion ? diaDeInstante(e.evaluacion.evaluadaEn) : null;
  };

  const filas = grupales
    .map((t) => {
      const nota = notaDe(t.id, eq.id);
      return { t, nota, fecha: nota !== null ? fechaDe(t.id) : t.fechaEntrega };
    })
    .sort((a, b) =>
      a.nota !== null && b.nota === null
        ? -1
        : a.nota === null && b.nota !== null
          ? 1
          : comparaFecha(b.fecha ?? "0001-01-01", a.fecha ?? "0001-01-01"),
    );

  return {
    equipo: {
      id: eq.id,
      nombre: eq.nombre,
      tema: eq.tema,
      eyebrowSeccion: eq.seccion,
      meta: equipoMetaTexto(eq.tema, miembros.length),
      puesto: pe ? puestoTexto(pe.puesto, pe.total) : "—",
      puntos: pe?.puntos ?? 0,
    },
    integrantes: miembros.map((m) => ({
      id: m.cedula,
      nombre: nombreCompleto(m),
      estilo: estiloDe(m.avatar.estilo),
      seed: m.avatar.semilla,
      puntos: puntos(m.cedula),
      esTu: m.cedula === d.usuario.cedula,
      esCapitan: m.cedula === eq.capitanId,
    })),
    notas: filas.map(({ t, nota, fecha }) => ({
      id: t.id,
      href: `/notas/${t.id}`,
      titulo: t.titulo,
      tipo: "grupal" as const,
      fecha: fecha
        ? fechaNotaTexto(
            nota !== null,
            fecha,
            nota !== null ? null : t.horaEntrega,
            ahora,
          )
        : "sin fecha",
      nota,
      enJuego: nota === null && t.premio ? enJuegoTexto(t.premio) : undefined,
    })),
    premios: filas.flatMap(({ t, nota }) => {
      if (!t.premio || nota === null) return [];
      const rivales = [
        ...new Set(
          entregasGrupales
            .filter((e) => e.tareaId === t.id)
            .map((e) => e.titularId),
        ),
      ].map((id) => ({ id, nota: notaDe(t.id, id) }));
      return ganadoresPremio(
        rivales,
        t.decisionesPremio?.[eq.seccion],
      ).includes(eq.id)
        ? [
            {
              id: t.id,
              premio: t.premio,
              detalle: premioGanadoTexto(t.titulo, nota),
            },
          ]
        : [];
    }),
  };
}

/* ---------- Perfil ---------- */

export function perfilVista(u: Usuario, equipo: ConId<Equipo> | null) {
  const [primerN, segundoN] = partirNombre(u.nombres);
  const [primerA, segundoA] = partirNombre(u.apellidos);
  return {
    nombre: nombreCompleto(u),
    estilo: estiloDe(u.avatar.estilo),
    seed: u.avatar.semilla,
    cedula: cedulaTexto(u.cedula),
    seccion: `Sección ${u.seccion ?? ""}`,
    // El género no está en los datos (D075): «Capitán» por defecto
    capitan:
      equipo && equipo.capitanId === u.cedula
        ? capitanChipTexto(equipo.id)
        : undefined,
    base: baseChipTexto(u.base),
    campos: [
      { id: "primer-nombre", label: "Primer nombre", valor: primerN },
      { id: "segundo-nombre", label: "Segundo nombre", valor: segundoN },
      { id: "primer-apellido", label: "Primer apellido", valor: primerA },
      { id: "segundo-apellido", label: "Segundo apellido", valor: segundoA },
    ],
  };
}

/* ---------- Tareas y entrega (W5) ---------- */

/**
 * Entregada o evaluada: ya no se puede cambiar. Salvo la que tiene nota y le faltan las respuestas
 * (tarea 1, `faltanRespuestas`): mientras la tarea siga abierta para él (`abierta`, D451), cuenta
 * como «por entregar».
 */
const enviada = (
  e: Pick<Entrega, "estado" | "respuestas"> | null,
  t: Pick<Tarea, "preguntas">,
  abierta: boolean,
) => yaEnviada(e) && !(abierta && faltanRespuestas(e, t.preguntas));

/**
 * /tareas: «Por entregar» (las filas de Inicio) y «Entregadas» (sus entregas enviadas, la más
 * reciente primero). Una nota del Excel sin fecha de envío muestra la de evaluación (D197).
 */
export function tareasVista(
  d: Pick<DatosAlumno, "usuario" | "equipo" | "tareas" | "entregas">,
  /** Para «venció» por fecha y hora en «Por entregar» (D357). */
  ahora?: number,
): { pendientes: FilaPendiente[]; entregadas: FilaEntregada[] } {
  const filas = d.tareas.flatMap((t) => {
    const e = entregaDe(t.id, d.entregas);
    if (!e || !enviada(e, t, abiertaPara(d, t, ahora))) return [];
    const evaluada = e.evaluacion?.evaluadaEn ?? null;
    const instante = e.enviadaEn ?? evaluada;
    return [
      {
        orden: instante ?? 0,
        fila: {
          id: t.id,
          href: `/tareas/${t.id}`,
          titulo: t.titulo,
          tipo: t.tipo,
          fecha:
            e.enviadaEn !== null
              ? entregadaTexto(diaDeInstante(e.enviadaEn))
              : evaluada !== null
                ? `evaluada el ${formatFecha(diaDeInstante(evaluada))}`
                : "entregada",
        },
      },
    ];
  });
  return {
    pendientes: filasPorEntregar(d, ahora),
    entregadas: filas.sort((a, b) => b.orden - a.orden).map((f) => f.fila),
  };
}

/** Respuesta ya enviada por pregunta (la imagen se firma en la página, solo si se muestra). */
export type RespuestaEnviada =
  | { tipo: "texto"; texto: string }
  | { tipo: "imagen"; imagenPaths: string[] }
  | { tipo: "url"; url: string };

export type CabeceraEntrega = {
  tipo: Tarea["tipo"];
  eyebrow: string;
  titulo: string;
  vence: string;
  puntos: string;
  /** Grupal o individual (D263). */
  premio: string | null;
  /** Clave B2 de la foto del premio (D265): la página la firma. */
  premioFoto: string | null;
  preguntas: PreguntaEntrega[];
};

export type EntregaVista =
  | { estado: "no-existe" }
  | (CabeceraEntrega &
      (
        | { estado: "responder"; autor: string }
        | {
            estado: "lector";
            capitan: {
              nombre: string;
              corto: string;
              estilo: DicebearEstilo;
              seed: string;
            } | null;
          }
        | { estado: "sin-equipo" }
        | { estado: "cerrada" }
        | {
            estado: "entregada";
            /** Nombre de quien la envió; `null` si vino del Excel sin registro. */
            quien: string | null;
            /** Primer nombre de quien respondió (alt de las imágenes). */
            autor: string;
            fecha: string | null;
            hora: string | null;
            evaluada: boolean;
            /** Su nota y el desglose por pregunta (D248) si ya está evaluada; si no, `null`. */
            notaHref: string | null;
            /** Por pregunta, en orden; `null` si no hay respuesta guardada. */
            respuestas: Array<RespuestaEnviada | null>;
          }
      ));

/** PLACEHOLDER de copy (CONTENT_CHECKLIST fila 129): tarea sin fecha de entrega. */
export const SIN_FECHA_ENTREGA = "Sin fecha de entrega";

/**
 * /tareas/[tarea] según la sesión y los datos: `no-existe` (no es de su sección o borrador →
 * 404); `entregada` si ya hay una entrega enviada donde figura (también los integrantes de una
 * grupal: ven las respuestas del capitán y, evaluada, el enlace a su nota; D248); si no, con la
 * tarea abierta,
 * `responder` (individual, o grupal y es el capitán, D012) o `lector` (grupal, no capitán);
 * `sin-equipo` (grupal sin equipo); `cerrada` (ya no está abierta y no la entregó).
 */
export function entregaVista(
  d: Pick<DatosAlumno, "usuario" | "equipo" | "tareas" | "entregas">,
  tareaId: string,
  companeros: readonly Companero[],
  /** Para «Vence» / «Venció» por fecha y hora en el encabezado (D357). */
  ahora?: number,
): EntregaVista {
  const t = d.tareas.find((x) => x.id === tareaId);
  if (!t) return { estado: "no-existe" };
  const u = d.usuario;
  // Con prórroga, su fecha nueva (D452); abierta o cerrada para él en `ahora` (D451)
  const v = vencimientoPara(d, t);
  const abierta = abiertaPara(d, t, ahora);
  const cabecera: CabeceraEntrega = {
    tipo: t.tipo,
    eyebrow: eyebrowTarea(t.tipo, d.equipo?.nombre),
    titulo: t.titulo,
    vence: v.fecha ? venceTexto(v.fecha, v.hora, ahora) : SIN_FECHA_ENTREGA,
    puntos: puntosPreguntasTexto(t.preguntas.map((p) => p.valor)),
    premio: t.premio,
    premioFoto: t.premio ? (t.premioFoto ?? null) : null,
    preguntas: t.preguntas.map((p) => ({
      id: p.id,
      enunciado: p.enunciado,
      formato: p.formato,
      ...(p.formato === "imagen" && p.maxImagenes
        ? { maxImagenes: p.maxImagenes }
        : {}),
      valor: p.valor,
    })),
  };

  const e = entregaDe(t.id, d.entregas);
  if (e && enviada(e, t, abierta)) {
    const envio =
      e.enviadaPor === u.cedula
        ? u
        : (companeros.find((c) => c.cedula === e.enviadaPor) ?? null);
    return {
      ...cabecera,
      estado: "entregada",
      quien: envio ? nombreCompleto(envio) : null,
      autor: primerNombre((envio ?? u).nombres),
      fecha:
        e.enviadaEn !== null ? formatFecha(diaDeInstante(e.enviadaEn)) : null,
      hora: e.enviadaEn !== null ? horaDeInstante(e.enviadaEn) : null,
      evaluada: e.estado === "evaluada",
      notaHref: e.estado === "evaluada" ? `/notas/${t.id}` : null,
      respuestas: t.preguntas.map((p): RespuestaEnviada | null => {
        const r = e.respuestas[p.id];
        if (!r) return null;
        if ("texto" in r) {
          return r.texto.trim() ? { tipo: "texto", texto: r.texto } : null;
        }
        if ("url" in r) return { tipo: "url", url: r.url };
        return { tipo: "imagen", imagenPaths: rutasImagen(r) };
      }),
    };
  }

  if (!abierta) return { ...cabecera, estado: "cerrada" };
  if (t.tipo === "individual") {
    return { ...cabecera, estado: "responder", autor: primerNombre(u.nombres) };
  }
  const eq = d.equipo;
  if (!eq) return { ...cabecera, estado: "sin-equipo" };
  if (eq.capitanId === u.cedula) {
    return { ...cabecera, estado: "responder", autor: primerNombre(u.nombres) };
  }
  const cap = companeros.find((c) => c.cedula === eq.capitanId);
  return {
    ...cabecera,
    estado: "lector",
    capitan: cap
      ? {
          nombre: nombreCorto(cap),
          corto: primerNombre(cap.nombres),
          estilo: estiloDe(cap.avatar.estilo),
          seed: cap.avatar.semilla,
        }
      : null,
  };
}
