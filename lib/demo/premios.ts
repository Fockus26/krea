// Tarjetas de ejemplo de Premios del profesor (D066, D069). Salen de TAREAS (las grupales con premio),
// del borrador "plan-redes" (mismo id y título que en Tareas del profesor) y de un empate de ejemplo.
// PLACEHOLDER: avance "3 de 12", borrador y empate (CONTENT_CHECKLIST filas 95-97).
import { EQUIPOS } from "@/lib/demo/seed";
import { TAREAS } from "@/lib/demo/tareas";
import {
  type EntradaPremio,
  type EstadoPremio,
  estadoPremio,
} from "@/lib/premios";

export type TarjetaPremio = {
  id: string;
  tarea: string;
  tareaId: string;
  seccion: string;
  premio: string | null;
  borrador: boolean;
  estado: EstadoPremio;
};

/** Nombres de todos los equipos por id (para "Ganó 5A-G2 Repostería"). */
export const NOMBRES_EQUIPO: Readonly<Record<string, string>> =
  Object.fromEntries(EQUIPOS.map((e) => [e.id, e.nombre]));

const notas5A = EQUIPOS.filter((e) => e.seccion === "5A").map((e) => ({
  id: e.id,
  nota: e.notaGrupal,
}));

function tarjeta(
  base: Omit<TarjetaPremio, "estado" | "premio">,
  entrada: EntradaPremio,
  notas = notas5A,
): TarjetaPremio {
  return {
    ...base,
    premio: entrada.premio ?? null,
    estado: estadoPremio(entrada, notas),
  };
}

function tareaPorId(id: string) {
  const t = TAREAS.find((x) => x.id === id);
  if (!t) throw new RangeError(`Tarea desconocida en el seed: ${id}`);
  return t;
}

const ganada = tareaPorId("logo-y-paleta");
const abierta = tareaPorId("presentacion-producto");

/** PLACEHOLDER: tarea evaluada con empate en la mejor nota (el seed no trae ninguno). */
const EMPATE = {
  id: "afiche-emprendimiento",
  titulo: "Afiche del emprendimiento",
  premio: "Almuerzo en la cantina para todo el equipo",
  fecha: "2026-10-24",
  notas: notas5A.map((n) =>
    n.id === "5a-g2" || n.id === "5a-g5" ? { ...n, nota: 18.5 } : n,
  ),
};

export const TARJETAS_PREMIOS: readonly TarjetaPremio[] = [
  tarjeta(
    {
      id: ganada.id,
      tarea: ganada.titulo,
      tareaId: ganada.id,
      seccion: "5A",
      borrador: false,
    },
    { estado: ganada.estado, premio: ganada.premio, fecha: ganada.fecha },
  ),
  tarjeta(
    {
      id: abierta.id,
      tarea: abierta.titulo,
      tareaId: abierta.id,
      seccion: "5A y 5C",
      borrador: false,
    },
    {
      estado: abierta.estado,
      premio: abierta.premio,
      fecha: abierta.fecha,
      avance: { entregaron: 3, total: EQUIPOS.length },
    },
  ),
  tarjeta(
    {
      id: EMPATE.id,
      tarea: EMPATE.titulo,
      tareaId: EMPATE.id,
      seccion: "5A",
      borrador: false,
    },
    { estado: "evaluada", premio: EMPATE.premio, fecha: EMPATE.fecha },
    EMPATE.notas,
  ),
  tarjeta(
    {
      id: "plan-redes",
      tarea: "Plan de redes sociales",
      tareaId: "plan-redes",
      seccion: "5A y 5C",
      borrador: true,
    },
    { estado: "borrador", fecha: null },
  ),
];
