// Lógica y textos del Panel del profesor (fase 04, D098–D101). Funciones puras, sin React ni reloj:
// la hora y los datos llegan por argumento (con `cacheComponents` el servidor no lee `Date.now()`).
import { formatNota } from "@/lib/grades";
import { formatDecimal } from "@/lib/stepper";

export type SeccionPanel = "5A" | "5C";
export type FiltroSeccion = SeccionPanel | "ambas";

/** Opciones del segmentado de sección, en el orden del lienzo: 5A · 5C · Ambas. */
export const FILTROS_SECCION: ReadonlyArray<readonly [FiltroSeccion, string]> =
  [
    ["5A", "5A"],
    ["5C", "5C"],
    ["ambas", "Ambas"],
  ];

export function esFiltroSeccion(valor: string): valor is FiltroSeccion {
  return valor === "5A" || valor === "5C" || valor === "ambas";
}

/** Nombre que el saludo usa mientras el del profe sea placeholder (HANDOFF §9 #6, checklist fila 53). */
export const NOMBRE_SALUDO_PROFE = "profe";

/**
 * Saludo por hora local (0–23): días 5–11, tardes 12–18, noches 19–4.
 * @throws RangeError si no es un entero de 0 a 23.
 */
export function saludoPorHora(hora: number): string {
  if (!Number.isInteger(hora) || hora < 0 || hora > 23) {
    throw new RangeError(`Hora inválida: ${hora}`);
  }
  if (hora >= 5 && hora <= 11) return "Buenos días";
  if (hora >= 12 && hora <= 18) return "Buenas tardes";
  return "Buenas noches";
}

/** "Buenos días, profe". */
export function saludoTexto(
  hora: number,
  nombre: string = NOMBRE_SALUDO_PROFE,
): string {
  return `${saludoPorHora(hora)}, ${nombre}`;
}

/**
 * Hora del saludo en el HTML del servidor (D133): el prerender no lee el reloj (D098), así que
 * sale el de la mañana del lienzo («Buenos días, profe») y el cliente pone el de su hora al hidratar.
 */
export const HORA_SALUDO_SERVIDOR = 9;

/** Filtra por sección; "ambas" devuelve todo (HANDOFF §9 #7: el panel agrega las dos). */
export function filtrarPorSeccion<T extends { seccion: SeccionPanel }>(
  items: readonly T[],
  filtro: FiltroSeccion,
): T[] {
  return filtro === "ambas"
    ? [...items]
    : items.filter((i) => i.seccion === filtro);
}

type TipoEntrega = "individual" | "grupal";

/** "4 individuales · 3 grupales"; sin entregas, "Nada por evaluar". */
export function detallePorEvaluar(
  items: ReadonlyArray<{ tipo: TipoEntrega }>,
): string {
  if (items.length === 0) return "Nada por evaluar";
  const ind = items.filter((i) => i.tipo === "individual").length;
  const gru = items.length - ind;
  return `${ind} ${ind === 1 ? "individual" : "individuales"} · ${gru} ${gru === 1 ? "grupal" : "grupales"}`;
}

/** Porcentaje 0–100 (1 decimal) para la barra de evaluados; sin total → 0. */
export function porcentajeEvaluados(evaluados: number, total: number): number {
  if (total <= 0) return 0;
  const pct = Math.min(100, Math.max(0, (evaluados / total) * 100));
  return Math.round(pct * 10) / 10;
}

/** Nombre accesible del avance: "12 de 69 evaluados" / "1 de 1 evaluado". */
export function evaluadosTexto(evaluados: number, total: number): string {
  return `${evaluados} de ${total} ${total === 1 ? "evaluado" : "evaluados"}`;
}

export type Raspado = { nombre: string; nota: number };

/** Detalle de la tarjeta Raspados: "María de los Ángeles Méndez · 8", "Ana · 7 y 2 más" o "Nadie por debajo de 10". */
export function detalleRaspados(raspados: readonly Raspado[]): string {
  const [primero, ...resto] = raspados;
  if (!primero) return "Nadie por debajo de 10";
  const base = `${primero.nombre} · ${formatNota(primero.nota)}`;
  return resto.length === 0 ? base : `${base} y ${resto.length} más`;
}

/** "Ver las 7" / "Ver la 1". */
export function verTodasTexto(n: number): string {
  return n === 1 ? "Ver la 1" : `Ver las ${n}`;
}

/** Nombre accesible del botón de la fila: "Evaluar a Jorge Quintero". */
export function evaluarAriaLabel(nombre: string): string {
  return `Evaluar a ${nombre}`;
}

const MENOS = "−"; // signo menos tipográfico, no guion

export type ChipAjuste = {
  signo: "mas" | "menos";
  /** Lo visible junto al ícono Plus/Minus: valor absoluto con coma es-VE y la unidad ("2 pts", "0,5 pts"). */
  texto: string;
  /** Lo que lee el lector de pantalla: "más 2 puntos" / "menos 1 punto" (el signo no va solo en color, D007). */
  accesible: string;
  /** Con el signo tipográfico, para textos planos: "+2" / "−1". */
  conSigno: string;
};

/** El ajuste mueve puntos del ranking, nunca la nota (D007): el texto habla de puntos. */
export function chipAjuste(valor: number): ChipAjuste {
  const abs = Math.abs(valor);
  const num = formatDecimal(abs, 0.5);
  const positivo = valor >= 0;
  return {
    signo: positivo ? "mas" : "menos",
    texto: `${num} pts`,
    accesible: `${positivo ? "más" : "menos"} ${num} ${abs === 1 ? "punto" : "puntos"}`,
    conSigno: `${positivo ? "+" : MENOS}${num}`,
  };
}

const ISO_FECHA_HORA = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/;

/**
 * Fecha de un ajuste: "25/10/2026, 10:15 a. m."; si el ISO no trae hora, solo "23/10/2026".
 * El ISO es local, sin zona (como las fechas de entrega): no depende del huso del servidor.
 * @throws RangeError si no es un ISO válido.
 */
export function fechaAjusteTexto(iso: string): string {
  const m = ISO_FECHA_HORA.exec(iso);
  if (!m) throw new RangeError(`Fecha inválida: ${iso}`);
  const [, a, mes, d, hh, mm] = m;
  const fecha = `${d}/${mes}/${a}`;
  if (hh === undefined || mm === undefined) return fecha;
  const hora = Number(hh);
  if (hora > 23 || Number(mm) > 59)
    throw new RangeError(`Hora inválida: ${iso}`);
  const h12 = hora % 12 === 0 ? 12 : hora % 12;
  return `${fecha}, ${h12}:${mm} ${hora < 12 ? "a. m." : "p. m."}`;
}

/** Línea secundaria del ajuste: "Participación destacada · 25/10/2026, 10:15 a. m.". */
export function ajusteMetaTexto(motivo: string, iso: string): string {
  return `${motivo} · ${fechaAjusteTexto(iso)}`;
}

/** Línea secundaria de una entrega: grupal "Tarea · Grupal · entregó Yeilin el 25/10/2026"; individual "Tarea · Individual · 24/10/2026". */
export function entregaMetaTexto(e: {
  tarea: string;
  tipo: TipoEntrega;
  /** Fecha ya formateada dd/mm/aaaa. */
  fecha: string;
  /** Primer nombre de quien entregó (solo grupales). */
  entrego?: string;
}): string {
  const tipo = e.tipo === "grupal" ? "Grupal" : "Individual";
  const cuando =
    e.tipo === "grupal" && e.entrego
      ? `entregó ${e.entrego} el ${e.fecha}`
      : e.fecha;
  return `${e.tarea} · ${tipo} · ${cuando}`;
}

/** Cuántas entregas muestra la lista antes de "Ver las N" (lienzo: 5). */
export const ENTREGAS_VISIBLES = 5;

/** Frase estable para la región viva del filtro (una sola, D098): "Mostrando la sección 5A". */
export function filtroTexto(filtro: FiltroSeccion): string {
  return filtro === "ambas"
    ? "Mostrando ambas secciones"
    : `Mostrando la sección ${filtro}`;
}
