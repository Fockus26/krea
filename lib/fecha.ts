// Fechas del portal (HANDOFF §3): siempre dd/mm/aaaa. Las fechas de entrega se guardan como
// día civil ISO "aaaa-mm-dd", sin hora ni zona: así el 30/10 es el 30/10 en cualquier huso. La
// hora de entrega, opcional, va aparte como "HH:MM" civil de Caracas (D352).

const ISO_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-10-30" → "30/10/2026". @throws RangeError si no es un día ISO válido. */
export function formatFecha(iso: string): string {
  const [, a, m, d] = partes(iso);
  return `${d}/${m}/${a}`;
}

/** ¿Es un día ISO que existe? ("2027-02-31" → false). */
export function esDiaValido(iso: string): boolean {
  try {
    partes(iso);
    return true;
  } catch {
    return false;
  }
}

/**
 * La fecha de entrega llega como mucho a un año de hoy (QA versión 1, F-B2: «31/12/9999» se
 * publicaba; D228). 366 días cubre el mismo día del año siguiente aunque sea bisiesto.
 */
export const FECHA_ENTREGA_MAX_DIAS = 366;

/** Días civiles de `desde` a `hasta` (negativo si `hasta` ya pasó). */
export function diasEntre(desde: string, hasta: string): number {
  return (aUtc(hasta) - aUtc(desde)) / 86_400_000;
}

/** Orden ascendente de días ISO (la cadena ya ordena, pero se valida). */
export function comparaFecha(a: string, b: string): number {
  return aUtc(a) - aUtc(b);
}

/* ---------- Hora de entrega (D352) ---------- */

/** Hora civil de 24 h "HH:MM" (00:00–23:59). La de entrega se guarda así, sin zona (es la de Caracas). */
export const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** ¿Es una hora "HH:MM" válida? ("24:00" o "9:30" → false). */
export function esHoraValida(hora: string): boolean {
  return RE_HORA.test(hora);
}

/** Sin hora, la tarea vence al final del día (D352): así se ordenan las que no la tienen. */
export const HORA_FIN_DEL_DIA = "23:59";

/** "15:30" → "3:30 p. m."; "00:05" → "12:05 a. m." (D355). @throws RangeError si no es "HH:MM". */
export function formatHora(hora: string): string {
  if (!esHoraValida(hora)) throw new RangeError(`Hora inválida: ${hora}`);
  const [h = 0, m = 0] = hora.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

/** Fecha de entrega con su hora (D355): "12/11/2026 · 3:30 p. m."; sin hora, "12/11/2026". */
export function formatFechaHora(iso: string, hora?: string | null): string {
  return hora ? `${formatFecha(iso)} · ${formatHora(hora)}` : formatFecha(iso);
}

/**
 * Clave ordenable del vencimiento: "2026-11-12T15:30"; sin hora, a las 23:59 (final del día).
 * Sin fecha, `null` (el llamador decide si va al principio o al final).
 */
export function claveVencimiento(
  fecha: string | null,
  hora?: string | null,
): string | null {
  return fecha === null ? null : `${fecha}T${hora ?? HORA_FIN_DEL_DIA}`;
}

/**
 * ¿Una hora de entrega de hoy ya pasó? `horaActual`: la de Caracas ("HH:MM", `hora24DeInstante`).
 * A la misma hora ya pasó: vence al empezar ese minuto (D354).
 */
export function horaPasada(hora: string, horaActual: string): boolean {
  return hora <= horaActual;
}

function partes(iso: string): [string, string, string, string] {
  const m = ISO_DIA.exec(iso);
  if (!m) throw new RangeError(`Fecha inválida: ${iso}`);
  const [todo, a, mes, d] = m;
  const fecha = new Date(Date.UTC(Number(a), Number(mes) - 1, Number(d)));
  if (
    fecha.getUTCMonth() !== Number(mes) - 1 ||
    fecha.getUTCDate() !== Number(d)
  ) {
    throw new RangeError(`Fecha inválida: ${iso}`);
  }
  return [todo, a, mes, d];
}

function aUtc(iso: string): number {
  const [, a, m, d] = partes(iso);
  return Date.UTC(Number(a), Number(m) - 1, Number(d));
}

/** Huso del liceo: los instantes del servidor se muestran como el día civil de Venezuela. */
export const ZONA_HORARIA = "America/Caracas";

const DIA_CARACAS = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Instante (ms epoch) → día civil ISO en Caracas: `1762300800000` → "2025-11-04". */
export function diaDeInstante(ms: number): string {
  return DIA_CARACAS.format(new Date(ms));
}

const HORA_CARACAS = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA_HORARIA,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** Instante (ms epoch) → hora de Caracas como el lienzo: "4:12 p. m." (D197). */
export function horaDeInstante(ms: number): string {
  const p = HORA_CARACAS.formatToParts(new Date(ms));
  const de = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${de("hour")}:${de("minute")} ${de("dayPeriod") === "AM" ? "a. m." : "p. m."}`;
}

const HORA_24_CARACAS = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONA_HORARIA,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Instante (ms epoch) → hora civil de Caracas en 24 h: "16:12" (para `horaCivilTexto`). */
export function hora24DeInstante(ms: number): string {
  return HORA_24_CARACAS.format(new Date(ms));
}

/**
 * Instante (ms epoch) → ISO local de Caracas sin zona "2026-10-25T16:12": la forma de las fechas
 * del historial de ajustes y del Panel (`fechaAjusteTexto`, W7).
 */
export function isoLocalDeInstante(ms: number): string {
  return `${diaDeInstante(ms)}T${hora24DeInstante(ms)}`;
}
