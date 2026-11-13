// Textos y lógica de Tareas y entrega (HANDOFF §3 Tareas y entrega; lienzo design/canvas/Tarea.dc.html).
// Lógica pura, sin React.
import { formatFecha, formatFechaHora, vencida } from "@/lib/fecha";
import { formatNota } from "@/lib/grades";

/** "20 pts · 5 preguntas". */
export function puntosPreguntasTexto(valores: readonly number[]): string {
  const total = valores.reduce((s, v) => s + v, 0);
  const n = valores.length;
  return `${formatNota(total)} pts · ${n} ${n === 1 ? "pregunta" : "preguntas"}`;
}

/** Eyebrow del encabezado: "Grupal · 5A-G2 Repostería" / "Individual". */
export function eyebrowTarea(
  tipo: "individual" | "grupal",
  equipo?: string,
): string {
  return tipo === "grupal" && equipo ? `Grupal · ${equipo}` : "Individual";
}

/**
 * "Vence 30/10/2026" o, con hora (D355), "Vence 30/10/2026 · 3:30 p. m."; "Venció …" si en
 * `ahora` ya pasaron su fecha y hora (D357).
 */
export function venceTexto(
  iso: string,
  hora?: string | null,
  ahora?: number,
): string {
  const verbo =
    ahora !== undefined && vencida(iso, hora, ahora) ? "Venció" : "Vence";
  return `${verbo} ${formatFechaHora(iso, hora)}`;
}

/** "entregada el 25/10/2026" (fila de Entregadas). */
export function entregadaTexto(iso: string): string {
  return `entregada el ${formatFecha(iso)}`;
}

export type EstadoRespuesta = {
  formato: "texto" | "imagen";
  /** Texto con contenido (sin espacios) o imagen lista. */
  completa: boolean;
  /** Solo imágenes: subiendo ahora. */
  subiendo?: boolean;
};

/** Cuántas faltan por responder y cuántas imágenes siguen subiendo (una subiendo no cuenta como hecha). */
export function avanceEntrega(respuestas: readonly EstadoRespuesta[]): {
  faltan: number;
  subiendo: number;
} {
  let faltan = 0;
  let subiendo = 0;
  for (const r of respuestas) {
    if (r.subiendo) subiendo++;
    else if (!r.completa) faltan++;
  }
  return { faltan, subiendo };
}

/** Lista para entregar: todo respondido y nada subiendo. */
export function puedeEntregar(respuestas: readonly EstadoRespuesta[]): boolean {
  const { faltan, subiendo } = avanceEntrega(respuestas);
  return faltan === 0 && subiendo === 0;
}

/**
 * "Te falta 1 respuesta · 1 imagen subiendo" (lienzo). Todo listo: "Todo respondido."
 * (PLACEHOLDER de copy, CONTENT_CHECKLIST fila 66).
 */
export function faltaTexto(faltan: number, subiendo: number): string {
  const partes: string[] = [];
  if (faltan > 0) {
    partes.push(
      faltan === 1 ? "Te falta 1 respuesta" : `Te faltan ${faltan} respuestas`,
    );
  }
  if (subiendo > 0) {
    partes.push(
      subiendo === 1 ? "1 imagen subiendo" : `${subiendo} imágenes subiendo`,
    );
  }
  return partes.length > 0 ? partes.join(" · ") : "Todo respondido.";
}

/** "4:12 p. m." (es-VE, 12 horas, como el lienzo). */
export function horaTexto(fecha: Date): string {
  const h24 = fecha.getHours();
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const m = String(fecha.getMinutes()).padStart(2, "0");
  return `${h}:${m} ${h24 < 12 ? "a. m." : "p. m."}`;
}

/** "Borrador guardado en este teléfono · 10:42 a. m." */
export function borradorTexto(guardado: Date): string {
  return `Borrador guardado en este teléfono · ${horaTexto(guardado)}`;
}

/** Aviso de capitán (§3): título en negrita y el resto; el género no está en el seed (D075). */
export function avisoCapitanTexto(
  nombre: string,
  femenino = false,
): { titulo: string; texto: string } {
  return {
    titulo: `La entrega ${nombre}, ${femenino ? "capitana" : "capitán"} de tu equipo.`,
    texto: `Puedes ver las preguntas. Las respuestas aparecen aquí cuando ${femenino ? "ella" : "él"} las envíe.`,
  };
}

/**
 * Clave del borrador local de una tarea. Con `titular` (la cédula de la sesión) cada alumno
 * tiene el suyo aunque compartan teléfono.
 */
export function claveBorrador(tareaId: string, titular?: string): string {
  return titular
    ? `krea-borrador-${tareaId}-${titular}`
    : `krea-borrador-${tareaId}`;
}

/** Intervalo del borrador automático (§3: "cada 2 s"). */
export const BORRADOR_MS = 2000;

/**
 * Imagen ya subida (D195): el borrador guarda solo su ruta en el almacén, nombre y peso; nunca
 * la imagen. Al volver se muestra como lista, sin vista previa (no se gasta una descarga).
 */
export type ImagenBorrador = {
  imagenPath: string;
  nombre: string;
  peso: number;
};
/** Por pregunta: texto, una imagen o varias (pregunta «Varias imágenes», D373). */
export type Borrador = Record<
  string,
  string | ImagenBorrador | ImagenBorrador[]
>;

function esImagenBorrador(v: unknown): v is ImagenBorrador {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.imagenPath === "string" &&
    o.imagenPath.length > 0 &&
    typeof o.nombre === "string" &&
    typeof o.peso === "number" &&
    Number.isFinite(o.peso)
  );
}

/** Lee un borrador guardado; lo que no sea id → texto o id → imagen subida se descarta. */
export function leerBorrador(raw: string | null): Borrador {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    const out: Borrador = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === "string") out[k] = v;
      else if (esImagenBorrador(v)) {
        out[k] = { imagenPath: v.imagenPath, nombre: v.nombre, peso: v.peso };
      } else if (Array.isArray(v)) {
        const imgs = v.filter(esImagenBorrador).map((i) => ({
          imagenPath: i.imagenPath,
          nombre: i.nombre,
          peso: i.peso,
        }));
        if (imgs.length > 0) out[k] = imgs;
      }
    }
    return out;
  } catch {
    return {};
  }
}
