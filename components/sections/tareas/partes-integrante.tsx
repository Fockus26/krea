"use client";

import { Send } from "lucide-react";
import { useEffect, useId, useState, useTransition } from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { BotonEnLinea } from "@/components/krea/boton-en-linea";
import { QuestionCardAnswer } from "@/components/krea/question-card-answer";
import type { QuestionAnswer } from "@/components/krea/question-card-detail";
import {
  EstadoParte,
  RespuestaParteVista,
} from "@/components/sections/tareas/estado-parte";
import type {
  ImagenRespuesta,
  PreguntaEntrega,
} from "@/components/sections/tareas/task-answer-form";
import { toast } from "@/components/ui/sonner";
import type { ResultadoSubida } from "@/lib/acciones/entregas";
import type { ResultadoParte } from "@/lib/acciones/partes";
import { IMAGEN_SUBIDA_MAX_BYTES } from "@/lib/almacen/imagen";
import { mensajeErrorEntrega } from "@/lib/entregas";
import type { EstadoParteId, Respuesta } from "@/lib/modelo";
import {
  ENTREGAR_PARTE,
  mensajeErrorParte,
  PARTE_ACEPTADA_AYUDA,
  PARTE_DEVUELTA_AYUDA,
  PARTE_ENTREGADA_AYUDA,
  PARTE_ENTREGADA_TOAST,
  PARTES_TITULO,
  partesAvisoTexto,
  partesTomadasAvisoTexto,
  REENTREGAR_PARTE,
} from "@/lib/partes";
import { relanzarSiEsDeploy } from "@/lib/recarga-deploy";
import { BORRADOR_MS } from "@/lib/tareas";
import { normalizarUrl } from "@/lib/url-respuesta";

/** Server Actions de la parte del integrante; sin ellas (galerías) no se sube ni se entrega. */
export type AccionesParteIntegrante = {
  subir: (form: FormData) => Promise<ResultadoSubida>;
  entregar: (e: {
    tareaId: string;
    preguntaId: string;
    respuesta: Respuesta;
  }) => Promise<ResultadoParte>;
};

/** Imagen ya subida que la página trae de la parte (con su vista previa firmada, si se firmó). */
type ImagenInicial = ImagenRespuesta & { path: string };

export type ParteDeIntegrante =
  | {
      mia: true;
      estado: EstadoParteId;
      /** Lo que ya entregó: texto, enlace (D468) o imágenes subidas (para seguir editando). */
      inicial: string | readonly ImagenInicial[] | null;
      /** Lo mismo, firmado para mostrarlo cuando ya está aceptada. */
      respuesta: QuestionAnswer | null;
    }
  /**
   * La responde otra persona: el nombre corto de quien (otro integrante o el capitán). `aviso`: era
   * suya y el capitán la tomó (D461), en lugar del candado de siempre.
   */
  | { mia: false; bloqueadaPor: string; aviso?: string };

/**
 * Lo que ve el integrante con preguntas asignadas (D422): las suyas respondibles, cada una con su
 * estado (ícono + palabra) y «Entregar al capitán»; las demás bloqueadas como hoy. Cada parte se
 * entrega sola, solo en línea (D424). El texto se guarda en el teléfono mientras escribe (como el
 * borrador de la entrega, D196) y se borra al entregar.
 */
export function PartesIntegrante({
  tareaId,
  preguntas,
  partes,
  capitan,
  autor,
  titular,
  acciones,
}: {
  tareaId: string;
  preguntas: readonly PreguntaEntrega[];
  partes: readonly ParteDeIntegrante[];
  /** Nombre corto del capitán. */
  capitan: string;
  autor: string;
  titular: string;
  acciones?: AccionesParteIntegrante;
}) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <h2 id={titleId} className="text-h2 text-text">
        {PARTES_TITULO}
      </h2>
      <p className="text-callout text-text-2">
        {/* Todas las suyas tomadas (D461): ve la tarea como lector, con el aviso */}
        {partes.some((p) => p.mia)
          ? partesAvisoTexto(capitan)
          : partesTomadasAvisoTexto(capitan)}
      </p>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {preguntas.map((p, i) => {
          const parte = partes[i];
          if (!parte?.mia) {
            // Como hoy (D012): sin campos, con el nombre de quien la responde
            const bloqueada = {
              numero: i + 1,
              enunciado: p.enunciado,
              valor: p.valor,
              bloqueadaPor: parte?.bloqueadaPor ?? capitan,
              bloqueo: parte?.aviso,
              level: 3 as const,
            };
            return p.formato === "texto" || p.formato === "url" ? (
              <QuestionCardAnswer
                key={p.id}
                {...bloqueada}
                formato={p.formato}
                value=""
                onValueChange={() => {}}
              />
            ) : (p.maxImagenes ?? 1) > 1 ? (
              <QuestionCardAnswer
                key={p.id}
                {...bloqueada}
                formato="imagenes"
                limite={p.maxImagenes ?? 1}
                uploads={[]}
                agregar={null}
              />
            ) : (
              <QuestionCardAnswer
                key={p.id}
                {...bloqueada}
                formato="imagen"
                upload={{
                  status: "vacia",
                  onSelect: () => {},
                  onReject: () => {},
                  onRemove: () => {},
                }}
              />
            );
          }
          return (
            <ParteEditable
              key={p.id}
              tareaId={tareaId}
              pregunta={p}
              numero={i + 1}
              parte={parte}
              autor={autor}
              titular={titular}
              acciones={acciones}
            />
          );
        })}
      </ol>
    </section>
  );
}

type Item = ImagenRespuesta & { id: string };

const nuevoId = () => crypto.randomUUID();

const claveParte = (tareaId: string, preguntaId: string, titular: string) =>
  `krea-parte-${tareaId}-${preguntaId}-${titular}`;

function ParteEditable({
  tareaId,
  pregunta: p,
  numero,
  parte,
  autor,
  titular,
  acciones,
}: {
  tareaId: string;
  pregunta: PreguntaEntrega;
  numero: number;
  parte: Extract<ParteDeIntegrante, { mia: true }>;
  autor: string;
  titular: string;
  acciones?: AccionesParteIntegrante;
}) {
  const ayudaId = useId();
  const limite = p.formato === "imagen" ? (p.maxImagenes ?? 1) : 0;
  const clave = claveParte(tareaId, p.id, titular);
  const aceptada = parte.estado === "aceptada";
  // Texto o enlace (D468): los dos se escriben en `texto` y se guardan en el teléfono
  const escrita = p.formato === "texto" || p.formato === "url";
  const [urlTocada, setUrlTocada] = useState(false);
  const [texto, setTexto] = useState(() =>
    typeof parte.inicial === "string" ? parte.inicial : "",
  );
  const [imagenes, setImagenes] = useState<Item[]>(() =>
    Array.isArray(parte.inicial)
      ? parte.inicial.map((x) => ({ ...x, id: nuevoId() }))
      : [],
  );
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editado, setEditado] = useState(false);
  const [enviando, start] = useTransition();

  // El texto a medio escribir vuelve si se recarga (gana sobre lo ya entregado)
  useEffect(() => {
    if (!escrita || aceptada) return;
    try {
      const guardado = window.localStorage.getItem(clave);
      // Un borrador que no es enlace en una pregunta «Enlace» se descarta (D469)
      if (
        guardado !== null &&
        (p.formato !== "url" || normalizarUrl(guardado).ok)
      )
        setTexto(guardado);
    } catch {
      // Sin almacenamiento: se trabaja sin borrador
    }
  }, [clave, escrita, p.formato, aceptada]);

  useEffect(() => {
    if (!editado || !escrita) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(clave, texto);
      } catch {
        // Sin almacenamiento: no se guarda
      }
    }, BORRADOR_MS);
    return () => clearTimeout(t);
  }, [editado, texto, clave, escrita]);

  const subiendo = imagenes.some((i) => i.status === "subiendo");
  const completa =
    p.formato === "texto"
      ? texto.trim() !== ""
      : p.formato === "url"
        ? normalizarUrl(texto).ok
        : imagenes.length > 0 &&
          imagenes.every((i) => i.status === "lista" && Boolean(i.path));
  const listo = completa && !subiendo && !enviando && !aceptada;

  const setItem = (id: string, v: ImagenRespuesta | null) =>
    setImagenes((prev) =>
      v === null
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...v, id } : i)),
    );

  async function agregar(blob: Blob, meta: { name: string }) {
    setErrorImagen(null);
    if (!acciones) return;
    if (blob.size > IMAGEN_SUBIDA_MAX_BYTES) {
      setErrorImagen(mensajeErrorEntrega("imagen-peso"));
      return;
    }
    if (!navigator.onLine) {
      setErrorImagen(mensajeErrorParte("red"));
      return;
    }
    const file = { name: meta.name, size: blob.size, src: blob };
    const id = nuevoId();
    // Una sola imagen: la nueva reemplaza a la anterior
    setImagenes((prev) =>
      [
        ...(limite === 1 ? [] : prev),
        { id, status: "subiendo" as const, file },
      ].slice(0, limite),
    );
    const form = new FormData();
    form.set("tareaId", tareaId);
    form.set("preguntaId", p.id);
    form.set("imagen", blob, "respuesta.jpg");
    let r: ResultadoSubida;
    try {
      r = await acciones.subir(form);
    } catch (fallo) {
      relanzarSiEsDeploy(fallo);
      r = { ok: false, error: "red" };
    }
    if (r.ok) setItem(id, { status: "lista", file, path: r.imagenPath });
    else {
      setItem(id, null);
      setErrorImagen(
        r.error === "red"
          ? mensajeErrorParte("red")
          : mensajeErrorEntrega(r.error),
      );
    }
  }

  function entregar() {
    if (!acciones || !listo) return;
    if (!navigator.onLine) {
      setError(mensajeErrorParte("red"));
      return;
    }
    const rutas = imagenes.flatMap((i) => (i.path ? [i.path] : []));
    const [primera] = rutas;
    const enlace = normalizarUrl(texto);
    const respuesta: Respuesta =
      p.formato === "texto"
        ? { texto }
        : p.formato === "url"
          ? // Normalizado como lo guarda el servidor (D469)
            { url: enlace.ok ? enlace.url : texto }
          : limite === 1 && primera !== undefined
            ? { imagenPath: primera }
            : { imagenPaths: rutas };
    setError(null);
    start(async () => {
      let r: ResultadoParte;
      try {
        r = await acciones.entregar({ tareaId, preguntaId: p.id, respuesta });
      } catch (fallo) {
        relanzarSiEsDeploy(fallo);
        r = { ok: false, error: "red" };
      }
      if (!r.ok) {
        setError(mensajeErrorParte(r.error));
        return;
      }
      try {
        window.localStorage.removeItem(clave);
      } catch {
        // Nada que limpiar
      }
      setEditado(false);
      toast.success(PARTE_ENTREGADA_TOAST);
    });
  }

  const ayuda =
    parte.estado === "aceptada"
      ? PARTE_ACEPTADA_AYUDA
      : parte.estado === "devuelta"
        ? PARTE_DEVUELTA_AYUDA
        : parte.estado === "entregada"
          ? PARTE_ENTREGADA_AYUDA
          : null;

  // «No se entregó tu parte», «Se activa…»: PROVISIONAL (CONTENT_CHECKLIST fila 230)
  const pie = (
    <div className="flex flex-col gap-2">
      <EstadoParte estado={parte.estado} />
      {ayuda ? <p className="text-small text-text-2">{ayuda}</p> : null}
      {aceptada && parte.respuesta ? (
        <RespuestaParteVista respuesta={parte.respuesta} />
      ) : null}
      {error ? (
        <ErrorEnPantalla titulo="No se entregó tu parte">
          {error}
        </ErrorEnPantalla>
      ) : null}
      {aceptada ? null : (
        <div className="flex flex-col items-start gap-1">
          <BotonEnLinea
            onClick={entregar}
            disabled={!listo}
            loading={enviando}
            loadingLabel="Entregando…"
            aria-describedby={listo ? undefined : ayudaId}
          >
            <Send aria-hidden="true" />
            {parte.estado === "asignada" ? ENTREGAR_PARTE : REENTREGAR_PARTE}
            {/* Con varias partes, cada botón se distingue con lector de pantalla */}
            <span className="sr-only">{` (pregunta ${numero})`}</span>
          </BotonEnLinea>
          {listo || enviando ? null : (
            <p id={ayudaId} className="text-small text-text-2">
              Se activa cuando respondas la pregunta.
            </p>
          )}
        </div>
      )}
    </div>
  );

  const comun = {
    numero,
    enunciado: p.enunciado,
    valor: p.valor,
    level: 3 as const,
    bloqueo: aceptada ? PARTE_ACEPTADA_AYUDA : undefined,
  };

  if (p.formato === "texto") {
    return (
      <QuestionCardAnswer
        {...comun}
        formato="texto"
        value={texto}
        onValueChange={(v) => {
          setTexto(v);
          setEditado(true);
        }}
      >
        {pie}
      </QuestionCardAnswer>
    );
  }

  if (p.formato === "url") {
    return (
      <QuestionCardAnswer
        {...comun}
        formato="url"
        value={texto}
        onValueChange={(v) => {
          setTexto(v);
          setEditado(true);
        }}
        mostrarError={urlTocada}
        onBlur={() => setUrlTocada(true)}
      >
        {pie}
      </QuestionCardAnswer>
    );
  }

  const zona = (img: Item, j: number) => ({
    status: img.status,
    file: img.file,
    progress: img.progress,
    alt:
      limite > 1
        ? `Vista previa de la imagen ${j + 1} de la respuesta de ${autor} a la pregunta ${numero}`
        : `Vista previa de la respuesta de ${autor} a la pregunta ${numero}`,
    onSelect: (blob: Blob, meta: { name: string }) => {
      void agregar(blob, meta);
    },
    onReject: (m: string) => setErrorImagen(m),
    onRemove: () => setItem(img.id, null),
  });

  if (limite === 1) {
    const [img] = imagenes;
    return (
      <QuestionCardAnswer
        {...comun}
        formato="imagen"
        upload={
          img
            ? zona(img, 0)
            : {
                status: errorImagen ? "error" : "vacia",
                error: errorImagen ?? undefined,
                onSelect: (blob, meta) => {
                  void agregar(blob, meta);
                },
                onReject: (m) => setErrorImagen(m),
                onRemove: () => setErrorImagen(null),
              }
        }
      >
        {pie}
      </QuestionCardAnswer>
    );
  }

  return (
    <QuestionCardAnswer
      {...comun}
      formato="imagenes"
      limite={limite}
      uploads={imagenes.map((img, j) => ({ key: img.id, ...zona(img, j) }))}
      agregar={
        imagenes.length < limite
          ? {
              status: errorImagen ? "error" : "vacia",
              error: errorImagen ?? undefined,
              onSelect: (blob, meta) => {
                void agregar(blob, meta);
              },
              onReject: (m) => setErrorImagen(m),
              onRemove: () => setErrorImagen(null),
            }
          : null
      }
    >
      {pie}
    </QuestionCardAnswer>
  );
}
