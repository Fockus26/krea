"use client";

import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  compressImage,
  formatFileSize,
  IMAGE_ACCEPT,
  progressPercent,
  validateImage,
} from "@/lib/image";
import {
  archivoDeEntrada,
  arrastreLlevaArchivos,
  destinoDelPegado,
  IMAGE_DROP_TEXT,
  IMAGE_HELP_TEXT,
} from "@/lib/image-entrada";
import { cn } from "@/lib/utils";

export type ImageUploadStatus = "vacia" | "subiendo" | "lista" | "error";

/** Imagen elegida: `src` es una URL (remota o ya creada) o un `Blob` local. */
export type ImageUploadFile = {
  name: string;
  /** Peso en bytes (el que se muestra en el chip). */
  size: number;
  src: string | Blob;
};

export type ImageUploadProps = {
  status: ImageUploadStatus;
  /** Archivo actual en `subiendo` y `lista`. */
  file?: ImageUploadFile;
  /**
   * 0–100, solo en `subiendo`. Sin valor = progreso desconocido (la subida por Server Action no
   * lo da): sin porcentaje ni barra, solo el nombre y «Subiendo…».
   */
  progress?: number;
  /** Motivo del fallo en `error` (se muestra en la alerta). */
  error?: string;
  /** Texto alternativo de la miniatura: "Vista previa: logo-reposteria.jpg". */
  alt?: string;
  /**
   * Ya validada y comprimida (1600 px, JPEG 0,8): el llamador la sube cuando toque (fase 07).
   * `name` es el nombre del archivo original y `originalSize` su peso.
   */
  onSelect: (blob: Blob, meta: { name: string; originalSize: number }) => void;
  /** Tipo o peso inválidos, o la compresión falló: el llamador pasa a `error` con este mensaje. */
  onReject: (message: string) => void;
  onRemove: () => void;
  className?: string;
};

/** URL de vista previa para un `Blob`; se revoca al cambiar el blob o al desmontar. */
function usePreviewUrl(src: string | Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!(src instanceof Blob)) {
      setUrl(src);
      return;
    }
    const objectUrl = URL.createObjectURL(src);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [src]);
  return url;
}

/** Zonas vacías montadas y visibles → su manejador de archivo. Alimenta el pegado global. */
const zonasVacias = new Map<symbol, (file: File) => void>();

function enCampoDeTexto(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLInputElement && target.type !== "file")
  );
}

function handleDocumentPaste(event: ClipboardEvent) {
  // La zona con foco ya lo atendió con su propio onPaste
  if (event.defaultPrevented) return;
  if (
    destinoDelPegado(zonasVacias.size, enCampoDeTexto(event.target)) ===
    "ninguno"
  )
    return;
  const pasted = archivoDeEntrada(event.clipboardData);
  const [accept] = zonasVacias.values();
  if (!(pasted && accept)) return;
  event.preventDefault();
  accept(pasted);
}

/** Registra una zona vacía; un único listener en `document` mientras haya alguna. Devuelve el desregistro. */
function registrarZona(accept: (file: File) => void): () => void {
  const id = Symbol("image-upload");
  if (zonasVacias.size === 0)
    document.addEventListener("paste", handleDocumentPaste);
  zonasVacias.set(id, accept);
  return () => {
    zonasVacias.delete(id);
    if (zonasVacias.size === 0)
      document.removeEventListener("paste", handleDocumentPaste);
  };
}

const ZONE =
  "flex w-full cursor-pointer items-center gap-3 rounded-md border-2 border-dashed p-4 text-left text-text-2 transition-colors duration-fast ease-krea hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/*
 * Subida de imagen — HANDOFF §2.17; medidas en design/canvas/krea.css:466 y Tarea.dc.html.
 * CONTROLADO: recibe `status`/`progress`/`error` y emite `onSelect`/`onRemove`; no sube nada
 * (lo hace el llamador: la entrega, D195). Valida tipo y peso y comprime en el cliente antes de `onSelect`.
 * El `<input type="file">` va oculto con `hidden`, abierto por un botón real y enfocable.
 * También acepta arrastrar y soltar y pegar (D246, D247); las tres vías entran por `acceptFile`.
 * Anuncio: una región `role="status"` siempre montada cambia de texto solo al empezar y al
 * terminar la subida; el porcentaje es visual y nunca se anuncia 1 % a 1 %.
 */
export function ImageUpload({
  status,
  file,
  progress,
  error,
  alt,
  onSelect,
  onReject,
  onRemove,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const previewUrl = usePreviewUrl(file?.src);
  const percent = progress === undefined ? null : progressPercent(progress);

  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const zoneVisible = status === "vacia" || status === "error";
  const zoneOpen = zoneVisible && !preparing;

  const openPicker = () => inputRef.current?.click();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.currentTarget.files?.[0];
    // Permite elegir el mismo archivo otra vez
    event.currentTarget.value = "";
    if (chosen) void acceptFile(chosen);
  }

  function handleDragEnter(event: React.DragEvent) {
    if (!zoneOpen || !arrastreLlevaArchivos(event.dataTransfer)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }

  function handleDragOver(event: React.DragEvent) {
    // Sin preventDefault el navegador no deja soltar
    if (!zoneOpen || !arrastreLlevaArchivos(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave() {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  function handleDrop(event: React.DragEvent) {
    dragDepth.current = 0;
    setDragging(false);
    if (!zoneOpen) return;
    // Siempre se evita que el navegador abra el archivo soltado
    event.preventDefault();
    const dropped = archivoDeEntrada(event.dataTransfer);
    if (dropped) void acceptFile(dropped);
  }

  function handlePaste(event: React.ClipboardEvent) {
    if (!zoneOpen) return;
    const pasted = archivoDeEntrada(event.clipboardData);
    // Texto pegado: no se toca
    if (!pasted) return;
    event.preventDefault();
    void acceptFile(pasted);
  }

  // Pegar sin foco en la zona: solo si es la única zona vacía visible de la página.
  const acceptRef = useRef(acceptFile);
  acceptRef.current = acceptFile;
  useEffect(() => {
    if (!zoneOpen) return;
    return registrarZona((file) => acceptRef.current(file));
  }, [zoneOpen]);

  async function acceptFile(chosen: File) {
    const check = validateImage(chosen);
    if (!check.ok) {
      onReject(check.message);
      return;
    }
    setPreparing(true);
    try {
      const blob = await compressImage(chosen);
      onSelect(blob, { name: chosen.name, originalSize: chosen.size });
    } catch {
      onReject("No se pudo preparar la imagen. Prueba con otra.");
    } finally {
      setPreparing(false);
    }
  }

  const announcement = dragging
    ? IMAGE_DROP_TEXT
    : status === "subiendo"
      ? "Subiendo la imagen. No cierres la app."
      : status === "lista" && file
        ? `Imagen lista: ${file.name}`
        : "";

  return (
    <div
      data-slot="image-upload"
      data-status={status}
      className={cn("flex flex-col gap-3", className)}
    >
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={handleChange}
      />
      <output className="sr-only">{announcement}</output>

      {status === "subiendo" ? (
        <div className="flex flex-col gap-3 rounded-md border-2 border-dashed border-input p-4 text-text-2">
          <div className="flex items-center gap-3">
            <ImageIcon aria-hidden="true" className="size-5 shrink-0" />
            <span className="text-small-b min-w-0 flex-1 truncate text-text">
              {file?.name}
            </span>
            {percent === null ? null : (
              <span aria-hidden="true" className="text-small nums shrink-0">
                {percent} %
              </span>
            )}
          </div>
          {percent === null ? null : (
            <div
              role="progressbar"
              aria-label="Progreso de la subida"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-2 overflow-hidden rounded-pill bg-surface-3"
            >
              <i
                className="block h-full w-full origin-left rounded-pill bg-accent transition-transform duration-fast ease-krea"
                style={{ transform: `scaleX(${percent / 100})` }}
              />
            </div>
          )}
          <span className="text-small">Subiendo… no cierres la app.</span>
        </div>
      ) : null}

      {status === "lista" && file ? (
        <div className="flex flex-wrap items-end gap-4">
          <div className="relative aspect-4/3 w-55 max-w-full overflow-hidden rounded-nav bg-surface-2">
            {previewUrl ? (
              // biome-ignore lint/performance/noImgElement: blobs locales y remotos (D046)
              <img
                src={previewUrl}
                alt={alt ?? `Vista previa: ${file.name}`}
                className="size-full object-cover"
              />
            ) : null}
            <span className="text-small-b nums absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-sm bg-scrim-chip px-2 py-1 text-on-scrim">
              {file.name} · {formatFileSize(file.size)}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={openPicker}
              disabled={preparing}
            >
              <Upload aria-hidden="true" />
              Cambiar imagen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-error"
              onClick={onRemove}
            >
              <Trash2 aria-hidden="true" />
              Quitar
            </Button>
          </div>
        </div>
      ) : null}

      {status === "vacia" || status === "error" ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: solo recibe el arrastre; la acción accesible es el botón de dentro
        <div
          className="flex flex-col gap-3"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <button
            type="button"
            onClick={openPicker}
            onPaste={handlePaste}
            disabled={preparing}
            aria-busy={preparing || undefined}
            className={cn(
              ZONE,
              dragging
                ? "border-solid border-accent-ink bg-accent-soft"
                : status === "error"
                  ? "border-error"
                  : "border-input",
              "disabled:cursor-progress",
            )}
          >
            <ImageIcon aria-hidden="true" className="size-5 shrink-0" />
            <span className="text-small">
              {preparing ? (
                "Preparando la imagen…"
              ) : dragging ? (
                <span className="text-small-b text-text">
                  {IMAGE_DROP_TEXT}
                </span>
              ) : (
                <>
                  <span className="text-small-b text-text">
                    {IMAGE_HELP_TEXT}
                  </span>{" "}
                  · JPG o PNG, hasta 5 MB
                </>
              )}
            </span>
          </button>
          {status === "error" && error ? (
            <Alert variant="err">{error}</Alert>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
