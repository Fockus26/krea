// Estado efectivo de una tarea (tanda 2026-11-20 Q4, D451–D453). Puro y sin reloj: el instante
// llega por argumento (con `cacheComponents` nadie lee `Date.now()` en código cacheado).
//
// En la base los estados siguen siendo `borrador | abierta | evaluada` (D202): no hay cron. Una
// `abierta` cuya fecha y hora ya pasaron se lee **cerrada** (D451). Cerrar a mano (`evaluada`)
// cierra para todos. Reabrir para algunos guarda prórrogas por titular (cédula en individual,
// equipo en grupal, el mismo id de `idEntrega`): con una prórroga vigente la tarea está abierta
// para ese titular, venga de donde venga el cierre (D452).
import { vencida } from "@/lib/fecha";
import type { Prorroga, Prorrogas, TareaDoc } from "@/lib/modelo";

/** Lo que el portal deja hacer con la tarea: borrador, abierta o cerrada. */
export type EstadoEfectivo = "borrador" | "abierta" | "cerrada";

/** Lo que hace falta de la tarea para saber su estado. */
export type TareaConVencimiento = Pick<TareaDoc, "estado" | "fechaEntrega"> & {
  horaEntrega?: string | null | undefined;
  prorrogas?: Prorrogas | null | undefined;
};

/** La prórroga del titular, vigente o no; `null` si no tiene. */
export function prorrogaDe(
  t: Pick<TareaConVencimiento, "prorrogas">,
  titularId: string | null | undefined,
): Prorroga | null {
  if (!titularId || !t.prorrogas) return null;
  return Object.hasOwn(t.prorrogas, titularId)
    ? (t.prorrogas[titularId] ?? null)
    : null;
}

const prorrogaVigente = (p: Prorroga | null, ahora: number) =>
  p !== null && !vencida(p.fecha, p.hora, ahora);

/** Sin el titular: cerrada a mano, o abierta y vencida (sin mirar prórrogas). */
function cerradaGeneral(t: TareaConVencimiento, ahora: number): boolean {
  if (t.estado === "evaluada") return true;
  return (
    t.fechaEntrega !== null && vencida(t.fechaEntrega, t.horaEntrega, ahora)
  );
}

/**
 * Estado de la tarea en `ahora` (D451, D452). Borrador → borrador; cerrada a mano (`evaluada`) o
 * abierta con la fecha y hora ya pasadas (en Caracas, `vencida`) → cerrada; abierta sin fecha o
 * sin vencer → abierta. Con `titularId`, una prórroga suya sin vencer la deja abierta para él.
 * Sin `titularId`, el estado general (el de quien no tiene prórroga).
 */
export function estadoEfectivo(
  t: TareaConVencimiento,
  ahora: number,
  titularId?: string | null,
): EstadoEfectivo {
  if (t.estado === "borrador") return "borrador";
  if (!cerradaGeneral(t, ahora)) return "abierta";
  return prorrogaVigente(prorrogaDe(t, titularId), ahora)
    ? "abierta"
    : "cerrada";
}

/**
 * `estadoEfectivo` cuando el instante puede faltar (vistas previas sin reloj, llamadores que aún
 * no lo pasan): sin `ahora`, el estado guardado (`evaluada` = cerrada, sin mirar la fecha). Las
 * comprobaciones del servidor siempre pasan `ahora`.
 */
export function estadoEn(
  t: TareaConVencimiento,
  ahora: number | undefined,
  titularId?: string | null,
): EstadoEfectivo {
  if (ahora !== undefined) return estadoEfectivo(t, ahora, titularId);
  return t.estado === "evaluada" ? "cerrada" : t.estado;
}

/** `cerradaParaTodos` cuando el instante puede faltar: sin `ahora`, cerrada a mano. */
export function cerradaParaTodosEn(
  t: TareaConVencimiento,
  ahora: number | undefined,
): boolean {
  return ahora !== undefined
    ? cerradaParaTodos(t, ahora)
    : t.estado === "evaluada";
}

/** Titulares con una prórroga sin vencer en `ahora` (D452). */
export function prorrogasVigentes(
  t: Pick<TareaConVencimiento, "prorrogas">,
  ahora: number,
): string[] {
  if (!t.prorrogas) return [];
  return Object.entries(t.prorrogas)
    .filter(([, p]) => prorrogaVigente(p, ahora))
    .map(([id]) => id);
}

/**
 * Cerrada para todos (D453): cerrada en general y sin ninguna prórroga vigente. Desde ahí el
 * alumno ve la entrega ideal (D433) y el profe decide el premio (D123, D263).
 */
export function cerradaParaTodos(
  t: TareaConVencimiento,
  ahora: number,
): boolean {
  if (t.estado === "borrador") return false;
  return cerradaGeneral(t, ahora) && prorrogasVigentes(t, ahora).length === 0;
}

/**
 * Fecha y hora de entrega de un titular: las de su prórroga si la tiene (vigente o no, es la
 * suya); si no, las de la tarea. Para «Vence» / «Venció» y el orden de «Por entregar».
 */
export function vencimientoDe(
  t: Pick<TareaConVencimiento, "fechaEntrega" | "horaEntrega" | "prorrogas">,
  titularId?: string | null,
): { fecha: string | null; hora: string | null } {
  const p = prorrogaDe(t, titularId);
  return p
    ? { fecha: p.fecha, hora: p.hora }
    : { fecha: t.fechaEntrega, hora: t.horaEntrega ?? null };
}
