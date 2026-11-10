// Textos dinámicos de Inicio del estudiante (HANDOFF §3 Inicio; lienzo design/canvas/Inicio.dc.html).
// Lógica pura, sin React.
import { claveVencimiento, formatFechaHora, verboVence } from "@/lib/fecha";
import { formatNota, puntosRanking } from "@/lib/grades";

/** Día ISO de entrega y su hora "HH:MM" (`null` = al final del día, D352). */
export type VencimientoTarea = { fecha: string; hora?: string | null };

/**
 * Línea bajo el saludo: "Tienes 2 tareas por entregar. La más cercana vence el 30/10/2026." o
 * "Estás al día." `vencimientos`: los de las tareas abiertas, en cualquier orden; la más cercana
 * se elige por fecha y hora y lleva su hora (D355). Si en `ahora` ya pasó, "venció" (D357).
 */
export function lineaPendientes(
  vencimientos: readonly VencimientoTarea[],
  ahora?: number,
): string {
  const [cercana] = [...vencimientos].sort((a, b) => {
    const x = claveVencimiento(a.fecha, a.hora) ?? "";
    const y = claveVencimiento(b.fecha, b.hora) ?? "";
    return x < y ? -1 : x > y ? 1 : 0;
  });
  if (!cercana) return "Estás al día.";
  const cuando = formatFechaHora(cercana.fecha, cercana.hora);
  const verbo = verboVence(cercana.fecha, cercana.hora, ahora);
  // «… 3:30 p. m.» ya cierra con punto: no se duplica
  const fin = cuando.endsWith(".") ? "" : ".";
  if (vencimientos.length === 1) {
    // PLACEHOLDER de copy en singular (CONTENT_CHECKLIST fila 59)
    return `Tienes 1 tarea por entregar. ${verbo === "vence" ? "Vence" : "Venció"} el ${cuando}${fin}`;
  }
  return `Tienes ${vencimientos.length} tareas por entregar. La más cercana ${verbo} el ${cuando}${fin}`;
}

/**
 * Desglose de la tarjeta de puntos con lo que **aporta** cada nota (0 si es menor de 10, D007):
 * "18,5 de tu nota individual + 19 de la grupal. Las notas menores de 10 no suman."
 * Sin equipo no hay parte grupal.
 */
export function desglosePuntos(
  notaIndividual: number | null,
  notaGrupal: number | null,
  tieneEquipo: boolean,
): string {
  const ind = formatNota(puntosRanking(notaIndividual));
  const regla = "Las notas menores de 10 no suman.";
  if (!tieneEquipo) return `${ind} de tu nota individual. ${regla}`;
  const gru = formatNota(puntosRanking(notaGrupal));
  return `${ind} de tu nota individual + ${gru} de la grupal. ${regla}`;
}

/** "#1 de 35". */
export function puestoTexto(puesto: number, total: number): string {
  return `#${puesto} de ${total}`;
}

/**
 * Chip de movimiento semanal: solo si cambió (§3). `delta` en puestos: positivo = subió.
 * "Bajaste…" es PLACEHOLDER de copy (fila 59): el lienzo solo muestra la subida.
 */
export function deltaSemanaTexto(delta: number): string | null {
  if (delta === 0) return null;
  const n = Math.abs(delta);
  const puestos = n === 1 ? "1 puesto" : `${n} puestos`;
  return delta > 0
    ? `Subiste ${puestos} esta semana`
    : `Bajaste ${puestos} esta semana`;
}

/**
 * "Capitana: tú" / "Capitán: Jorge Quintero". El género no está en el seed: lo da quien llama
 * (`femenino`, como `CaptainBadge`, D012); por defecto "Capitán".
 */
export function capitanTexto(
  nombre: string,
  esTu: boolean,
  femenino = false,
): { etiqueta: string; quien: string } {
  return {
    etiqueta: femenino ? "Capitana:" : "Capitán:",
    quien: esTu ? "tú" : nombre,
  };
}

/** Chip de equipo en Inicio: "#1 de 6 · 19 pts". */
export function equipoChipTexto(
  puesto: number,
  total: number,
  puntos: number,
): string {
  return `${puestoTexto(puesto, total)} · ${formatNota(puntos)} pts`;
}

/** "Tema: Repostería · 4 integrantes" (sin tema: solo integrantes). */
export function equipoMetaTexto(
  tema: string | null,
  integrantes: number,
): string {
  const n = integrantes === 1 ? "1 integrante" : `${integrantes} integrantes`;
  return tema ? `Tema: ${tema} · ${n}` : n;
}

export type AvanceEntrega = "sin-empezar" | "borrador";

export function avanceTexto(avance: AvanceEntrega): string {
  return avance === "borrador" ? "Borrador guardado" : "Sin empezar";
}
