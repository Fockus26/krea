// Entrada de imágenes por las tres vías (explorador, arrastrar y soltar, pegar): todas terminan
// en el mismo archivo y pasan por `validateImage`. Puro: recibe estructuras mínimas, sin DOM.

import { IMAGE_TYPES } from "@/lib/image";

/** Texto de ayuda de la zona (PROVISIONAL, sin fila de checklist: copy de la tanda 2026-11-06). */
export const IMAGE_HELP_TEXT = "Arrastra, pega o busca una imagen";
/** Texto del estado «arrastrando sobre la zona». */
export const IMAGE_DROP_TEXT = "Suelta la imagen aquí";

type ListaDeArchivos = ArrayLike<File> | null | undefined;

type ItemPortapapeles = {
  kind: string;
  type: string;
  getAsFile: () => File | null;
};

/** Forma mínima de `DataTransfer` (arrastre o portapapeles). */
export type EntradaDeDatos = {
  files?: ListaDeArchivos;
  items?: ArrayLike<ItemPortapapeles> | null;
  types?: ArrayLike<string> | readonly string[] | null;
};

const esImagen = (file: { type: string }) =>
  (IMAGE_TYPES as readonly string[]).includes(file.type);

/** ¿El arrastre lleva archivos? (texto o enlaces arrastrados no activan la zona). */
export function arrastreLlevaArchivos(data: EntradaDeDatos | null | undefined) {
  if (!data?.types) return false;
  return Array.from(data.types).includes("Files");
}

/**
 * El archivo que entra: el primero que sea JPG/PNG; si ninguno lo es, el primero a secas, para que
 * `validateImage` dé el mensaje de tipo. Sin archivos (p. ej. se pegó texto) devuelve `null`.
 */
export function archivoDeEntrada(
  data: EntradaDeDatos | null | undefined,
): File | null {
  if (!data) return null;
  const archivos: File[] = Array.from(data.files ?? []);
  if (archivos.length === 0 && data.items) {
    for (const item of Array.from(data.items)) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (file) archivos.push(file);
    }
  }
  return archivos.find(esImagen) ?? archivos[0] ?? null;
}

/**
 * Un pegado sin foco en la zona solo se toma si hay exactamente una zona vacía visible y el
 * foco no está en un campo donde se escribe (así no se roba el pegado de texto).
 */
export function destinoDelPegado(
  zonasVacias: number,
  enCampoDeTexto: boolean,
): "unica" | "ninguno" {
  if (enCampoDeTexto) return "ninguno";
  return zonasVacias === 1 ? "unica" : "ninguno";
}
