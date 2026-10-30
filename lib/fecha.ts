// Fechas del portal (HANDOFF §3): siempre dd/mm/aaaa. Las fechas de entrega se guardan como
// día civil ISO "aaaa-mm-dd", sin hora ni zona: así el 30/10 es el 30/10 en cualquier huso.

const ISO_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-10-30" → "30/10/2026". @throws RangeError si no es un día ISO válido. */
export function formatFecha(iso: string): string {
  const [, a, m, d] = partes(iso);
  return `${d}/${m}/${a}`;
}

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
