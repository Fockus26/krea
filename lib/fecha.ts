// Fechas del portal (HANDOFF §3): siempre dd/mm/aaaa. Las fechas de entrega se guardan como
// día civil ISO "aaaa-mm-dd", sin hora ni zona: así el 30/10 es el 30/10 en cualquier huso.

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
