// Borrador compartido de una grupal (D544–D548): el capitán lo guarda en el servidor además de en su
// teléfono, y los integrantes lo ven en solo lectura hasta que se envía. Puro (sin base ni reloj):
// lo usan la Server Action (`lib/acciones/borrador-grupal.ts`), la capa de datos, la página y las
// pruebas. El formato es el del borrador local (`Borrador` de `lib/tareas`, D196): textos (y
// enlaces, D468) como cadena e imágenes ya subidas solo por su ruta, nombre y peso (D195).
import { z } from "zod";
import type { QuestionAnswer } from "@/components/krea/question-card-detail";
import {
  type Carpetas,
  esImagenDe,
  type ImagenEnviada,
  partesDeImagen,
  zIdPregunta,
  zIdTarea,
} from "@/lib/entregas";
import { limiteImagenes, type Parte, type Tarea } from "@/lib/modelo";
import { partesVigentes } from "@/lib/partes";
import {
  ANSWER_MAX_LENGTH,
  imagenesConAlt,
  respuestaFirmada,
} from "@/lib/question";
import { tiempoRelativo } from "@/lib/ranking-vista";
import type { Borrador, ImagenBorrador } from "@/lib/tareas";
import { normalizarUrl, URL_MAX_LENGTH } from "@/lib/url-respuesta";

/* ---------- Lo que manda el capitán ---------- */

/** Tope de imágenes de una pregunta «Varias imágenes» (D373). */
const MAX_VARIAS = 10;

const zImagenBorrador = z.object({
  imagenPath: z.string().min(1).max(300),
  nombre: z.string().max(300),
  peso: z.number().finite().nonnegative(),
});

/** Un valor del borrador: texto o enlace (cadena), una imagen o varias. */
const zValorBorrador = z.union([
  z.string().max(Math.max(ANSWER_MAX_LENGTH, URL_MAX_LENGTH)),
  zImagenBorrador,
  z.array(zImagenBorrador).max(MAX_VARIAS),
]);

export const zBorrador = z.record(zIdPregunta, zValorBorrador);

/**
 * «Guardar borrador del equipo» (D546): la tarea, las respuestas y la `version` que el cliente vio
 * (0 si aún no hay fila). Si otro dispositivo del capitán guardó después, `cambio`.
 */
export const zGuardarBorrador = z.object({
  tareaId: zIdTarea,
  respuestas: zBorrador,
  version: z.number().int().nonnegative(),
});
export type GuardarBorrador = z.infer<typeof zGuardarBorrador>;

export type ErrorBorrador =
  /** No es su tarea, no es grupal o no existe. */
  | "no-existe"
  | "cerrada"
  | "sin-equipo"
  /** Solo el capitán guarda el borrador del equipo (D012). */
  | "no-capitan"
  /** La entrega ya salió (también si entró al equipo después, D545): no hay borrador. */
  | "enviada"
  | "incompleta"
  | "red";

export type ResultadoBorrador =
  | { ok: true; version: number }
  /** Otro dispositivo del capitán guardó después: nada se escribió; `version` es la de ahora. */
  | { ok: false; error: "cambio"; version: number }
  | { ok: false; error: ErrorBorrador };

type PreguntaBorrador = Pick<
  Tarea["preguntas"][number],
  "id" | "formato" | "maxImagenes"
>;

/**
 * Lo que se guarda del borrador: solo preguntas de la tarea, cada valor del formato de su pregunta
 * (texto o enlace como cadena, sin recortar: es un borrador) y, de las imágenes, solo las de la
 * carpeta de esta entrega (las de otra no se guardan ni se firman), sin repetir y hasta el límite.
 */
export function limpiarBorrador(
  preguntas: readonly PreguntaBorrador[],
  respuestas: Borrador,
  tareaId: string,
  carpetas: Carpetas,
): Borrador {
  const out: Borrador = {};
  const deEstaEntrega = (img: ImagenBorrador) =>
    esImagenDe(img.imagenPath, tareaId, carpetas);
  for (const p of preguntas) {
    const v = respuestas[p.id];
    if (v === undefined) continue;
    if (p.formato === "texto" || p.formato === "url") {
      const max = p.formato === "texto" ? ANSWER_MAX_LENGTH : URL_MAX_LENGTH;
      if (typeof v === "string" && v.length <= max) out[p.id] = v;
      continue;
    }
    const limite = limiteImagenes(p);
    const lista = (typeof v === "string" ? [] : Array.isArray(v) ? v : [v])
      .filter(deEstaEntrega)
      .filter(
        (img, i, todas) =>
          todas.findIndex(
            (o) =>
              partesDeImagen(o.imagenPath)?.uuid ===
              partesDeImagen(img.imagenPath)?.uuid,
          ) === i,
      )
      .slice(0, limite);
    const [primera] = lista;
    if (!primera) continue;
    out[p.id] = limite > 1 ? lista : primera;
  }
  return out;
}

/** Lo que vuelve de la base (`jsonb`): lo que no valida se descarta entero. */
export function borradorDeValor(v: unknown): Borrador {
  const r = zBorrador.safeParse(v);
  return r.success ? r.data : {};
}

/** Rutas de las imágenes del borrador (para firmarlas o borrarlas de B2). */
export function rutasBorrador(b: Borrador): string[] {
  return Object.values(b).flatMap((v) =>
    typeof v === "string"
      ? []
      : Array.isArray(v)
        ? v.map((i) => i.imagenPath)
        : [v.imagenPath],
  );
}

/** Copia con las claves ordenadas: `jsonb` no conserva el orden de las claves. */
function ordenado(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(ordenado);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.keys(v)
        .sort()
        .map((k) => [k, ordenado((v as Record<string, unknown>)[k])]),
    );
  return v;
}

/** ¿Son el mismo borrador? Un reintento con lo mismo no escribe ni cuenta como cambio. */
export function mismoBorrador(a: Borrador, b: Borrador): boolean {
  return JSON.stringify(ordenado(a)) === JSON.stringify(ordenado(b));
}

/* ---------- Sondeo (D547) ---------- */

/**
 * La huella de `/api/partes/version` con la versión del borrador (0 sin fila) al final, para quien
 * lo sigue (el integrante, `?borrador=1`). El capitán no la pide: su propio guardado no le refresca
 * la página.
 */
export function huellaConBorrador(
  huellaPartes: string,
  version: number | null,
): string {
  return `${huellaPartes}.b${version ?? 0}`;
}

/* ---------- Lo que ve cada uno ---------- */

/** Fila leída de la base, ya validada. */
export type BorradorGuardado = {
  respuestas: Borrador;
  actualizadoEn: number;
  actualizadoPor: string;
  version: number;
};

/** Lo que pinta el integrante (D547): sin cédulas, solo el nombre de quien guardó. */
export type BorradorVista = {
  /** Primer nombre de quien guardó (el capitán, o quien lo era); «el capitán» si no se encuentra. */
  nombre: string;
  actualizadoEn: number;
  /** Por pregunta, solo las que responde el capitán (sin parte vigente de otro o tomada, D461). */
  respuestas: Record<string, QuestionAnswer>;
};

const primerNombre = (nombres: string) => nombres.trim().split(/\s+/)[0] ?? "";

/**
 * El borrador del capitán para un integrante (D547). Convive con el reparto (D463): una pregunta
 * con parte vigente de otro integrante (y no tomada) no se muestra del borrador, porque lo que
 * cuenta es lo que ese integrante entregue. Textos vacíos o enlaces aún no válidos (como texto) se
 * muestran como el capitán los dejó; las imágenes, firmadas.
 */
export function borradorVista(e: {
  preguntas: readonly PreguntaBorrador[];
  borrador: BorradorGuardado | null;
  partes: ReadonlyArray<Pick<Parte, "preguntaId" | "asignado" | "estado">>;
  miembros: readonly string[];
  capitanId: string | null;
  companeros: ReadonlyArray<{ cedula: string; nombres: string }>;
  urls: ReadonlyMap<string, string>;
}): BorradorVista | null {
  const b = e.borrador;
  if (!b) return null;
  const deOtro = new Set(
    partesVigentes(e.partes, e.miembros, e.capitanId)
      .filter((p) => p.estado !== "tomada")
      .map((p) => p.preguntaId),
  );
  const quien = e.companeros.find((c) => c.cedula === b.actualizadoPor);
  const nombre = primerNombre(quien?.nombres ?? "") || BORRADOR_SIN_NOMBRE;
  const respuestas: Record<string, QuestionAnswer> = {};
  e.preguntas.forEach((p, i) => {
    const v = b.respuestas[p.id];
    if (v === undefined || deOtro.has(p.id)) return;
    if (typeof v === "string") {
      if (v.trim() === "") return;
      const u = p.formato === "url" ? normalizarUrl(v) : null;
      respuestas[p.id] = u?.ok
        ? { tipo: "url", url: u.url }
        : { tipo: "texto", texto: v };
      return;
    }
    const rutas = Array.isArray(v)
      ? v.map((x) => x.imagenPath)
      : [v.imagenPath];
    const firmada = respuestaFirmada(
      imagenesConAlt(rutas, nombre, i + 1),
      e.urls,
    );
    respuestas[p.id] = firmada ?? {
      tipo: "texto",
      texto: BORRADOR_IMAGEN_SIN_VISTA,
    };
  });
  return { nombre, actualizadoEn: b.actualizadoEn, respuestas };
}

/**
 * El borrador del servidor como respuestas iniciales del formulario del capitán (D548): si en este
 * teléfono no hay borrador local, arranca con el del equipo. Imágenes ya subidas, con su vista
 * previa si se firmó.
 */
export function inicialDesdeBorrador(
  preguntas: readonly PreguntaBorrador[],
  b: Borrador,
  urls: ReadonlyMap<string, string>,
): Record<string, string | ImagenEnviada | ImagenEnviada[]> {
  const out: Record<string, string | ImagenEnviada | ImagenEnviada[]> = {};
  const imagen = (i: ImagenBorrador): ImagenEnviada => ({
    status: "lista",
    file: { name: i.nombre, size: i.peso, src: urls.get(i.imagenPath) ?? "" },
    path: i.imagenPath,
  });
  for (const p of preguntas) {
    const v = b[p.id];
    if (v === undefined) continue;
    if (typeof v === "string") {
      if (p.formato !== "imagen") out[p.id] = v;
    } else if (p.formato === "imagen") {
      const lista = (Array.isArray(v) ? v : [v]).map(imagen);
      const [primera] = lista;
      if (limiteImagenes(p) > 1) out[p.id] = lista;
      else if (primera) out[p.id] = primera;
    }
  }
  return out;
}

/* ---------- Rebote del guardado (D546) ---------- */

/**
 * Cuánto espera el formulario del capitán desde el último cambio para mandar el borrador al
 * servidor (el del teléfono sigue a los 2 s, `BORRADOR_MS`). Solo si cambió desde el último guardado.
 */
export const BORRADOR_EQUIPO_MS = 5_000;

/* ---------- Copy (PROVISIONAL, CONTENT_CHECKLIST filas 298–301) ---------- */

/** Fila 299: quien guardó, cuando no se encuentra en el equipo. */
export const BORRADOR_SIN_NOMBRE = "el capitán";

/** Fila 299: imagen del borrador que no se pudo firmar. */
export const BORRADOR_IMAGEN_SIN_VISTA = "Imagen subida (sin vista previa)";

/** Fila 299: etiqueta de la respuesta del borrador dentro de cada pregunta. */
export const BORRADOR_ETIQUETA = "En el borrador";

/** Fila 299: «Borrador de Ana · guardado hace 3 min». */
export function avisoBorradorTexto(
  nombre: string,
  actualizadoEn: number,
  ahora: number,
): string {
  return `Borrador de ${nombre} · guardado ${tiempoRelativo(ahora, actualizadoEn)}`;
}

/** Fila 299: debajo del aviso. */
export const BORRADOR_AYUDA =
  "Así va la tarea. Puede cambiar hasta que se entregue.";

/** Fila 299: lo que anuncia el lector de pantalla cuando llega un borrador más nuevo. */
export const BORRADOR_ACTUALIZADO = (nombre: string, hora: string): string =>
  `Borrador de ${nombre} actualizado a las ${hora}.`;

/** Fila 300: el capitán, cuando su borrador ya está en el servidor. */
export function borradorEquipoTexto(hora: string): string {
  return `Tu equipo ya lo ve · ${hora}`;
}

/** Fila 301: otro dispositivo del capitán guardó después (D546, como D509/D532). */
export const BORRADOR_CAMBIO =
  "Tu borrador también se editó en otro dispositivo. Lo que escribas aquí lo reemplaza.";
