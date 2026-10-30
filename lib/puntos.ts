// Lógica y textos de Ajustes de puntos (fase 04, D118–D121). Funciones puras, sin React ni reloj:
// la fecha de un ajuste nuevo llega por argumento. Un ajuste mueve puntos del ranking, nunca la nota (D007).
import { normalizar } from "@/lib/alumnos";
import type { DicebearEstilo } from "@/lib/dicebear";
import { chipAjuste, fechaAjusteTexto } from "@/lib/panel";
import { rankCompetition } from "@/lib/ranking";
import { formatDecimal, STEP_DEFAULT } from "@/lib/stepper";

export type TipoDestino = "alumno" | "equipo";
export type SeccionPuntos = "5A" | "5C";

/* ---------- Motivos fijos (HANDOFF §3 Ajustes de puntos; D007) ---------- */

export type MotivoId =
  | "participacion"
  | "ayudo"
  | "extra"
  | "ausente"
  | "atencion"
  | "celular"
  | "respeto"
  | "otro";

export type Motivo = {
  id: MotivoId;
  etiqueta: string;
  /** Valor propuesto; `null` en «Otro» (valor libre ±). */
  valor: number | null;
};

/** Los 8 motivos, en el orden del lienzo. Valores propuestos: el profe los puede cambiar en el stepper. */
export const MOTIVOS: readonly Motivo[] = [
  { id: "participacion", etiqueta: "Participación destacada", valor: 2 },
  { id: "ayudo", etiqueta: "Ayudó a un compañero", valor: 1 },
  { id: "extra", etiqueta: "Trabajo extra", valor: 2 },
  { id: "ausente", etiqueta: "No estuvo en clase", valor: -2 },
  { id: "atencion", etiqueta: "No prestó atención", valor: -1 },
  { id: "celular", etiqueta: "Uso del celular", valor: -1 },
  { id: "respeto", etiqueta: "Falta de respeto", valor: -3 },
  { id: "otro", etiqueta: "Otro", valor: null },
];

/** Motivo del ajuste inverso que crea «Anular ajuste» (D121). No se elige en el formulario. */
export const MOTIVO_ANULACION = "Anulación";
export const MOTIVO_OTRO = "Otro";

export function motivoPorId(id: MotivoId): Motivo {
  const m = MOTIVOS.find((x) => x.id === id);
  if (!m) throw new RangeError(`Motivo desconocido: ${id}`);
  return m;
}

export function esMotivoId(valor: string): valor is MotivoId {
  return MOTIVOS.some((m) => m.id === valor);
}

/** Valor que el stepper toma al elegir el motivo; `null` en «Otro» (sin valor hasta que el profe lo ponga, D103). */
export function valorPropuesto(id: MotivoId): number | null {
  return motivoPorId(id).valor;
}

export type ChipMotivo = {
  variante: "ok" | "err" | "neutral";
  /** Lo visible: "+2", "−3" o "± escribe". */
  visible: string;
  /** Lo que lee el lector de pantalla: "más 2 puntos" / "valor libre". */
  accesible: string;
};

/** Chip del valor de cada opción de motivo (el signo va en el texto, no solo en el color). */
export function chipMotivo(valor: number | null): ChipMotivo {
  if (valor === null) {
    return {
      variante: "neutral",
      visible: "± escribe",
      accesible: "valor libre",
    };
  }
  const chip = chipAjuste(valor);
  return {
    variante: chip.signo === "mas" ? "ok" : "err",
    visible: chip.conSigno,
    accesible: chip.accesible,
  };
}

/* ---------- Destinatarios (combobox «¿A quién?») ---------- */

export type AvatarCandidato =
  | { tipo: "alumno"; estilo: DicebearEstilo; seed: string }
  | { tipo: "equipo"; tema: string; logo?: string | null };

export type Candidato = {
  /** Cédula del alumno o id del equipo. */
  id: string;
  tipo: TipoDestino;
  seccion: SeccionPuntos;
  /** "Jorge Quintero" o "5A-G3 Ropa". */
  nombre: string;
  /** Puntos actuales del ranking. */
  puntos: number;
  /** Desempate de `rankCompetition` (primer apellido; nombre en equipos). */
  primerApellido: string;
  avatar: AvatarCandidato;
};

/** "17 pts" / "17,5 pts" (coma es-VE, pasos de 0,5). */
export function puntosTexto(n: number): string {
  return `${formatDecimal(n, STEP_DEFAULT)} pts`;
}

/** Búsqueda por nombre sin tildes ni mayúsculas; consulta vacía = todos. */
export function filtrarCandidatos<T extends { nombre: string }>(
  lista: readonly T[],
  consulta: string,
): T[] {
  const q = normalizar(consulta);
  if (!q) return [...lista];
  return lista.filter((c) => normalizar(c.nombre).includes(q));
}

/** Mensaje del combobox sin coincidencias: "Sin resultados para «xyz»". */
export function sinResultadosTexto(consulta: string): string {
  return `Sin resultados para «${consulta.trim()}»`;
}

/** Clave de un destino en los mapas de puntos: "alumno:32828381" / "equipo:5a-g3". */
export function claveDestino(tipo: TipoDestino, id: string): string {
  return `${tipo}:${id}`;
}

/** Suma a cada candidato lo que se aplicó (o anuló) en esta sesión: la vista previa usa el estado local. */
export function conDeltas(
  lista: readonly Candidato[],
  deltas: Readonly<Record<string, number>>,
): Candidato[] {
  return lista.map((c) => {
    const d = deltas[claveDestino(c.tipo, c.id)] ?? 0;
    return d === 0 ? c : { ...c, puntos: c.puntos + d };
  });
}

/* ---------- Vista previa (alert ok/err con TrendingUp/Down) ---------- */

export type Movimiento = "sube" | "baja" | "igual";

export type VistaPrevia = {
  antes: number;
  despues: number;
  puestoAntes: number;
  puestoDespues: number;
  movimiento: Movimiento;
  variante: "ok" | "err";
  /** Trozos para poner en negrita el nombre y los puntos nuevos, como el lienzo. */
  partes: {
    prefijo: string;
    nombre: string;
    medio: string;
    puntos: string;
    cola: string;
  };
  /** La frase entera, para pruebas y textos planos. */
  frase: string;
};

function puestoDe(lista: readonly Candidato[], id: string): number {
  const fila = rankCompetition(lista).find((f) => f.id === id);
  if (!fila) throw new RangeError(`${id} no está en el ranking`);
  return fila.puesto;
}

function movimientoTexto(m: Movimiento, antes: number, despues: number) {
  if (m === "sube") return `sube del puesto ${antes} al ${despues}`;
  if (m === "baja") return `baja del puesto ${antes} al ${despues}`;
  return `se mantiene en el puesto ${antes}`;
}

/**
 * «Jorge Quintero pasa de 17 a 19 pts y sube del puesto 16 al 11. Su nota no cambia.»
 * `ranking` = los candidatos de su tipo y sección con los puntos actuales (ya con los deltas de la sesión);
 * el puesto nuevo se recalcula con `rankCompetition` (competencia 1-2-2-4, desempate por apellido).
 */
export function vistaPrevia({
  destino,
  valor,
  ranking,
}: {
  destino: Candidato;
  valor: number;
  ranking: readonly Candidato[];
}): VistaPrevia {
  const actual = ranking.find((c) => c.id === destino.id) ?? destino;
  const antes = actual.puntos;
  const despues = antes + valor;
  const lista = ranking.some((c) => c.id === destino.id)
    ? ranking
    : [...ranking, actual];
  const puestoAntes = puestoDe(lista, actual.id);
  const puestoDespues = puestoDe(
    lista.map((c) => (c.id === actual.id ? { ...c, puntos: despues } : c)),
    actual.id,
  );
  const movimiento: Movimiento =
    puestoDespues < puestoAntes
      ? "sube"
      : puestoDespues > puestoAntes
        ? "baja"
        : "igual";
  const prefijo = destino.tipo === "equipo" ? "El equipo " : "";
  const partes = {
    prefijo,
    nombre: destino.nombre,
    medio: ` pasa de ${formatDecimal(antes)} a `,
    puntos: puntosTexto(despues),
    cola: ` y ${movimientoTexto(movimiento, puestoAntes, puestoDespues)}. Su nota no cambia.`,
  };
  return {
    antes,
    despues,
    puestoAntes,
    puestoDespues,
    movimiento,
    variante: valor >= 0 ? "ok" : "err",
    partes,
    frase: `${partes.prefijo}${partes.nombre}${partes.medio}${partes.puntos}${partes.cola}`,
  };
}

/* ---------- Validación (al enviar, D071) ---------- */

/** Rango del stepper de puntos (decisión D119: el handoff no fija tope; ±20 = la escala de notas). */
export const PUNTOS_MIN = -20;
export const PUNTOS_MAX = 20;
export const PUNTOS_PASO = STEP_DEFAULT;

export const DESTINO_VACIO: Record<TipoDestino, string> = {
  alumno: "Elige a qué alumno le ajustas los puntos.",
  equipo: "Elige a qué equipo le ajustas los puntos.",
};
export const MOTIVO_VACIO = "Elige un motivo.";
export const VALOR_VACIO = "Escribe cuántos puntos sumas o restas.";
export const VALOR_CERO = "Un ajuste no puede ser de 0 puntos.";
export const VALOR_PASO = "Usa pasos de 0,5.";
export const VALOR_RANGO = `Va de −${PUNTOS_MAX} a +${PUNTOS_MAX} puntos.`;
export const DETALLE_VACIO = "En «Otro», explica el motivo en el detalle.";

export type BorradorAjuste = {
  tipo: TipoDestino;
  destinoId: string | null;
  motivo: MotivoId | null;
  valor: number | null;
  detalle: string;
};

export type ErroresAjuste = Partial<
  Record<"destino" | "motivo" | "valor" | "detalle", string>
>;

export function validarAjuste(b: BorradorAjuste): ErroresAjuste {
  const e: ErroresAjuste = {};
  if (!b.destinoId) e.destino = DESTINO_VACIO[b.tipo];
  if (!b.motivo) e.motivo = MOTIVO_VACIO;
  if (b.valor === null) e.valor = VALOR_VACIO;
  else if (b.valor === 0) e.valor = VALOR_CERO;
  else if (b.valor < PUNTOS_MIN || b.valor > PUNTOS_MAX) e.valor = VALOR_RANGO;
  else if (
    Math.abs(b.valor / PUNTOS_PASO - Math.round(b.valor / PUNTOS_PASO)) > 1e-9
  )
    e.valor = VALOR_PASO;
  if (b.motivo === "otro" && !b.detalle.trim()) e.detalle = DETALLE_VACIO;
  return e;
}

export function sinErrores(e: ErroresAjuste): boolean {
  return Object.keys(e).length === 0;
}

/* ---------- Historial ---------- */

export type FilaHistorial = {
  id: string;
  tipo: TipoDestino;
  destinoId: string;
  seccion: SeccionPuntos;
  /** "Jorge Quintero" o "Equipo 5A-G3 Ropa". */
  nombre: string;
  valor: number;
  motivo: string;
  /** Texto de «Otro», o lo que anula una «Anulación». */
  detalle?: string;
  /** ISO local sin zona (`DemoAjuste.fecha`). */
  fecha: string;
  profe: string;
  /** `id` del ajuste que anula (solo en «Anulación»). */
  anulaA?: string;
  /** Ya tiene su ajuste inverso: se marca, no se borra. */
  anulado: boolean;
  /** Creado en esta sesión (aplicado o anulación): cuenta en los puntos de la vista previa. */
  nuevo: boolean;
};

/** "Equipo 5A-G3 Ropa" en el historial; el alumno, tal cual. */
export function nombreDestino(tipo: TipoDestino, nombre: string): string {
  return tipo === "equipo" ? `Equipo ${nombre}` : nombre;
}

const OTRO_EN_MOTIVO = /^Otro:\s*"(.*)"$/;

/**
 * Separa el formato del Panel (`motivo: 'Otro: "texto"'`, D101) en motivo + detalle, para filtrar por motivo.
 * Si ya viene `detalle`, gana.
 */
export function separarMotivo(
  motivo: string,
  detalle?: string,
): { motivo: string; detalle?: string } {
  const m = OTRO_EN_MOTIVO.exec(motivo);
  if (m) return { motivo: MOTIVO_OTRO, detalle: detalle ?? m[1] };
  return detalle === undefined ? { motivo } : { motivo, detalle };
}

/** Línea del motivo: «Otro: "Entregaron la maqueta sin nombres"», «Anulación de «Uso del celular» del …». */
export function motivoTexto(
  f: Pick<FilaHistorial, "motivo" | "detalle">,
): string {
  if (f.motivo === MOTIVO_OTRO && f.detalle) return `Otro: "${f.detalle}"`;
  if (f.motivo === MOTIVO_ANULACION && f.detalle)
    return `${MOTIVO_ANULACION} de ${f.detalle}`;
  return f.motivo;
}

/** "25/10/2026, 10:15 a. m. · [Nombre del profe]". */
export function historialMetaTexto(
  f: Pick<FilaHistorial, "fecha" | "profe">,
): string {
  return `${fechaAjusteTexto(f.fecha)} · ${f.profe}`;
}

/** Nombre accesible del menú de la fila (brief: con el objeto). */
export function opcionesAjusteLabel(nombre: string): string {
  return `Opciones del ajuste de ${nombre}`;
}

/** Fecha local "aaaa-mm-ddThh:mm" de un `Date` que da el cliente al aplicar (nunca el servidor). */
export function isoLocal(d: Date): string {
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** Ajuste nuevo desde el formulario (ya validado). */
export function nuevoAjuste({
  id,
  destino,
  motivo,
  valor,
  detalle,
  fecha,
  profe,
}: {
  id: string;
  destino: Candidato;
  motivo: MotivoId;
  valor: number;
  detalle: string;
  fecha: string;
  profe: string;
}): FilaHistorial {
  const texto = detalle.trim();
  const fila: FilaHistorial = {
    id,
    tipo: destino.tipo,
    destinoId: destino.id,
    seccion: destino.seccion,
    nombre: nombreDestino(destino.tipo, destino.nombre),
    valor,
    motivo: motivoPorId(motivo).etiqueta,
    fecha,
    profe,
    anulado: false,
    nuevo: true,
  };
  // El detalle es obligatorio en «Otro» y opcional en el resto (el lienzo lo trae en Participación)
  return texto ? { ...fila, detalle: texto } : fila;
}

/** Se puede anular lo que no está anulado y no es, a su vez, una anulación. */
export function puedeAnular(
  f: Pick<FilaHistorial, "anulado" | "motivo">,
): boolean {
  return !f.anulado && f.motivo !== MOTIVO_ANULACION;
}

/** Por qué el menú no deja anular (ítem deshabilitado; `null` si sí se puede). */
export function motivoNoAnulable(
  f: Pick<FilaHistorial, "anulado" | "motivo">,
): string | null {
  if (f.motivo === MOTIVO_ANULACION) return "Una anulación no se anula";
  if (f.anulado) return "Ya está anulado";
  return null;
}

/**
 * «Anular ajuste» (D121): no borra la fila. Crea el ajuste inverso con motivo «Anulación» (arriba, es el
 * más reciente) y marca el original como anulado. Un anulado (o una anulación) no se anula otra vez.
 * @throws Error si la fila no existe o no se puede anular.
 */
export function anular(
  filas: readonly FilaHistorial[],
  id: string,
  { nuevoId, fecha, profe }: { nuevoId: string; fecha: string; profe: string },
): FilaHistorial[] {
  const original = filas.find((f) => f.id === id);
  if (!original) throw new Error(`No hay ajuste ${id}`);
  if (!puedeAnular(original))
    throw new Error(`El ajuste ${id} no se puede anular`);
  const inversa: FilaHistorial = {
    id: nuevoId,
    tipo: original.tipo,
    destinoId: original.destinoId,
    seccion: original.seccion,
    nombre: original.nombre,
    valor: -original.valor,
    motivo: MOTIVO_ANULACION,
    detalle: `«${original.motivo}» del ${fechaAjusteTexto(original.fecha)}`,
    fecha,
    profe,
    anulaA: original.id,
    anulado: false,
    nuevo: true,
  };
  return [
    inversa,
    ...filas.map((f) => (f.id === id ? { ...f, anulado: true } : f)),
  ];
}

/** Puntos que la sesión movió por destino (ajustes aplicados y anulaciones): la vista previa los suma. */
export function deltasSesion(
  filas: readonly FilaHistorial[],
): Record<string, number> {
  const d: Record<string, number> = {};
  for (const f of filas) {
    if (!f.nuevo) continue;
    const k = claveDestino(f.tipo, f.destinoId);
    d[k] = (d[k] ?? 0) + f.valor;
  }
  return d;
}

/** Toast al aplicar: no repite la frase de la vista previa (una sola región viva por cambio). */
export function ajusteAplicadoTexto(
  f: Pick<FilaHistorial, "nombre" | "valor">,
): string {
  return `Ajuste aplicado: ${chipAjuste(f.valor).conSigno} pts a ${f.nombre}`;
}

export function ajusteAnuladoTexto(
  f: Pick<FilaHistorial, "nombre" | "valor">,
): string {
  return `Ajuste anulado: ${chipAjuste(-f.valor).conSigno} pts a ${f.nombre}`;
}

/* ---------- Filtro del historial («Filtrar»: sección, alumno/equipo, motivo) ---------- */

export type FiltroHistorial = {
  seccion: SeccionPuntos | "todas";
  tipo: TipoDestino | "todos";
  /** Etiqueta del motivo, o "todos". */
  motivo: string;
};

export const FILTRO_VACIO: FiltroHistorial = {
  seccion: "todas",
  tipo: "todos",
  motivo: "todos",
};

/** Motivos por los que se puede filtrar: los 8 fijos + «Anulación». */
export const MOTIVOS_FILTRO: readonly string[] = [
  ...MOTIVOS.map((m) => m.etiqueta),
  MOTIVO_ANULACION,
];

export function filtrarHistorial(
  filas: readonly FilaHistorial[],
  f: FiltroHistorial,
): FilaHistorial[] {
  return filas.filter(
    (x) =>
      (f.seccion === "todas" || x.seccion === f.seccion) &&
      (f.tipo === "todos" || x.tipo === f.tipo) &&
      (f.motivo === "todos" || x.motivo === f.motivo),
  );
}

export function filtrosActivos(f: FiltroHistorial): number {
  return (
    Number(f.seccion !== "todas") +
    Number(f.tipo !== "todos") +
    Number(f.motivo !== "todos")
  );
}

/** Nombre accesible de «Filtrar»: "Filtrar el historial" / "Filtrar el historial (2 filtros activos)". */
export function filtrarLabel(f: FiltroHistorial): string {
  const n = filtrosActivos(f);
  if (n === 0) return "Filtrar el historial";
  return `Filtrar el historial (${n} ${n === 1 ? "filtro activo" : "filtros activos"})`;
}

const ajustesTexto = (n: number) => (n === 1 ? "1 ajuste" : `${n} ajustes`);

/**
 * Frase estable de la región viva del filtro (D099): "Mostrando los 5 ajustes" o
 * "Mostrando 2 de 5 ajustes · 5A · Alumnos · Uso del celular".
 */
export function filtroHistorialTexto(
  f: FiltroHistorial,
  visibles: number,
  total: number,
): string {
  if (filtrosActivos(f) === 0) {
    return total === 1
      ? "Mostrando 1 ajuste"
      : `Mostrando los ${total} ajustes`;
  }
  const partes = [
    f.seccion !== "todas" ? f.seccion : null,
    f.tipo === "alumno" ? "Alumnos" : f.tipo === "equipo" ? "Equipos" : null,
    f.motivo !== "todos" ? f.motivo : null,
  ].filter(Boolean);
  return `Mostrando ${visibles} de ${ajustesTexto(total)} · ${partes.join(" · ")}`;
}
