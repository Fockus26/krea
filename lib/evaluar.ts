// Lógica pura de Evaluar entrega (HANDOFF §3 "Evaluar entrega"; lienzo Evaluar.dc.html; D104–D105).
// Textos, completitud, base efectiva, cola y atajo de guardar. Sin React; el total en vivo y la
// nota los calcula `liveTotalInfo` (lib/meters.ts, D057) con `notaFinal` (D013): aquí no se repite.
import { formatFecha } from "@/lib/fecha";
import { formatNota, NOTA_MAX } from "@/lib/grades";
import { liveTotalInfo } from "@/lib/meters";
import { snapToStep } from "@/lib/stepper";

export type TipoEntrega = "individual" | "grupal";

/** Desde cuántas preguntas aparece el índice de chips 1…n (lienzo Extremos, "Contenido extremo"). */
export const INDICE_DESDE = 6;

/** Lo que dura el toast "Nota guardada" con "Deshacer" (§3: 5 s). */
export const DESHACER_MS = 5000;

/* ---------- Cabecera ---------- */

/** "Por evaluar · entrega 1 de 7" (`indice` desde 0). */
export function eyebrowEvaluar(indice: number, total: number): string {
  return `Por evaluar · entrega ${indice + 1} de ${total}`;
}

/** Título de la topbar móvil: "Entrega 1 de 7". */
export function tituloEntrega(indice: number, total: number): string {
  return `Entrega ${indice + 1} de ${total}`;
}

/**
 * Hora civil "16:12" → "4:12 p. m." (como `horaTexto` de lib/tareas.ts, pero sin `Date`: la hora
 * de entrega se guarda como texto y no depende del huso del servidor que prerenderiza).
 * @throws RangeError si no es "hh:mm" válido.
 */
export function horaCivilTexto(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  const h24 = m ? Number(m[1]) : Number.NaN;
  const min = m ? Number(m[2]) : Number.NaN;
  if (!(h24 >= 0 && h24 < 24 && min >= 0 && min < 60)) {
    throw new RangeError(`Hora inválida: ${hhmm}`);
  }
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(min).padStart(2, "0")} ${h24 < 12 ? "a. m." : "p. m."}`;
}

/**
 * "{tarea} · entregó {nombre} (capitana) el 25/10/2026, 4:12 p. m." (grupal: quien envió es el
 * capitán, D012). Individual, el alumno ya es el `<h1>`: "{tarea} · entregó el …".
 * El género no está en el seed (D075): lo da quien llama.
 */
export function entregaLinea({
  tarea,
  tipo,
  autor,
  femenino = false,
  fecha,
  hora,
}: {
  tarea: string;
  tipo: TipoEntrega;
  /** Nombre corto de quien envió (solo grupal). */
  autor?: string;
  femenino?: boolean;
  /** Día civil ISO. */
  fecha: string;
  /** "hh:mm". */
  hora: string;
}): string {
  const cuando = `el ${formatFecha(fecha)}, ${horaCivilTexto(hora)}`;
  if (tipo === "grupal" && autor) {
    const rol = femenino ? "capitana" : "capitán";
    return `${tarea} · entregó ${autor} (${rol}) ${cuando}`;
  }
  return `${tarea} · entregó ${cuando}`;
}

/** Chip de tipo: "Grupal · 4 integrantes" / "Individual". */
export function tipoChipTexto(tipo: TipoEntrega, integrantes?: number): string {
  if (tipo === "individual") return "Individual";
  if (integrantes === undefined) return "Grupal";
  return `Grupal · ${integrantes} ${integrantes === 1 ? "integrante" : "integrantes"}`;
}

/**
 * Base de la nota que se ve al evaluar: la del alumno; en una grupal, 20 (la nota del equipo,
 * que es la que suma al equipo). A cada integrante se le aplica después su base (D177).
 */
export function baseEfectiva(tipo: TipoEntrega, base: number): number {
  return tipo === "grupal" ? NOTA_MAX : base;
}

/** Chip de base: "Base 20 · todos" (grupal, D014) / "Base 15" (individual). */
export function baseChipTexto(tipo: TipoEntrega, base: number): string {
  return tipo === "grupal"
    ? `Base ${NOTA_MAX} · todos`
    : `Base ${formatNota(base)}`;
}

/* ---------- Estado de la evaluación ---------- */

/** Completa = todas las preguntas puntuadas (y hay al menos una). */
export function estaCompleta(scores: ReadonlyArray<number | null>): boolean {
  return scores.length > 0 && scores.every((s) => s !== null);
}

/**
 * Lleva cada puntaje al paso de 0,5 dentro de 0–valor antes de guardar: mientras se escribe, el
 * stepper puede dejar un valor sin ajustar ("3,2") hasta salir del campo, y Ctrl+Enter no espera
 * a ese blur (D004).
 */
export function normalizarPuntajes(
  scores: ReadonlyArray<number | null>,
  valores: readonly number[],
): (number | null)[] {
  return scores.map((s, i) =>
    s === null ? null : snapToStep(s, { min: 0, max: valores[i] ?? 0 }),
  );
}

/** Nota que se guarda: la de `liveTotalInfo` (D013/D057), `null` si no hay nada puntuado. */
export function notaGuardada(
  scores: ReadonlyArray<number | null>,
  base: number,
): number | null {
  return liveTotalInfo(scores, base).nota;
}

/** Toast al guardar: "Nota guardada · 18,5". */
export function notaGuardadaTexto(nota: number | null): string {
  return `Nota guardada · ${formatNota(nota)}`;
}

/** Siguiente de la cola, para "Sigue: …". `null` = es la última. */
export type SiguienteEntrega = { nombre: string; tarea: string } | null;

/**
 * Bajo el botón de escritorio: "Se activa al puntuar las 5. Sigue: Jorge Quintero · Identidad
 * de marca". Completa: solo "Sigue: …".
 */
export function activaTexto(
  preguntas: number,
  completo: boolean,
  siguiente: SiguienteEntrega,
): string {
  // PROVISIONAL (CONTENT_CHECKLIST 81): "la pregunta" con una sola y el texto de la última entrega
  const sigue = siguiente
    ? `Sigue: ${siguiente.nombre} · ${siguiente.tarea}`
    : "Es la última entrega por evaluar.";
  if (completo) return sigue;
  const regla =
    preguntas === 1
      ? "Se activa al puntuar la pregunta."
      : `Se activa al puntuar las ${preguntas}.`;
  return `${regla} ${sigue}`;
}

/** Barra de acción móvil, línea 1: "Faltan 3 por puntuar" · "Falta 1 por puntuar" · "Todo puntuado". */
export function faltanCortoTexto(faltan: number): string {
  // PROVISIONAL (CONTENT_CHECKLIST 81): "Todo puntuado"
  if (faltan <= 0) return "Todo puntuado";
  return faltan === 1 ? "Falta 1 por puntuar" : `Faltan ${faltan} por puntuar`;
}

/** Barra de acción móvil, línea 2: "Sigue: Jorge Quintero". */
export function sigueCortoTexto(siguiente: SiguienteEntrega): string {
  // PROVISIONAL (CONTENT_CHECKLIST 81)
  return siguiente ? `Sigue: ${siguiente.nombre}` : "Es la última entrega";
}

/* ---------- Índice de preguntas (desde 6) ---------- */

export type ChipPregunta = {
  numero: number;
  puntuada: boolean;
  actual: boolean;
  /** "Pregunta 7, sin puntuar, actual" (lienzo Extremos: el estado no va solo en el color). */
  label: string;
};

/** ¿Se pinta el índice de chips? Desde `INDICE_DESDE` preguntas. */
export function conIndice(preguntas: number): boolean {
  return preguntas >= INDICE_DESDE;
}

/** "Preguntas · 6 de 10 puntuadas". */
export function indiceTitulo(scores: ReadonlyArray<number | null>): string {
  const hechas = scores.filter((s) => s !== null).length;
  return `Preguntas · ${hechas} de ${scores.length} puntuadas`;
}

/** Un chip por pregunta; `actual` = índice (desde 0) de la pregunta con el foco, o `null`. */
export function indiceChips(
  scores: ReadonlyArray<number | null>,
  actual: number | null,
): ChipPregunta[] {
  return scores.map((s, i) => {
    const puntuada = s !== null;
    const esActual = i === actual;
    const partes = [`Pregunta ${i + 1}`, puntuada ? "puntuada" : "sin puntuar"];
    if (esActual) partes.push("actual");
    return {
      numero: i + 1,
      puntuada,
      actual: esActual,
      label: partes.join(", "),
    };
  });
}

/** Ancla de una pregunta (`id` de su enunciado): "pregunta-3". */
export function preguntaAncla(numero: number): string {
  return `pregunta-${numero}`;
}

/* ---------- Cola y atajo ---------- */

/** Vecinos en la cola: índices de la anterior y la siguiente, `null` en los extremos. */
export function vecinos(
  indice: number,
  total: number,
): { anterior: number | null; siguiente: number | null } {
  return {
    anterior: indice > 0 ? indice - 1 : null,
    siguiente: indice < total - 1 ? indice + 1 : null,
  };
}

/**
 * ¿Es Ctrl+Enter (o Cmd+Enter)? Enter solo nunca guarda (salto de línea en el comentario,
 * ajuste del stepper); con Alt o Mayús tampoco, para no pisar atajos del sistema.
 */
export function esAtajoGuardar(e: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}): boolean {
  return (
    e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey
  );
}
