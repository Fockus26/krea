// Opciones fijas de Ajustes de puntos (D375). Puro: sin base de datos ni reloj; lo usan el servidor
// (`lib/data/motivos.ts`, `lib/datos/motivos.ts`), el formulario de Puntos, su diálogo «Editar
// opciones» y las pruebas. La lista vive en `config/motivos` y es común a todos los profes; si la
// fila no existe vale `MOTIVOS_INICIALES` (los 7 del handoff, sin «Otro», D376).
//
// Cada ajuste guarda la etiqueta de su opción (`ajustes.motivo`): renombrar o borrar una opción no
// cambia el historial. El valor de la opción solo se propone en el stepper (D103).
import { normalizar } from "@/lib/alumnos";
import { zAjuste, zCatalogoMotivos } from "@/lib/modelo";

export type Motivo = {
  id: string;
  etiqueta: string;
  /** Valor propuesto al elegirla: ≠ 0, ±20, pasos de 0,5. El profe lo puede cambiar. */
  valor: number;
};

export type CatalogoMotivos = readonly Motivo[];

/** Sin fila `config/motivos`: los 7 del lienzo, en su orden y con sus valores (D375). */
export const MOTIVOS_INICIALES: CatalogoMotivos = [
  { id: "participacion", etiqueta: "Participación destacada", valor: 2 },
  { id: "ayudo", etiqueta: "Ayudó a un compañero", valor: 1 },
  { id: "extra", etiqueta: "Trabajo extra", valor: 2 },
  { id: "ausente", etiqueta: "No estuvo en clase", valor: -2 },
  { id: "atencion", etiqueta: "No prestó atención", valor: -1 },
  { id: "celular", etiqueta: "Uso del celular", valor: -1 },
  { id: "respeto", etiqueta: "Falta de respeto", valor: -3 },
];

export const ETIQUETA_MAX = 40;
/** Tope de opciones (el diálogo y el formulario siguen legibles; `zCatalogoMotivos`). */
export const MOTIVOS_MAX = 60;

/** Ids que el portal usa para otra cosa: una opción nueva nunca los toma. */
export const IDS_RESERVADOS: readonly string[] = [
  "anulacion",
  "importado",
  "otro",
];

/** Etiqueta del ajuste inverso de «Anular ajuste» (D121): una opción no puede llamarse así. */
const ETIQUETAS_RESERVADAS = ["anulacion"];

/**
 * Lo leído en `config/motivos`: ausente → `MOTIVOS_INICIALES`; que no valida → `null` (quien lee
 * decide).
 */
export function catalogoMotivosDeDocumento(
  existe: boolean,
  data: unknown,
): CatalogoMotivos | null {
  if (!existe) return MOTIVOS_INICIALES;
  const r = zCatalogoMotivos.safeParse(data);
  return r.success ? r.data.motivos : null;
}

export function motivoPorId(
  catalogo: CatalogoMotivos,
  id: string,
): Motivo | undefined {
  return catalogo.find((m) => m.id === id);
}

/* ---------- Operaciones (crear, editar, borrar) ---------- */

export type OperacionMotivos =
  /** `id` lo genera el servidor (`idMotivoNuevo`), nunca el cliente. */
  | { tipo: "crear"; id: string; etiqueta: string; valor: number }
  | { tipo: "editar"; id: string; etiqueta: string; valor: number }
  | { tipo: "borrar"; id: string };

export type ErrorMotivos =
  | "etiqueta"
  | "repetida"
  | "reservada"
  | "valor"
  | "no-existe"
  | "ultima"
  | "tope"
  | "invalida"
  | "red";

export type ResultadoMotivos =
  | { ok: true; motivos: CatalogoMotivos }
  | { ok: false; error: ErrorMotivos };

/** Id de una opción nueva: «m-» + 10 hexadecimales; nunca choca con `IDS_RESERVADOS`. */
export function idMotivoNuevo(): string {
  return `m-${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`;
}

/** Recorta y junta espacios: «  Trajo  material » → «Trajo material». */
export function limpiarEtiqueta(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

export function valorMotivoValido(valor: number): boolean {
  return zAjuste.shape.valor.safeParse(valor).success;
}

/** Error de la etiqueta (ya limpia) frente al catálogo; `excepto` = la opción que se edita. */
function errorEtiqueta(
  catalogo: CatalogoMotivos,
  etiqueta: string,
  excepto?: string,
): ErrorMotivos | null {
  if (etiqueta.length === 0 || etiqueta.length > ETIQUETA_MAX)
    return "etiqueta";
  const clave = normalizar(etiqueta);
  if (ETIQUETAS_RESERVADAS.includes(clave)) return "reservada";
  if (
    catalogo.some((m) => m.id !== excepto && normalizar(m.etiqueta) === clave)
  )
    return "repetida";
  return null;
}

/**
 * Aplica la operación a la lista. Crear va al final; editar cambia etiqueta y valor en su lugar;
 * borrar exige que quede al menos una. La etiqueta es única sin distinguir mayúsculas ni tildes.
 */
export function aplicarOperacionMotivos(
  catalogo: CatalogoMotivos,
  op: OperacionMotivos,
): ResultadoMotivos {
  if (op.tipo === "borrar") {
    if (!catalogo.some((m) => m.id === op.id))
      return { ok: false, error: "no-existe" };
    if (catalogo.length <= 1) return { ok: false, error: "ultima" };
    return { ok: true, motivos: catalogo.filter((m) => m.id !== op.id) };
  }
  const etiqueta = limpiarEtiqueta(op.etiqueta);
  if (op.tipo === "editar" && !catalogo.some((m) => m.id === op.id))
    return { ok: false, error: "no-existe" };
  const e = errorEtiqueta(
    catalogo,
    etiqueta,
    op.tipo === "editar" ? op.id : undefined,
  );
  if (e) return { ok: false, error: e };
  if (!valorMotivoValido(op.valor)) return { ok: false, error: "valor" };
  const motivo: Motivo = { id: op.id, etiqueta, valor: op.valor };
  if (op.tipo === "editar")
    return {
      ok: true,
      motivos: catalogo.map((m) => (m.id === op.id ? motivo : m)),
    };
  if (IDS_RESERVADOS.includes(op.id) || catalogo.some((m) => m.id === op.id))
    return { ok: false, error: "invalida" };
  if (catalogo.length >= MOTIVOS_MAX) return { ok: false, error: "tope" };
  return { ok: true, motivos: [...catalogo, motivo] };
}

/* ---------- Textos (PROVISIONAL: CONTENT_CHECKLIST fila 192) ---------- */

export const ETIQUETA_VACIA = "Escribe el nombre de la opción.";
export const VALOR_MOTIVO_VACIO = "Escribe cuántos puntos propone.";

/** Error de la validación local del diálogo (antes de enviar); `null` si se puede enviar. */
export function validarOpcion(
  catalogo: CatalogoMotivos,
  borrador: { etiqueta: string; valor: number | null },
  excepto?: string,
): { etiqueta?: string; valor?: string } {
  const e: { etiqueta?: string; valor?: string } = {};
  const etiqueta = limpiarEtiqueta(borrador.etiqueta);
  const err = errorEtiqueta(catalogo, etiqueta, excepto);
  if (err) e.etiqueta = errorMotivosTexto(err, etiqueta);
  if (borrador.valor === null) e.valor = VALOR_MOTIVO_VACIO;
  else if (!valorMotivoValido(borrador.valor))
    e.valor = errorMotivosTexto("valor");
  return e;
}

/** Texto de cada error; `que` = la etiqueta en juego («Ya existe «Trabajo extra».»). */
export function errorMotivosTexto(e: ErrorMotivos, que?: string): string {
  switch (e) {
    case "etiqueta":
      return que ? `Usa hasta ${ETIQUETA_MAX} caracteres.` : ETIQUETA_VACIA;
    case "repetida":
      return que
        ? `Ya existe «${que}».`
        : "Ya existe una opción con ese nombre.";
    case "reservada":
      return "«Anulación» la usa el historial. Elige otro nombre.";
    case "valor":
      return "Va de −20 a +20, sin 0, en pasos de 0,5.";
    case "no-existe":
      return "Esa opción ya no existe. Recarga la página.";
    case "ultima":
      return "Tiene que quedar al menos una opción.";
    case "tope":
      return `Ya hay ${MOTIVOS_MAX} opciones. Borra una para crear otra.`;
    case "red":
      return "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.";
    default:
      return "No se pudo guardar. Recarga la página e inténtalo de nuevo.";
  }
}
