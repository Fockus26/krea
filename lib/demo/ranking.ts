// Props de ejemplo del Ranking para la vista previa (D066, D069, D094). Los puestos, los puntos y
// los nombres salen del seed; lo marcado PLACEHOLDER lo reemplaza la fase 07 (`onSnapshot`).

import {
  alumnoPorCedula,
  CEDULA_DEMO,
  equipoDe,
  integrantes,
  nombreCorto,
  rankingAlumnos,
  rankingEquipos,
  type Seccion,
} from "@/lib/demo/seed";
import {
  type ItemRanking,
  type Movimiento,
  type RolRanking,
  subtituloEquipo,
  type Vista,
} from "@/lib/ranking-vista";

// ---- Rutas de los estados de la vista previa (D072, D094; la galería sigue en 5A/5C) ----

export type EstadoRanking = {
  rol: RolRanking;
  seccion: Seccion;
  vista: Vista;
};

/** Slug del estado: estudiante → `estudiantes`/`equipos`; profe → `profesor[-5c][-equipos]`. */
export function estadoSlug({ rol, seccion, vista }: EstadoRanking): string {
  if (rol === "estudiante") return vista;
  return [
    "profesor",
    seccion === "5C" ? "5c" : "",
    vista === "equipos" ? "equipos" : "",
  ]
    .filter(Boolean)
    .join("-");
}

/** Inverso de `estadoSlug`; `undefined` si el slug no existe. */
export function estadoDeSlug(slug: string): EstadoRanking | undefined {
  if (slug === "estudiantes" || slug === "equipos") {
    return { rol: "estudiante", seccion: "5A", vista: slug };
  }
  const m = /^profesor(-5c)?(-equipos)?$/.exec(slug);
  if (!m) return undefined;
  return {
    rol: "profesor",
    seccion: m[1] ? "5C" : "5A",
    vista: m[2] ? "equipos" : "estudiantes",
  };
}

/** Los cuatro/seis slugs válidos, para `generateStaticParams`. */
export const ESTADOS_SLUG: readonly string[] = [
  "estudiantes",
  "equipos",
  "profesor",
  "profesor-equipos",
  "profesor-5c",
  "profesor-5c-equipos",
];

/** Instante fijo de la vista (sin `Date.now()` en el servidor): sábado 25/10/2026, 4:30 p. m. */
export const AHORA_DEMO = Date.UTC(2026, 9, 25, 20, 30);

/**
 * PLACEHOLDER (HANDOFF §8 «deltas del ranking», CONTENT_CHECKLIST fila 74): el seed no trae el
 * puesto anterior. Un ciclo fijo de cambios para ver las tres variantes del chip (sube, baja, =).
 */
const DELTAS_DEMO = [1, 2, 0, 1, 0, -1, 0, 3, -2, 0, 1, 0, -1] as const;

export function itemsEstudiantes(
  seccion: Seccion,
  /** Cédula del estudiante que mira (solo se marca «tú»); `null` en la vista del profesor. */
  cedulaTu: string | null,
): ItemRanking[] {
  return rankingAlumnos(seccion).map((f, i) => {
    const equipo = equipoDe(f);
    return {
      tipo: "estudiante",
      id: f.cedula,
      nombre: nombreCorto(f),
      puntos: f.puntos,
      puesto: f.puesto,
      empate: f.empate,
      enRiesgo: f.enRiesgo,
      subtitulo: equipo ? equipo.nombre : "Sin equipo",
      delta: DELTAS_DEMO[i % DELTAS_DEMO.length],
      esTu: f.cedula === cedulaTu,
      // PLACEHOLDER: el estilo de avatar lo elige cada alumno en Perfil (como USUARIO_ESTUDIANTE)
      estilo: "adventurer-neutral",
      seed: f.cedula,
    };
  });
}

export function itemsEquipos(
  seccion: Seccion,
  /** Equipo del estudiante que mira (se marca «tú»); `null` en la vista del profesor. */
  equipoIdTu: string | null,
): ItemRanking[] {
  return rankingEquipos(seccion).map((e, i) => {
    const miembros = integrantes(e);
    const capitan = alumnoPorCedula(e.capitanCedula);
    return {
      tipo: "equipo",
      id: e.id,
      nombre: e.nombre,
      puntos: e.puntos,
      puesto: e.puesto,
      empate: e.empate,
      enRiesgo: e.enRiesgo,
      subtitulo: subtituloEquipo(miembros.length, nombreCorto(capitan)),
      delta: DELTAS_DEMO[i % DELTAS_DEMO.length],
      esTu: e.id === equipoIdTu,
      tema: e.tema ?? e.nombre,
    };
  });
}

/** Equipo de Raquel (la estudiante de la vista previa). */
export function equipoIdDemo(): string | null {
  return alumnoPorCedula(CEDULA_DEMO).equipoId;
}

/**
 * PLACEHOLDER (CONTENT_CHECKLIST fila 75): los movimientos del lienzo, armados con las filas de la
 * sección para que los nombres existan en ella. La fase 07 los lee del flujo en vivo.
 */
export function movimientosDe(items: readonly ItemRanking[]): Movimiento[] {
  const en = (i: number) => items[Math.min(i, items.length - 1)];
  const min = 60_000;
  const a = en(3);
  const b = en(1);
  const c = en(4);
  const d = en(items.length - 6);
  return [
    {
      id: "m1",
      tipo: "sube",
      nombre: a.nombre,
      puesto: a.puesto,
      cambio: 2,
      hace: AHORA_DEMO - 2 * min,
    },
    {
      id: "m2",
      tipo: "sube",
      nombre: b.nombre,
      puesto: b.puesto,
      cambio: 1,
      hace: AHORA_DEMO - 2 * min - 1000,
    },
    {
      id: "m3",
      tipo: "puntos",
      nombre: c.nombre,
      valor: 2,
      motivo: "Participación destacada",
      hace: AHORA_DEMO - 9 * min,
    },
    {
      id: "m4",
      tipo: "baja",
      nombre: d.nombre,
      puesto: d.puesto,
      cambio: 2,
      hace: AHORA_DEMO - 15 * min,
    },
  ];
}
