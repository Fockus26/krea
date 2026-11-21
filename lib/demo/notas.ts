// Props de ejemplo de Mis notas y Detalle de nota para la vista previa (D066, D069).
// Las reales salen de Firestore (fase 07).

import type { FilaNota } from "@/components/sections/inicio/recent-grades";
import {
  alumnoPorCedula,
  CEDULA_DEMO,
  type DemoAlumno,
  equipoDe,
  TAREA_IDENTIDAD,
} from "@/lib/demo/seed";
import { notasDe, TAREAS } from "@/lib/demo/tareas";
import { formatFecha } from "@/lib/fecha";
import { notaFinal } from "@/lib/grades";
import { fechaNotaTexto } from "@/lib/notas";

/** Mis notas: todas las del alumno en el orden de §3 (evaluadas recientes, luego pendientes). */
export function misNotasDe(
  alumno: DemoAlumno = alumnoPorCedula(CEDULA_DEMO),
): FilaNota[] {
  const equipo = equipoDe(alumno);
  return notasDe(alumno).map(({ tarea, puntaje }) => ({
    id: tarea.id,
    href: `/notas/${tarea.id}`,
    titulo: tarea.titulo,
    tipo: tarea.tipo,
    detalle: tarea.tipo === "grupal" ? equipo?.nombre : undefined,
    fecha: fechaNotaTexto(puntaje !== null, tarea.fecha),
    // La base del alumno escala solo sus notas individuales (D014, provisional)
    nota:
      tarea.tipo === "individual" ? notaFinal(puntaje, alumno.base) : puntaje,
    base: tarea.tipo === "individual" ? alumno.base : undefined,
  }));
}

/** Elsa Soto (5A): sus puntajes reales de "Identidad de marca" son los del lienzo de Detalle. */
export const CEDULA_DETALLE = "45011133";
/** Alejandra Montero (5A): 8 en "Identidad de marca", para ver el caso Raspado con datos reales. */
export const CEDULA_RASPADO = "45050717";

/**
 * Enunciados con tildes tal como los muestra el lienzo (el Excel del seed los trae sin tildes:
 * "¿Como se llama la marca?"). Misma pregunta, misma posición; solo cambia la ortografía.
 */
const ENUNCIADOS_LIENZO: Readonly<Record<string, string>> = {
  p1: "¿Cómo se llama la marca?",
  p2: "¿Por qué nació esta marca?",
  p3: "¿Qué producto o servicio vende?",
  p4: "¿Cuál es el cliente ideal?",
  p5: "¿Cuál es la personalidad de la marca?",
  p6: "¿Qué problema resuelven?",
  p7: "¿Cuál es el elemento diferenciador?",
  p8: "¿Cuáles son los 3 valores principales?",
};

/** PLACEHOLDER: respuestas del alumno (HANDOFF §8; CONTENT_CHECKLIST fila 62). Las del lienzo. */
const RESPUESTAS_DEMO: Readonly<Record<string, string>> = {
  p1: "Brasa Express",
  p2: "Porque a la salida del liceo no hay dónde comer algo rápido y caliente, y queríamos vender comida hecha por nosotros.",
  p3: "Perros calientes, hamburguesas y tequeños con salsas de la casa, en combos para estudiantes.",
  p4: "Estudiantes de 13 a 18 años que salen del liceo con hambre y con poco presupuesto.",
  p5: "Alegre, rápida y confiable: como un amigo que siempre te resuelve.",
  p6: "Que los muchachos no tengan que caminar hasta la avenida para comer: llevamos los combos a la puerta del liceo en 10 minutos.",
  p7: "Las salsas son receta de la abuela de Hernán y cada combo trae un jugo natural incluido.",
  p8: "Rapidez.",
};

/** PLACEHOLDER: comentarios del profe a Elsa Soto (lienzo; CONTENT_CHECKLIST fila 62). */
const COMENTARIOS_DEMO: Readonly<Record<string, string>> = {
  p6: "¡Excelente! Explicaste el problema con un ejemplo real del liceo. Así se hace.",
  p8: "Solo nombraste un valor. Te faltaron dos: piensa en cómo tratan al cliente y en la calidad de la comida.",
};

/** PLACEHOLDER: fecha de evaluación de "Identidad de marca", la misma que muestra Mis notas (fila 53). */
const EVALUADA_DEMO =
  TAREAS.find((t) => t.id === TAREA_IDENTIDAD.id)?.fecha ?? "2026-10-10";

export type DetalleNota = {
  tipo: "individual" | "grupal";
  /** "Individual · evaluada el 21/10/2026". */
  eyebrow: string;
  titulo: string;
  /** Puntaje sobre 20, sin escalar. */
  puntaje: number;
  base: number;
  /** Nota final con la base aplicada (D013). */
  final: number;
  preguntas: ReadonlyArray<{
    id: string;
    enunciado: string;
    valor: number;
    obtenido: number;
    respuesta: string;
    comentario?: string;
  }>;
};

/**
 * Detalle de "Identidad de marca" de un alumno del seed. `base` permite ver la variante con base
 * (la base 15 del lienzo es un ejemplo: en el seed todos tienen 20).
 */
export function detalleDe(cedula: string, base?: number): DetalleNota {
  const alumno = alumnoPorCedula(cedula);
  const ev = TAREA_IDENTIDAD.evaluaciones.find((e) => e.cedula === cedula);
  if (!ev) throw new RangeError(`Sin evaluación para ${cedula}`);
  const b = base ?? alumno.base;
  const final = notaFinal(ev.nota, b);
  if (final === null) throw new RangeError("Nota evaluada sin valor");
  const conComentarios = cedula === CEDULA_DETALLE;
  return {
    tipo: TAREA_IDENTIDAD.tipo,
    eyebrow: `Individual · evaluada el ${formatFecha(EVALUADA_DEMO)}`,
    titulo: TAREA_IDENTIDAD.titulo,
    puntaje: ev.nota,
    base: b,
    final,
    preguntas: TAREA_IDENTIDAD.preguntas.map((p, i) => ({
      id: p.id,
      enunciado: ENUNCIADOS_LIENZO[p.id] ?? p.enunciado,
      valor: p.valor,
      obtenido: ev.puntos[i] ?? 0,
      respuesta: RESPUESTAS_DEMO[p.id] ?? "",
      comentario: conComentarios ? COMENTARIOS_DEMO[p.id] : undefined,
    })),
  };
}
