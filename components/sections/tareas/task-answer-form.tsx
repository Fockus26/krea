"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import type {
  ImageUploadFile,
  ImageUploadStatus,
} from "@/components/krea/image-upload";
import { QuestionCardAnswer } from "@/components/krea/question-card-answer";
import { ActionBar } from "@/components/sections/shared/action-bar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  avanceEntrega,
  BORRADOR_MS,
  borradorTexto,
  claveBorrador,
  type EstadoRespuesta,
  faltaTexto,
  leerBorrador,
  puedeEntregar,
} from "@/lib/tareas";

export type PreguntaEntrega = {
  id: string;
  enunciado: string;
  formato: "texto" | "imagen";
  valor: number;
};

export type ImagenRespuesta = {
  status: ImageUploadStatus;
  file?: ImageUploadFile;
  progress?: number;
  error?: string;
};

/** Respuestas iniciales por id de pregunta (lo que ya estaba en el dispositivo). */
export type RespuestasIniciales = Readonly<
  Record<string, string | ImagenRespuesta>
>;

const IMAGEN_VACIA: ImagenRespuesta = { status: "vacia" };

/**
 * Preguntas y acción de la entrega (HANDOFF §3 Tareas y entrega). Cada pregunta es un
 * `QuestionCardAnswer` (cuerpo propio, §8). Los textos se guardan como borrador en el
 * dispositivo cada 2 s (`localStorage`, nunca las imágenes); la subida de imágenes es de la
 * fase 07: aquí la imagen elegida queda lista sin subir. "Entregar tarea" está deshabilitado
 * hasta completar y pide confirmación en un diálogo. Con `bloqueadaPor` (no capitán, D012) las
 * preguntas se ven sin campos y no hay barra de acción.
 */
export function TaskAnswerForm({
  tareaId,
  preguntas,
  inicial = {},
  bloqueadaPor,
  autor,
  entregadaHref,
}: {
  tareaId: string;
  preguntas: readonly PreguntaEntrega[];
  inicial?: RespuestasIniciales;
  /** Nombre corto del capitán cuando quien mira no lo es. */
  bloqueadaPor?: string;
  /** Nombre de quien responde: da el `alt` de sus imágenes. */
  autor: string;
  /** A dónde ir tras entregar (la fase 07 envía la entrega antes). */
  entregadaHref: string;
}) {
  const router = useRouter();
  const helpId = useId();
  const titleId = useId();
  const [textos, setTextos] = useState<Record<string, string>>(() => {
    const t: Record<string, string> = {};
    for (const p of preguntas) {
      const v = inicial[p.id];
      if (p.formato === "texto") t[p.id] = typeof v === "string" ? v : "";
    }
    return t;
  });
  const [imagenes, setImagenes] = useState<Record<string, ImagenRespuesta>>(
    () => {
      const i: Record<string, ImagenRespuesta> = {};
      for (const p of preguntas) {
        const v = inicial[p.id];
        if (p.formato === "imagen")
          i[p.id] = v && typeof v !== "string" ? v : IMAGEN_VACIA;
      }
      return i;
    },
  );
  const [guardado, setGuardado] = useState<Date | null>(null);
  // Cuenta las ediciones del alumno: el borrador solo se guarda si escribió algo
  const [ediciones, setEdiciones] = useState(0);

  // Recupera el borrador del dispositivo una vez (gana sobre lo inicial)
  useEffect(() => {
    if (bloqueadaPor) return;
    try {
      const borrador = leerBorrador(
        window.localStorage.getItem(claveBorrador(tareaId)),
      );
      if (Object.keys(borrador).length > 0) {
        setTextos((prev) => ({ ...prev, ...borrador }));
      }
    } catch {
      // Sin almacenamiento (modo privado): se trabaja sin borrador
    }
  }, [tareaId, bloqueadaPor]);

  // Borrador automático: 2 s después del último cambio
  useEffect(() => {
    if (bloqueadaPor || ediciones === 0) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(
          claveBorrador(tareaId),
          JSON.stringify(textos),
        );
        setGuardado(new Date());
      } catch {
        // Sin almacenamiento: no se muestra "Borrador guardado"
      }
    }, BORRADOR_MS);
    return () => clearTimeout(t);
  }, [ediciones, textos, tareaId, bloqueadaPor]);

  const estados: EstadoRespuesta[] = preguntas.map((p) =>
    p.formato === "texto"
      ? { formato: "texto", completa: (textos[p.id] ?? "").trim() !== "" }
      : {
          formato: "imagen",
          completa: imagenes[p.id]?.status === "lista",
          subiendo: imagenes[p.id]?.status === "subiendo",
        },
  );
  const { faltan, subiendo } = avanceEntrega(estados);
  const listo = puedeEntregar(estados);

  const setImagen = (id: string, v: ImagenRespuesta) =>
    setImagenes((prev) => ({ ...prev, [id]: v }));

  function entregar() {
    try {
      window.localStorage.removeItem(claveBorrador(tareaId));
    } catch {
      // Nada que limpiar
    }
    router.push(entregadaHref);
  }

  return (
    <>
      <section aria-labelledby={titleId} className="flex flex-col gap-3">
        <h2 id={titleId} className="text-h2 text-text">
          Preguntas
        </h2>
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {preguntas.map((p, i) =>
            p.formato === "texto" ? (
              <QuestionCardAnswer
                key={p.id}
                numero={i + 1}
                enunciado={p.enunciado}
                valor={p.valor}
                bloqueadaPor={bloqueadaPor}
                level={3}
                formato="texto"
                value={textos[p.id] ?? ""}
                onValueChange={(v) => {
                  setTextos((prev) => ({ ...prev, [p.id]: v }));
                  setEdiciones((n) => n + 1);
                }}
              />
            ) : (
              <QuestionCardAnswer
                key={p.id}
                numero={i + 1}
                enunciado={p.enunciado}
                valor={p.valor}
                bloqueadaPor={bloqueadaPor}
                level={3}
                formato="imagen"
                upload={{
                  ...(imagenes[p.id] ?? IMAGEN_VACIA),
                  alt: `Vista previa de la respuesta de ${autor} a la pregunta ${i + 1}`,
                  onSelect: (blob, meta) =>
                    setImagen(p.id, {
                      status: "lista",
                      file: { name: meta.name, size: blob.size, src: blob },
                    }),
                  onReject: (message) =>
                    setImagen(p.id, { status: "error", error: message }),
                  onRemove: () => setImagen(p.id, IMAGEN_VACIA),
                }}
              />
            ),
          )}
        </ol>
      </section>
      {bloqueadaPor ? null : (
        <ActionBar>
          <div className="flex min-w-0 flex-col">
            <p className="text-small-b text-text">
              {faltaTexto(faltan, subiendo)}
            </p>
            {guardado ? (
              <p className="text-small text-text-2">
                {borradorTexto(guardado)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  disabled={!listo}
                  aria-describedby={listo ? undefined : helpId}
                >
                  <Send aria-hidden="true" />
                  Entregar tarea
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Entregar ahora?</DialogTitle>
                  <DialogDescription>
                    Después no se puede cambiar.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={entregar}>
                    <Send aria-hidden="true" />
                    Entregar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {listo ? null : (
              <p id={helpId} className="text-small text-text-2">
                Se activa cuando respondas todas las preguntas.
              </p>
            )}
          </div>
        </ActionBar>
      )}
    </>
  );
}
