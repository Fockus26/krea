"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
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
import type { ResultadoEnvio, ResultadoSubida } from "@/lib/acciones/entregas";
import { IMAGEN_SUBIDA_MAX_BYTES } from "@/lib/almacen/imagen";
import { type EnvioEntrega, mensajeErrorEntrega } from "@/lib/entregas";
import {
  avanceEntrega,
  BORRADOR_MS,
  type Borrador,
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
  /** Ruta en el almacén una vez subida (D195). */
  path?: string;
};

/** Server Actions de la entrega; sin ellas (galerías) la imagen queda lista sin subir. */
export type AccionesEntrega = {
  subir: (form: FormData) => Promise<ResultadoSubida>;
  enviar: (envio: EnvioEntrega) => Promise<ResultadoEnvio>;
};

/** Respuestas iniciales por id de pregunta (lo que ya estaba en el dispositivo). */
export type RespuestasIniciales = Readonly<
  Record<string, string | ImagenRespuesta>
>;

const IMAGEN_VACIA: ImagenRespuesta = { status: "vacia" };

/** Borrador del dispositivo → textos e imágenes ya subidas (sin vista previa: no se descargan). */
function desdeBorrador(
  b: Borrador,
): [Record<string, string>, Record<string, ImagenRespuesta>] {
  const textos: Record<string, string> = {};
  const imagenes: Record<string, ImagenRespuesta> = {};
  for (const [id, v] of Object.entries(b)) {
    if (typeof v === "string") textos[id] = v;
    else
      imagenes[id] = {
        status: "lista",
        file: { name: v.nombre, size: v.peso, src: "" },
        path: v.imagenPath,
      };
  }
  return [textos, imagenes];
}

/**
 * Preguntas y acción de la entrega (HANDOFF §3 Tareas y entrega). Cada pregunta es un
 * `QuestionCardAnswer` (cuerpo propio, §8). El borrador vive en el dispositivo (`localStorage`,
 * 2 s después del último cambio, D196): los textos y, de las imágenes, solo la ruta de las ya
 * subidas. Con `acciones` (la ruta real) cada imagen se sube al elegirla y «Entregar» envía la
 * entrega por Server Action; sin ellas (galerías) la imagen queda lista sin subir y «Entregar»
 * solo navega. "Entregar tarea" está deshabilitado hasta completar y pide confirmación. Con
 * `bloqueadaPor` (no capitán, D012) las preguntas se ven sin campos y no hay barra de acción.
 */
export function TaskAnswerForm({
  tareaId,
  preguntas,
  inicial = {},
  bloqueadaPor,
  autor,
  titular,
  acciones,
  entregadaHref,
}: {
  tareaId: string;
  preguntas: readonly PreguntaEntrega[];
  inicial?: RespuestasIniciales;
  /** Nombre corto del capitán cuando quien mira no lo es. */
  bloqueadaPor?: string;
  /** Nombre de quien responde: da el `alt` de sus imágenes. */
  autor: string;
  /** Cédula de la sesión: separa el borrador de cada alumno en el mismo teléfono. */
  titular?: string;
  acciones?: AccionesEntrega;
  /** A dónde ir tras entregar sin `acciones` (galerías). */
  entregadaHref: string;
}) {
  const router = useRouter();
  const helpId = useId();
  const titleId = useId();
  const clave = claveBorrador(tareaId, titular);
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
  // Cuenta las ediciones del alumno: el borrador solo se guarda si cambió algo
  const [ediciones, setEdiciones] = useState(0);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, startEnvio] = useTransition();

  // Recupera el borrador del dispositivo una vez (gana sobre lo inicial). Un refresco del
  // servidor trae props nuevas: el ref evita pisar lo que el alumno ya escribió.
  const restaurado = useRef(false);
  useEffect(() => {
    if (bloqueadaPor || restaurado.current) return;
    restaurado.current = true;
    try {
      const [t, i] = desdeBorrador(
        leerBorrador(window.localStorage.getItem(clave)),
      );
      const formato = new Map(preguntas.map((p) => [p.id, p.formato]));
      const soloDe = <T,>(m: Record<string, T>, f: "texto" | "imagen") =>
        Object.fromEntries(
          Object.entries(m).filter(([id]) => formato.get(id) === f),
        );
      setTextos((prev) => ({ ...prev, ...soloDe(t, "texto") }));
      // Una imagen sin ruta no se subió: el borrador de las galerías no la restaura
      if (acciones)
        setImagenes((prev) => ({ ...prev, ...soloDe(i, "imagen") }));
    } catch {
      // Sin almacenamiento (modo privado): se trabaja sin borrador
    }
  }, [clave, bloqueadaPor, preguntas, acciones]);

  // Borrador automático: 2 s después del último cambio
  useEffect(() => {
    if (bloqueadaPor || ediciones === 0) return;
    const t = setTimeout(() => {
      const borrador: Borrador = { ...textos };
      for (const [id, img] of Object.entries(imagenes)) {
        if (img.status === "lista" && img.path && img.file) {
          borrador[id] = {
            imagenPath: img.path,
            nombre: img.file.name,
            peso: img.file.size,
          };
        }
      }
      try {
        window.localStorage.setItem(clave, JSON.stringify(borrador));
        setGuardado(new Date());
      } catch {
        // Sin almacenamiento: no se muestra "Borrador guardado"
      }
    }, BORRADOR_MS);
    return () => clearTimeout(t);
  }, [ediciones, textos, imagenes, clave, bloqueadaPor]);

  const imagenLista = (img: ImagenRespuesta | undefined) =>
    img?.status === "lista" && (!acciones || Boolean(img.path));
  const estados: EstadoRespuesta[] = preguntas.map((p) =>
    p.formato === "texto"
      ? { formato: "texto", completa: (textos[p.id] ?? "").trim() !== "" }
      : {
          formato: "imagen",
          completa: imagenLista(imagenes[p.id]),
          subiendo: imagenes[p.id]?.status === "subiendo",
        },
  );
  const { faltan, subiendo } = avanceEntrega(estados);
  const listo = puedeEntregar(estados) && !enviando;

  const setImagen = (id: string, v: ImagenRespuesta) =>
    setImagenes((prev) => ({ ...prev, [id]: v }));

  async function elegirImagen(id: string, blob: Blob, meta: { name: string }) {
    const file = { name: meta.name, size: blob.size, src: blob };
    if (!acciones) {
      setImagen(id, { status: "lista", file });
      return;
    }
    if (blob.size > IMAGEN_SUBIDA_MAX_BYTES) {
      setImagen(id, {
        status: "error",
        error: mensajeErrorEntrega("imagen-peso"),
      });
      return;
    }
    setImagen(id, { status: "subiendo", file });
    const form = new FormData();
    form.set("tareaId", tareaId);
    form.set("preguntaId", id);
    form.set("imagen", blob, "respuesta.jpg");
    let r: ResultadoSubida;
    try {
      r = await acciones.subir(form);
    } catch {
      r = { ok: false, error: "red" };
    }
    // Si mientras subía la cambió o la quitó, este resultado ya no es el suyo
    setImagenes((prev) =>
      prev[id]?.file?.src !== blob
        ? prev
        : {
            ...prev,
            [id]: r.ok
              ? { status: "lista", file, path: r.imagenPath }
              : { status: "error", error: mensajeErrorEntrega(r.error) },
          },
    );
    if (r.ok) setEdiciones((n) => n + 1);
  }

  function limpiarBorrador() {
    try {
      window.localStorage.removeItem(clave);
    } catch {
      // Nada que limpiar
    }
  }

  function entregar() {
    if (!acciones) {
      limpiarBorrador();
      router.push(entregadaHref);
      return;
    }
    const respuestas: EnvioEntrega["respuestas"] = {};
    for (const p of preguntas) {
      if (p.formato === "texto")
        respuestas[p.id] = { texto: textos[p.id] ?? "" };
      else {
        const path = imagenes[p.id]?.path;
        if (path) respuestas[p.id] = { imagenPath: path };
      }
    }
    setError(null);
    startEnvio(async () => {
      let r: ResultadoEnvio;
      try {
        r = await acciones.enviar({ tareaId, respuestas });
      } catch {
        r = { ok: false, error: "red" };
      }
      setConfirmar(false);
      if (r.ok) {
        // La acción refresca la página: pasa a «¡Tarea entregada!»
        limpiarBorrador();
        return;
      }
      setError(mensajeErrorEntrega(r.error));
      if (r.error === "ya-entregada" || r.error === "cerrada") router.refresh();
    });
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
                  onSelect: (blob, meta) => {
                    void elegirImagen(p.id, blob, meta);
                  },
                  onReject: (message) =>
                    setImagen(p.id, { status: "error", error: message }),
                  onRemove: () => {
                    setImagen(p.id, IMAGEN_VACIA);
                    setEdiciones((n) => n + 1);
                  },
                }}
              />
            ),
          )}
        </ol>
      </section>
      {bloqueadaPor ? null : (
        <>
          {error ? (
            // D171: qué pasó y qué no se perdió (el borrador sigue en este dispositivo)
            <ErrorEnPantalla titulo="No pudimos recibir tu entrega">
              {error} Tus respuestas siguen guardadas en este teléfono.
            </ErrorEnPantalla>
          ) : null}
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
              <Dialog
                open={confirmar}
                onOpenChange={(o) => {
                  if (!enviando) setConfirmar(o);
                }}
              >
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
                      <Button variant="secondary" disabled={enviando}>
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button
                      onClick={entregar}
                      loading={enviando}
                      loadingLabel="Entregando…"
                    >
                      <Send aria-hidden="true" />
                      Entregar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {listo || enviando ? null : (
                <p id={helpId} className="text-small text-text-2">
                  Se activa cuando respondas todas las preguntas.
                </p>
              )}
            </div>
          </ActionBar>
        </>
      )}
    </>
  );
}
