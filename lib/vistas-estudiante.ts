// De los documentos de Firestore a las props de las pantallas del estudiante (fase 07, D189).
// Puro: sin Firebase ni reloj. Lo lee el DAL (`lib/datos/estudiante.ts`) en el servidor y lo
// prueban los tests. Los datos demo (`lib/demo/*`) quedan solo para las galerías.
import type { NavUsuario } from "@/components/layout/nav-types";
import type { DatosEquipo } from "@/components/sections/equipo/team-hero";
import type { Integrante } from "@/components/sections/equipo/team-members";
import type { PremioGanado } from "@/components/sections/equipo/team-prizes";
import type { FilaPendiente } from "@/components/sections/inicio/pending-tasks";
import type { FilaNota } from "@/components/sections/inicio/recent-grades";
import type { ResumenEquipo } from "@/components/sections/inicio/team-summary";
import type { PreguntaDetalle } from "@/components/sections/notas/question-list";
import { type DicebearEstilo, esEstiloDicebear } from "@/lib/dicebear";
import { enJuegoTexto, ganadorPremio, premioGanadoTexto } from "@/lib/equipo";
import { comparaFecha, diaDeInstante, formatFecha } from "@/lib/fecha";
import { formatNota, puntosRanking } from "@/lib/grades";
import {
  capitanTexto,
  equipoChipTexto,
  equipoMetaTexto,
  lineaPendientes,
  puestoTexto,
} from "@/lib/inicio";
import type {
  Ajuste,
  Entrega,
  Equipo,
  RankingSeccion,
  Tarea,
  Usuario,
} from "@/lib/modelo";
import { fechaNotaTexto } from "@/lib/notas";
import {
  baseChipTexto,
  capitanChipTexto,
  cedulaTexto,
  partirNombre,
} from "@/lib/perfil";
import { primerApellido, rankCompetition } from "@/lib/ranking";
import { notaDeIntegrante } from "@/lib/ranking-datos";
import type { TitulosTopbar } from "@/lib/topbar";

export type ConId<T> = { id: string } & T;

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
  /** Día ISO: de evaluación si está evaluada, si no de entrega (o `null` sin fecha). */
  fecha: string | null;
};

function entregaDe(
  tareaId: string,
  entregas: ReadonlyArray<ConId<Entrega>>,
): ConId<Entrega> | null {
  return entregas.find((e) => e.tareaId === tareaId) ?? null;
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
        nota: notaDeIntegrante(entrega, d.usuario.base),
        fecha: diaDeInstante(ev.evaluadaEn),
      };
    }
    return {
      tarea,
      entrega,
      puntaje: null,
      nota: null,
      fecha: tarea.fechaEntrega,
    };
  });
  const orden = (a: string | null, b: string | null) =>
    a === null ? (b === null ? 0 : 1) : b === null ? -1 : comparaFecha(a, b);
  const evaluadas = notas
    .filter((n) => n.nota !== null)
    .sort((a, b) => orden(b.fecha, a.fecha));
  const pendientes = notas
    .filter((n) => n.nota === null)
    .sort((a, b) => orden(a.fecha, b.fecha));
  return [...evaluadas, ...pendientes];
}

function filaNota(
  n: NotaAlumno,
  base: number,
  equipoNombre: string | undefined,
): FilaNota {
  return {
    id: n.tarea.id,
    href: `/notas/${n.tarea.id}`,
    titulo: n.tarea.titulo,
    tipo: n.tarea.tipo,
    detalle: n.tarea.tipo === "grupal" ? equipoNombre : undefined,
    fecha: n.fecha ? fechaNotaTexto(n.nota !== null, n.fecha) : "sin fecha",
    nota: n.nota,
    // La base escala también las grupales, por integrante (D177)
    base,
  };
}

/** Filas de Mis notas. */
export function filasMisNotas(
  d: Pick<DatosAlumno, "usuario" | "equipo" | "tareas" | "entregas">,
): FilaNota[] {
  return notasDelAlumno(d).map((n) =>
    filaNota(n, d.usuario.base, d.equipo?.nombre),
  );
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
      /** Vacío si la nota vino del Excel sin desglose. */
      preguntas: PreguntaDetalle[];
    };

/**
 * Detalle de una nota: `no-existe` (no es una tarea visible para él → 404), `sin-detalle`
 * (todavía no está evaluada) u `ok`.
 */
export function detalleNota(
  d: Pick<DatosAlumno, "usuario" | "tareas" | "entregas">,
  tareaId: string,
): DetalleVista {
  const tarea = d.tareas.find((t) => t.id === tareaId);
  if (!tarea) return { estado: "no-existe" };
  const entrega = entregaDe(tarea.id, d.entregas);
  const ev = entrega?.estado === "evaluada" ? entrega.evaluacion : null;
  const final = entrega ? notaDeIntegrante(entrega, d.usuario.base) : null;
  if (!entrega || !ev || final === null) {
    return { estado: "sin-detalle", tipo: tarea.tipo, titulo: tarea.titulo };
  }
  const tipo = tarea.tipo === "grupal" ? "Grupal" : "Individual";
  const puntos = ev.puntos;
  return {
    estado: "ok",
    tipo: tarea.tipo,
    eyebrow: `${tipo} · evaluada el ${formatFecha(diaDeInstante(ev.evaluadaEn))}`,
    titulo: tarea.titulo,
    puntaje: ev.puntaje,
    base: d.usuario.base,
    final,
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
                : RESPUESTA_IMAGEN,
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
): InicioVista {
  const u = d.usuario;
  const notas = notasDelAlumno(d);
  const abiertas = d.tareas
    .filter((t) => t.estado === "abierta")
    .filter((t) => {
      const e = entregaDe(t.id, d.entregas);
      return !e || e.estado === "borrador";
    })
    .sort((a, b) =>
      comparaFecha(
        a.fechaEntrega ?? "9999-12-31",
        b.fechaEntrega ?? "9999-12-31",
      ),
    );
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
        abiertas.flatMap((t) => (t.fechaEntrega ? [t.fechaEntrega] : [])),
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
      .map((n) => filaNota(n, u.base, d.equipo?.nombre)),
    pendientes: abiertas.map((t) => ({
      id: t.id,
      href: `/tareas/${t.id}`,
      titulo: t.titulo,
      tipo: t.tipo,
      vence: t.fechaEntrega ? formatFecha(t.fechaEntrega) : "sin fecha",
      premio: t.premio ?? undefined,
      entregasTu: t.tipo === "grupal" && capitan,
      avance:
        entregaDe(t.id, d.entregas)?.estado === "borrador"
          ? "borrador"
          : "sin-empezar",
    })),
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
      fecha: fecha ? fechaNotaTexto(nota !== null, fecha) : "sin fecha",
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
      return ganadorPremio(rivales) === eq.id
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
