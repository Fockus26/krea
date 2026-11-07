"use client";

import { Clock, Send } from "lucide-react";
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
import { toast } from "@/components/ui/sonner";
import type { ResultadoEnvio, ResultadoSubida } from "@/lib/acciones/entregas";
import { IMAGEN_SUBIDA_MAX_BYTES } from "@/lib/almacen/imagen";
import { type EnvioEntrega, mensajeErrorEntrega } from "@/lib/entregas";
import {
  claveEntrega,
  IMAGEN_SIN_SUBIR,
  type ImagenCola,
  PENDIENTE_ENTREGA,
  PENDIENTE_TITULO,
  SIN_ESPACIO,
  TOAST_ENCOLADA_ENTREGA,
  tituloRechazo,
} from "@/lib/offline/cola";
import {
  alDrenar,
  descartarOp,
  drenarCola,
  encolarOp,
  useOpCola,
} from "@/lib/offline/navegador";
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
  /** Elegida sin conexión: el Blob comprimido está en `file.src` y se sube al entregar (D295). */
  pendiente?: boolean;
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
 * Sin conexión (D292, D295): una imagen elegida queda lista en el teléfono y «Entregar» deja la
 * entrega en la cola (IndexedDB) con el mismo `opId`; se envía sola al volver la red. Mientras
 * espera, «Pendiente de enviar»; si el servidor la rechaza (tarea cerrada o evaluada), el aviso
 * y las respuestas siguen aquí.
 */
export function TaskAnswerForm({
  tareaId,
  titulo = "",
  preguntas,
  inicial = {},
  bloqueadaPor,
  autor,
  titular,
  acciones,
  entregadaHref,
}: {
  tareaId: string;
  /** Título de la tarea: lo nombra el aviso cuando la entrega pendiente se envía. */
  titulo?: string;
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
  // Cola sin conexión (D292): la entrega de este alumno para esta tarea, si está encolada
  const claveCola = claveEntrega(tareaId, titular ?? "");
  const enCola = useOpCola(claveCola);
  const enEspera = enCola?.estado === "pendiente";
  const rechazada = enCola?.estado === "rechazada" ? enCola : null;

  // Cuando la entrega encolada entra (en esta pestaña), el borrador del teléfono sobra
  useEffect(
    () =>
      alDrenar((d) => {
        if (!d.hechas.some((h) => h.op.clave === claveCola)) return;
        try {
          window.localStorage.removeItem(clave);
        } catch {
          // Nada que limpiar
        }
      }),
    [claveCola, clave],
  );

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
    img?.status === "lista" &&
    (!acciones || Boolean(img.path) || Boolean(img.pendiente));
  const imagenesSinSubir = Object.values(imagenes).some(
    (i) => i.status === "lista" && i.pendiente,
  );
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
  // Ya en la cola: no se entrega otra vez (la primera puede estar entrando ahora mismo)
  const listo = puedeEntregar(estados) && !enviando && !enEspera;

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
    // Sin red: queda lista en el teléfono y se sube al entregar (D295)
    if (!navigator.onLine) {
      setImagen(id, { status: "lista", file, pendiente: true });
      setEdiciones((n) => n + 1);
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
              : r.error === "red"
                ? // Se cayó la red al subir: igual que sin conexión
                  { status: "lista", file, pendiente: true }
                : { status: "error", error: mensajeErrorEntrega(r.error) },
          },
    );
    if (r.ok || r.error === "red") setEdiciones((n) => n + 1);
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
    const locales: ImagenCola[] = [];
    for (const p of preguntas) {
      if (p.formato === "texto")
        respuestas[p.id] = { texto: textos[p.id] ?? "" };
      else {
        const img = imagenes[p.id];
        if (img?.path) respuestas[p.id] = { imagenPath: img.path };
        else if (img?.pendiente && img.file?.src instanceof Blob)
          locales.push({
            preguntaId: p.id,
            imagenId: crypto.randomUUID(),
            blob: img.file.src,
          });
      }
    }
    // Un id por intento: si la red se cae a medio camino, la cola reintenta el mismo (D293)
    const opId = crypto.randomUUID();
    setError(null);
    startEnvio(async () => {
      if (locales.length === 0 && navigator.onLine) {
        let r: ResultadoEnvio;
        try {
          r = await acciones.enviar({ tareaId, respuestas, opId });
        } catch {
          r = { ok: false, error: "red" };
        }
        if (r.ok) {
          // La acción refresca la página: pasa a «¡Tarea entregada!»
          setConfirmar(false);
          limpiarBorrador();
          return;
        }
        if (r.error !== "red" || !titular) {
          setConfirmar(false);
          setError(mensajeErrorEntrega(r.error));
          if (r.error === "ya-entregada" || r.error === "cerrada")
            router.refresh();
          return;
        }
      }
      // Sin red (o con imágenes sin subir): a la cola, se envía sola al volver (D292)
      const e = await encolarOp({
        tipo: "entrega",
        opId,
        clave: claveCola,
        titulo,
        tareaId,
        respuestas,
        imagenes: locales,
      });
      setConfirmar(false);
      if (e === "ok") {
        toast(TOAST_ENCOLADA_ENTREGA);
        void drenarCola();
        return;
      }
      setError(e === "sin-espacio" ? SIN_ESPACIO : mensajeErrorEntrega("red"));
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
          {rechazada ? (
            // D294: no se envió y no se reintenta; las respuestas siguen en el teléfono
            <div className="flex flex-col items-start gap-2">
              <ErrorEnPantalla titulo={tituloRechazo(rechazada)}>
                {rechazada.mensaje} Tus respuestas siguen guardadas en este
                teléfono.
              </ErrorEnPantalla>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void descartarOp(rechazada.opId)}
              >
                Entendido
              </Button>
            </div>
          ) : null}
          <ActionBar>
            <div className="flex min-w-0 flex-col">
              {/* Región viva: «Pendiente de enviar» se anuncia al encolar (estado con ícono y texto) */}
              <output aria-live="polite" className="flex flex-col">
                {enEspera ? (
                  <>
                    <span className="flex icono-linea gap-1.5 text-small-b text-text">
                      <Clock aria-hidden="true" className="size-4 shrink-0" />
                      {PENDIENTE_TITULO}
                    </span>
                    <span id={helpId} className="text-small text-text-2">
                      {PENDIENTE_ENTREGA}
                    </span>
                  </>
                ) : (
                  <span className="text-small-b text-text">
                    {faltaTexto(faltan, subiendo)}
                  </span>
                )}
                {imagenesSinSubir && !enEspera ? (
                  <span className="text-small text-text-2">
                    {IMAGEN_SIN_SUBIR}
                  </span>
                ) : null}
              </output>
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
              {listo || enviando || enEspera ? null : (
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
