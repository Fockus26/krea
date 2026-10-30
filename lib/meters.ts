// Lógica pura de los medidores de evaluación (HANDOFF §2.11; D004, D006, D013; D056). Sin React.
// SumMeter (suma del constructor) y LiveTotal (total al evaluar) se parecen pero no comparten
// reglas (§8): cada uno tiene su función. Solo comparten `percent`.
import { formatNota, NOTA_MAX, notaFinal } from "@/lib/grades";
import { formatDecimal } from "@/lib/stepper";

/** Ancho de una barra en % (0–100), con el tope a la vista aunque el valor se pase. */
export function percent(part: number, whole: number): number {
  if (!(whole > 0) || !Number.isFinite(part)) return 0;
  return Math.min(100, Math.max(0, (part / whole) * 100));
}

const num = (n: number) => formatDecimal(n, 0.5);

/* ---------- SumMeter: suma de valores del constructor (D004: exactamente 20) ---------- */

export type SumState = "under" | "over" | "exact";

export type SumMeterInfo = {
  state: SumState;
  /** "Faltan 6" · "Te pasaste por 2" · "Suma exacta". */
  message: string;
  /** Relleno de la barra: suma / 20 al faltar; 100 % al pasarse o al cuadrar. */
  pct: number;
  /** "14 / 20" visible. */
  display: string;
  /** Lo que lee el lector de pantalla: "Suma de valores: 14 de 20. Faltan 6." */
  srText: string;
};

export function sumMeterInfo(sum: number, target: number = NOTA_MAX): SumMeterInfo {
  const diff = Math.round((target - sum) * 2) / 2;
  const state: SumState = diff > 0 ? "under" : diff < 0 ? "over" : "exact";
  const message =
    state === "under"
      ? `${diff === 1 ? "Falta" : "Faltan"} ${num(diff)}`
      : state === "over"
        ? `Te pasaste por ${num(-diff)}`
        : "Suma exacta";
  return {
    state,
    message,
    pct: state === "under" ? percent(sum, target) : 100,
    display: `${num(sum)} / ${num(target)}`,
    srText: `Suma de valores: ${num(sum)} de ${num(target)}. ${message}.`,
  };
}

/* ---------- LiveTotal: total en vivo al evaluar una entrega ---------- */

export type LiveTotalInfo = {
  /** Suma de lo puntuado (0–20). */
  total: number;
  puntuadas: number;
  preguntas: number;
  completo: boolean;
  /** `notaFinal(total, base)`; `null` mientras no hay ninguna puntuada (Pendiente, D003). */
  nota: number | null;
  /** "9 / 20". */
  display: string;
  /** "2 de 5 puntuadas". */
  progress: string;
  /** "Faltan 3 preguntas por puntuar" · "Todas las preguntas puntuadas" (provisional). */
  pending: string;
  /** "Nota resultante con Base 20". */
  baseText: string;
  /** Barra compacta: total / 20. */
  pctTotal: number;
  /** Barra de la tarjeta: puntuadas / preguntas. */
  pctPuntuadas: number;
  /** "Total 9 de 20, nota 9. 2 de 5 puntuadas." */
  srText: string;
};

/**
 * Resume las puntuaciones de una entrega: `null` = pregunta sin puntuar.
 * La nota la calcula `notaFinal` (D013, mitad hacia arriba): aquí no se redondea a mano.
 * La suma se acota a 20 por si llega una tarea mal formada (D004 garantiza que no pasa):
 * `notaFinal` lanzaría y tumbaría la pantalla de evaluación.
 */
export function liveTotalInfo(
  scores: ReadonlyArray<number | null>,
  base: number = NOTA_MAX,
): LiveTotalInfo {
  const hechas = scores.filter((s): s is number => s !== null);
  const total = Math.min(
    NOTA_MAX,
    Math.round(hechas.reduce((a, b) => a + b, 0) * 2) / 2,
  );
  const puntuadas = hechas.length;
  const preguntas = scores.length;
  const faltan = preguntas - puntuadas;
  const completo = faltan === 0 && preguntas > 0;
  const nota = puntuadas === 0 ? null : notaFinal(total, base);
  const display = `${num(total)} / ${NOTA_MAX}`;
  const progress = `${puntuadas} de ${preguntas} puntuadas`;
  const pending = completo
    ? "Todas las preguntas puntuadas"
    : faltan === 1
      ? "Falta 1 pregunta por puntuar"
      : `Faltan ${faltan} preguntas por puntuar`;
  const notaTexto = nota === null ? "nota pendiente" : `nota ${formatNota(nota)}`;
  return {
    total,
    puntuadas,
    preguntas,
    completo,
    nota,
    display,
    progress,
    pending,
    baseText: `Nota resultante con Base ${formatNota(base)}`,
    pctTotal: percent(total, NOTA_MAX),
    pctPuntuadas: percent(puntuadas, preguntas),
    srText: `Total ${num(total)} de ${NOTA_MAX}, ${notaTexto}. ${progress}.`,
  };
}
