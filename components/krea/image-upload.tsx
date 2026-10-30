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
  /** 0–100, solo en `subiendo`. */
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

const ZONE =
  "flex w-full cursor-pointer items-center gap-3 rounded-md border-2 border-dashed p-4 text-left text-text-2 transition-colors duration-fast ease-krea hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/*
 * Subida de imagen — HANDOFF §2.17; medidas en design/canvas/krea.css:466 y Tarea.dc.html.
 * CONTROLADO: recibe `status`/`progress`/`error` y emite `onSelect`/`onRemove`; no sube nada
 * (Storage es la fase 07). Valida tipo y peso y comprime en el cliente antes de `onSelect`.
 * El `<input type="file">` va oculto con `hidden`, abierto por un botón real y enfocable.
 * Anuncio: una región `role="status"` siempre montada cambia de texto solo al empezar y al
 * terminar la subida; el porcentaje es visual y nunca se anuncia 1 % a 1 %.
 */
export function ImageUpload({
  status,
  file,
  progress = 0,
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
  const percent = progressPercent(progress);

  const openPicker = () => inputRef.current?.click();

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.currentTarget.files?.[0];
    // Permite elegir el mismo archivo otra vez
    event.currentTarget.value = "";
    if (!chosen) return;
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

  const announcement =
    status === "subiendo"
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
            <span aria-hidden="true" className="text-small nums shrink-0">
              {percent} %
            </span>
          </div>
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
        <>
          <button
            type="button"
            onClick={openPicker}
            disabled={preparing}
            aria-busy={preparing || undefined}
            className={cn(
              ZONE,
              status === "error" ? "border-error" : "border-input",
              "disabled:cursor-progress",
            )}
          >
            <ImageIcon aria-hidden="true" className="size-5 shrink-0" />
            <span className="text-small">
              {preparing ? (
                "Preparando la imagen…"
              ) : (
                <>
                  <span className="text-small-b text-text">
                    Toca para subir una imagen
                  </span>{" "}
                  · JPG o PNG, hasta 5 MB
                </>
              )}
            </span>
          </button>
          {status === "error" && error ? (
            <Alert variant="err">{error}</Alert>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
