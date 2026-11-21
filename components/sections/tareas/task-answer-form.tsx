"use client";

import { Clock, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { ErrorEnPantalla } from "@/components/estados/errores";
import type {
  ImageUploadFile,
  ImageUploadStatus,
} from "@/components/krea/image-upload";
import { QuestionCardAnswer } from "@/components/krea/question-card-answer";
import type { QuestionAnswer } from "@/components/krea/question-card-detail";
import { ActionBar } from "@/components/sections/shared/action-bar";
import { RespuestaParteVista } from "@/components/sections/tareas/estado-parte";
import {
  type AccionTomar,
  TomarParte,
  tomarFocoPendiente,
} from "@/components/sections/tareas/tomar-parte";
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
import type { FormatoPreguntaId } from "@/lib/modelo";
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
import { FALTA_ACEPTAR_AYUDA, faltaAceptarTexto } from "@/lib/partes";
import {
  avanceEntrega,
  BORRADOR_MS,
  type Borrador,
  borradorTexto,
  claveBorrador,
  type EstadoRespuesta,
  faltaTexto,
  type ImagenBorrador,
  leerBorrador,
  puedeEntregar,
} from "@/lib/tareas";
import { normalizarUrl } from "@/lib/url-respuesta";

export type PreguntaEntrega = {
  id: string;
  enunciado: string;
  /** `url` = «Enlace» (D468): su valor vive con los textos (estado y borrador). */
  formato: FormatoPreguntaId;
  /** «Varias imágenes» (D373): de 2 a 10. Ausente = una sola. */
  maxImagenes?: number;
  valor: number;
};

/** ¿La pregunta admite varias imágenes? (D373) */
const esVarias = (p: PreguntaEntrega) =>
  p.formato === "imagen" && (p.maxImagenes ?? 1) > 1;

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
  Record<string, string | ImagenRespuesta | readonly ImagenRespuesta[]>
>;

/** Una de las imágenes de una pregunta «Varias» (D373), con su id para la `key` de React. */
export type ImagenItem = ImagenRespuesta & { id: string };

const IMAGEN_VACIA: ImagenRespuesta = { status: "vacia" };

/**
 * PROVISIONAL (CONTENT_CHECKLIST fila 205): la confirmación ya no dice «Después no se puede
 * cambiar» (D395): se edita mientras no esté evaluada y la tarea siga abierta.
 */
const AVISO_EDITAR =
  "Podrás editarla mientras tu profe no la evalúe y la tarea siga abierta.";
const CAMBIOS_GUARDADOS = "Cambios guardados";

const nuevoId = () => crypto.randomUUID();

const imagenDeBorrador = (v: ImagenBorrador): ImagenRespuesta => ({
  status: "lista",
  file: { name: v.nombre, size: v.peso, src: "" },
  path: v.imagenPath,
});

/**
 * Borrador del dispositivo → textos (y enlaces, D468) e imágenes ya subidas (sin vista previa: no
 * se descargan).
 */
function desdeBorrador(
  b: Borrador,
): [
  Record<string, string>,
  Record<string, ImagenRespuesta>,
  Record<string, ImagenItem[]>,
] {
  const textos: Record<string, string> = {};
  const imagenes: Record<string, ImagenRespuesta> = {};
  const varias: Record<string, ImagenItem[]> = {};
  for (const [id, v] of Object.entries(b)) {
    if (typeof v === "string") textos[id] = v;
    else if (Array.isArray(v))
      varias[id] = v.map((i) => ({ ...imagenDeBorrador(i), id: nuevoId() }));
    else imagenes[id] = imagenDeBorrador(v);
  }
  return [textos, imagenes, varias];
}

/** Lo que guarda el borrador de una imagen ya subida; `null` si todavía no tiene ruta. */
function aBorrador(img: ImagenRespuesta): ImagenBorrador | null {
  return img.status === "lista" && img.path && img.file
    ? { imagenPath: img.path, nombre: img.file.name, peso: img.file.size }
    : null;
}

/** Imágenes iniciales de una pregunta de varias: solo las elegidas (subiendo o listas). */
function variasIniciales(
  v: RespuestasIniciales[string] | undefined,
): ImagenItem[] {
  const lista: readonly ImagenRespuesta[] = Array.isArray(v)
    ? v
    : v && typeof v !== "string"
      ? [v as ImagenRespuesta]
      : [];
  return lista
    .filter((x) => x.status === "lista" || x.status === "subiendo")
    .map((x) => ({ ...x, id: nuevoId() }));
}

export type TaskAnswerFormProps = {
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
  /**
   * Editar la entrega enviada (D395): `alSalir` al guardar o cancelar; `enfocar` si se abrió con
   * «Editar entrega» (no si se muestra sola porque hay una edición en la cola).
   */
  edicion?: { alSalir: (enfocar?: boolean) => void; enfocar?: boolean };
  /**
   * Grupal por partes (D462): preguntas asignadas a otro integrante, en solo lectura para el
   * capitán (candado con su texto y lo que entregó). No van en el envío: lo aceptado lo pone el
   * servidor (D463). «Entregar» espera a que todas estén aceptadas.
   */
  bloqueos?: Readonly<Record<string, BloqueoPregunta>>;
  /** «La respondo yo» en la tarjeta bloqueada (D461); sin ella (galerías), no se ofrece. */
  tomar?: AccionTomar;
  /** Línea extra de la confirmación: a quién se premarcará «No participó» (D420). */
  avisoEnvio?: string | null;
};

/** Una pregunta del capitán asignada a otro (D462). */
export type BloqueoPregunta = {
  /** Texto del candado según el estado de la parte. */
  texto: string;
  /** Lo que entregó, ya firmado (`null` si aún nada). */
  respuesta: QuestionAnswer | null;
  /** Aceptada: lista para el envío. */
  aceptada: boolean;
  /** Nombre corto de quien la tiene. */
  nombre: string;
  /** Asignada o devuelta: el capitán puede tomarla (D461). */
  tomable: boolean;
};

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
 * y las respuestas siguen aquí. «Varias imágenes» (D373): cada imagen se sube sola al elegirla,
 * hasta el límite; la pregunta cuenta como respondida con al menos una y ninguna subiendo.
 * Con `edicion` (D395) edita una entrega ya enviada: `inicial` trae lo enviado, el botón es
 * «Guardar cambios» (misma confirmación) y «Cancelar» vuelve sin cambios (y sin borrador).
 * Grupal por partes (D462): con `bloqueos`, esas preguntas van sin campo y fuera del envío. Un
 * refresco del servidor no remonta el formulario: si una deja de estar bloqueada (el capitán la
 * tomó, D461), su campo arranca con lo de `inicial` salvo que ya tuviera algo, y recibe el foco.
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
  edicion,
  bloqueos,
  tomar,
  avisoEnvio,
}: TaskAnswerFormProps) {
  const router = useRouter();
  const helpId = useId();
  const faltaId = useId();
  const titleId = useId();
  const listaRef = useRef<HTMLOListElement>(null);
  const clave = claveBorrador(tareaId, titular);
  const [textos, setTextos] = useState<Record<string, string>>(() => {
    const t: Record<string, string> = {};
    for (const p of preguntas) {
      const v = inicial[p.id];
      if (p.formato === "texto" || p.formato === "url")
        t[p.id] = typeof v === "string" ? v : "";
    }
    return t;
  });
  const [imagenes, setImagenes] = useState<Record<string, ImagenRespuesta>>(
    () => {
      const i: Record<string, ImagenRespuesta> = {};
      for (const p of preguntas) {
        const v = inicial[p.id];
        if (p.formato === "imagen" && !esVarias(p))
          i[p.id] =
            v && typeof v !== "string" && !Array.isArray(v)
              ? (v as ImagenRespuesta)
              : IMAGEN_VACIA;
      }
      return i;
    },
  );
  // Preguntas de varias imágenes (D373): solo las elegidas; la zona para añadir va aparte
  const [varias, setVarias] = useState<Record<string, ImagenItem[]>>(() =>
    Object.fromEntries(
      preguntas
        .filter(esVarias)
        .map((p) => [p.id, variasIniciales(inicial[p.id])]),
    ),
  );
  // Preguntas «Enlace» que el alumno ya dejó: su aviso en línea se muestra desde entonces (D469)
  const [urlsTocadas, setUrlsTocadas] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // Error de la zona «añadir» de cada pregunta de varias (tipo, peso o la subida falló)
  const [errorAgregar, setErrorAgregar] = useState<Record<string, string>>({});
  const quitarError = (id: string) =>
    setErrorAgregar(({ [id]: _quitado, ...resto }) => resto);
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

  // Edición recién abierta: el foco al título del formulario (el botón que la abrió ya no está)
  const enfocar = Boolean(edicion?.enfocar);
  useEffect(() => {
    if (enfocar) document.getElementById(titleId)?.focus();
  }, [enfocar, titleId]);

  // Recupera el borrador del dispositivo una vez (gana sobre lo inicial). Un refresco del servidor
  // trae props nuevas: el ref evita pisar lo que el alumno ya escribió.
  const restaurado = useRef(false);
  useEffect(() => {
    if (bloqueadaPor || restaurado.current) return;
    restaurado.current = true;
    try {
      const [t, i, v] = desdeBorrador(
        leerBorrador(window.localStorage.getItem(clave)),
      );
      const formato = new Map(
        preguntas.map((p) => [
          p.id,
          esVarias(p) ? ("varias" as const) : p.formato,
        ]),
      );
      const soloDe = <T,>(
        m: Record<string, T>,
        f: FormatoPreguntaId | "varias",
      ) =>
        Object.fromEntries(
          Object.entries(m).filter(([id]) => formato.get(id) === f),
        );
      // Un enlace se guarda como un texto: solo vuelve si es un enlace válido (un texto viejo de
      // cuando la pregunta era de texto se descarta, D469)
      const enlaces = Object.fromEntries(
        Object.entries(soloDe(t, "url")).filter(([, v]) => normalizarUrl(v).ok),
      );
      setTextos((prev) => ({ ...prev, ...soloDe(t, "texto"), ...enlaces }));
      // Una imagen sin ruta no se subió: el borrador de las galerías no la restaura
      if (acciones) {
        setImagenes((prev) => ({ ...prev, ...soloDe(i, "imagen") }));
        const limite = new Map(preguntas.map((p) => [p.id, p.maxImagenes]));
        const restauradas = Object.entries(soloDe(v, "varias")).map(
          ([id, lista]) => [id, lista.slice(0, limite.get(id) ?? 1)] as const,
        );
        setVarias((prev) => ({ ...prev, ...Object.fromEntries(restauradas) }));
      }
    } catch {
      // Sin almacenamiento (modo privado): se trabaja sin borrador
    }
  }, [clave, bloqueadaPor, preguntas, acciones]);

  // Una pregunta que deja de estar bloqueada (D461: el capitán la tomó): arranca con lo de
  // `inicial` (lo último que entregó el integrante) si su campo sigue vacío, y la tarjeta que se
  // abre recibe el foco si la tomó desde aquí o desde el Reparto
  const bloqueadas = preguntas
    .filter((p) => bloqueos?.[p.id])
    .map((p) => p.id)
    .join("\u0000");
  const bloqueadasAntes = useRef(bloqueadas);
  useEffect(() => {
    if (bloqueadasAntes.current === bloqueadas) return;
    const antes = new Set(bloqueadasAntes.current.split("\u0000"));
    const siguen = new Set(bloqueadas.split("\u0000"));
    bloqueadasAntes.current = bloqueadas;
    const abiertas = preguntas.filter(
      (p) => antes.has(p.id) && !siguen.has(p.id),
    );
    for (const p of abiertas) {
      const v = inicial[p.id];
      if (v === undefined) continue;
      if (p.formato === "texto") {
        if (typeof v === "string")
          setTextos((prev) =>
            (prev[p.id] ?? "").trim() ? prev : { ...prev, [p.id]: v },
          );
      } else if (esVarias(p)) {
        setVarias((prev) =>
          (prev[p.id]?.length ?? 0) > 0
            ? prev
            : { ...prev, [p.id]: variasIniciales(v) },
        );
      } else if (typeof v !== "string" && !Array.isArray(v)) {
        const img = v as ImagenRespuesta;
        setImagenes((prev) =>
          prev[p.id] && prev[p.id]?.status !== "vacia"
            ? prev
            : { ...prev, [p.id]: img },
        );
      }
    }
    const i = preguntas.findIndex(
      (p) => abiertas.includes(p) && tomarFocoPendiente(p.id),
    );
    if (i >= 0)
      listaRef.current?.children[i]
        ?.querySelector<HTMLElement>("textarea, button:not([disabled])")
        ?.focus();
  }, [bloqueadas, preguntas, inicial]);

  // Borrador automático: 2 s después del último cambio
  useEffect(() => {
    if (bloqueadaPor || ediciones === 0) return;
    const t = setTimeout(() => {
      const borrador: Borrador = { ...textos };
      for (const [id, img] of Object.entries(imagenes)) {
        const b = aBorrador(img);
        if (b) borrador[id] = b;
      }
      for (const [id, lista] of Object.entries(varias)) {
        const bs = lista.flatMap((img) => aBorrador(img) ?? []);
        if (bs.length > 0) borrador[id] = bs;
      }
      try {
        window.localStorage.setItem(clave, JSON.stringify(borrador));
        setGuardado(new Date());
      } catch {
        // Sin almacenamiento: no se muestra "Borrador guardado"
      }
    }, BORRADOR_MS);
    return () => clearTimeout(t);
  }, [ediciones, textos, imagenes, varias, clave, bloqueadaPor]);

  const imagenLista = (img: ImagenRespuesta | undefined) =>
    img?.status === "lista" &&
    (!acciones || Boolean(img.path) || Boolean(img.pendiente));
  const imagenesSinSubir = [
    ...Object.values(imagenes),
    ...Object.values(varias).flat(),
  ].some((i) => i.status === "lista" && i.pendiente);
  // Las bloqueadas (D462) no se responden aquí: cuentan como listas solo si están aceptadas
  const pendientes = preguntas.flatMap((p, i) => {
    const b = bloqueos?.[p.id];
    return b && !b.aceptada ? [{ numero: i + 1, nombre: b.nombre }] : [];
  });
  const faltaAceptar = faltaAceptarTexto(pendientes);
  const propias = preguntas.filter((p) => !bloqueos?.[p.id]);
  const estados: EstadoRespuesta[] = propias.map((p) => {
    if (p.formato === "texto")
      return { formato: "texto", completa: (textos[p.id] ?? "").trim() !== "" };
    if (p.formato === "url")
      return { formato: "url", completa: normalizarUrl(textos[p.id] ?? "").ok };
    if (esVarias(p)) {
      const lista = varias[p.id] ?? [];
      return {
        formato: "imagen",
        completa: lista.length > 0 && lista.every((i) => imagenLista(i)),
        subiendo: lista.some((i) => i.status === "subiendo"),
      };
    }
    return {
      formato: "imagen",
      completa: imagenLista(imagenes[p.id]),
      subiendo: imagenes[p.id]?.status === "subiendo",
    };
  });
  const { faltan, subiendo } = avanceEntrega(estados);
  // Ya en la cola: no se entrega otra vez (la primera puede estar entrando ahora mismo)
  const listo =
    puedeEntregar(estados) && pendientes.length === 0 && !enviando && !enEspera;

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

  /** Cambia (o quita, con `null`) una imagen de una pregunta de varias, si sigue ahí. */
  const setItem = (
    preguntaId: string,
    itemId: string,
    v: ImagenRespuesta | null,
  ) =>
    setVarias((prev) => {
      const lista = prev[preguntaId] ?? [];
      if (!lista.some((i) => i.id === itemId)) return prev;
      return {
        ...prev,
        [preguntaId]:
          v === null
            ? lista.filter((i) => i.id !== itemId)
            : lista.map((i) => (i.id === itemId ? { ...v, id: itemId } : i)),
      };
    });

  /** Añade una imagen a una pregunta de varias (D373) y la sube como las de una sola. */
  async function agregarImagen(
    p: PreguntaEntrega,
    blob: Blob,
    meta: { name: string },
  ) {
    const file = { name: meta.name, size: blob.size, src: blob };
    const limite = p.maxImagenes ?? 1;
    if ((varias[p.id]?.length ?? 0) >= limite) return;
    quitarError(p.id);
    if (acciones && blob.size > IMAGEN_SUBIDA_MAX_BYTES) {
      setErrorAgregar((prev) => ({
        ...prev,
        [p.id]: mensajeErrorEntrega("imagen-peso"),
      }));
      return;
    }
    const itemId = nuevoId();
    // Galerías: lista sin subir. Sin red: lista en el teléfono, se sube al entregar (D295)
    const sinSubir = !acciones || !navigator.onLine;
    const item: ImagenItem = sinSubir
      ? { id: itemId, status: "lista", file, pendiente: Boolean(acciones) }
      : { id: itemId, status: "subiendo", file };
    setVarias((prev) => ({
      ...prev,
      [p.id]: [...(prev[p.id] ?? []), item].slice(0, limite),
    }));
    if (!acciones) return;
    if (sinSubir) {
      setEdiciones((n) => n + 1);
      return;
    }
    const form = new FormData();
    form.set("tareaId", tareaId);
    form.set("preguntaId", p.id);
    form.set("imagen", blob, "respuesta.jpg");
    let r: ResultadoSubida;
    try {
      r = await acciones.subir(form);
    } catch {
      r = { ok: false, error: "red" };
    }
    if (r.ok)
      setItem(p.id, itemId, { status: "lista", file, path: r.imagenPath });
    else if (r.error === "red")
      // Se cayó la red al subir: igual que sin conexión
      setItem(p.id, itemId, { status: "lista", file, pendiente: true });
    else {
      const error = r.error;
      setItem(p.id, itemId, null);
      setErrorAgregar((prev) => ({
        ...prev,
        [p.id]: mensajeErrorEntrega(error),
      }));
    }
    if (r.ok || r.error === "red") setEdiciones((n) => n + 1);
  }

  function limpiarBorrador() {
    try {
      window.localStorage.removeItem(clave);
    } catch {
      // Nada que limpiar
    }
  }

  /** «Cancelar» la edición: lo enviado queda como estaba y el borrador de la edición se descarta. */
  function cancelarEdicion() {
    limpiarBorrador();
    edicion?.alSalir();
  }

  function entregar() {
    if (!acciones) {
      limpiarBorrador();
      router.push(entregadaHref);
      return;
    }
    const respuestas: EnvioEntrega["respuestas"] = {};
    const locales: ImagenCola[] = [];
    // Las asignadas a otro no van: el servidor pone lo aceptado (D463)
    for (const p of propias) {
      if (p.formato === "texto")
        respuestas[p.id] = { texto: textos[p.id] ?? "" };
      else if (p.formato === "url") {
        // Normalizado como lo guarda el servidor (le pone `https://` si faltaba)
        const u = normalizarUrl(textos[p.id] ?? "");
        respuestas[p.id] = { url: u.ok ? u.url : (textos[p.id] ?? "") };
      } else if (esVarias(p)) {
        // Las ya subidas van en la respuesta; las del teléfono, a la cola (se suman al subir)
        const lista = varias[p.id] ?? [];
        const rutas = lista.flatMap((i) => (i.path ? [i.path] : []));
        if (rutas.length > 0) respuestas[p.id] = { imagenPaths: rutas };
        for (const img of lista)
          if (!img.path && img.pendiente && img.file?.src instanceof Blob)
            locales.push({
              preguntaId: p.id,
              imagenId: crypto.randomUUID(),
              blob: img.file.src,
            });
      } else {
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
          if (edicion) {
            toast.success(CAMBIOS_GUARDADOS);
            edicion.alSalir();
          }
          return;
        }
        if (r.error !== "red" || !titular) {
          setConfirmar(false);
          setError(mensajeErrorEntrega(r.error));
          if (
            r.error === "ya-entregada" ||
            r.error === "ya-evaluada" ||
            r.error === "cerrada" ||
            // El reparto cambió (D463): trae los bloqueos de ahora
            r.error === "partes-pendientes"
          ) {
            // Al editar, la página deja de ofrecer el formulario: el aviso queda en un toast
            if (edicion) toast.error(mensajeErrorEntrega(r.error));
            router.refresh();
          }
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
        // Edición: el formulario sigue a la vista mientras esté en la cola (`EntregaEditable`)
        edicion?.alSalir(false);
        void drenarCola();
        return;
      }
      setError(e === "sin-espacio" ? SIN_ESPACIO : mensajeErrorEntrega("red"));
    });
  }

  /**
   * Asignada a otro (D462): candado con su texto y, en el pie, lo que entregó y «La respondo yo».
   * Se esparce en cada `QuestionCardAnswer`, sea cual sea su formato.
   */
  function bloqueoDe(
    p: PreguntaEntrega,
    numero: number,
  ): { bloqueo?: string; children?: ReactNode } {
    const b = bloqueos?.[p.id];
    if (!b) return {};
    const conTomar = b.tomable && tomar;
    return {
      bloqueo: b.texto,
      children:
        b.respuesta || conTomar ? (
          <div className="flex flex-col gap-2">
            {b.respuesta ? (
              <>
                {/* PROVISIONAL (CONTENT_CHECKLIST fila 230) */}
                <p className="text-eyebrow text-text-2">Lo que entregó</p>
                <RespuestaParteVista respuesta={b.respuesta} />
              </>
            ) : null}
            {conTomar ? (
              <div className="flex flex-wrap gap-2">
                <TomarParte
                  tareaId={tareaId}
                  preguntaId={p.id}
                  numero={numero}
                  nombre={b.nombre}
                  accion={tomar}
                />
              </div>
            ) : null}
          </div>
        ) : undefined,
    };
  }

  return (
    <>
      <section aria-labelledby={titleId} className="flex flex-col gap-3">
        {/* Al abrir la edición el foco llega aquí (D395). PROVISIONAL (fila 205) */}
        <h2
          id={titleId}
          tabIndex={edicion ? -1 : undefined}
          className="text-h2 text-text"
        >
          {edicion ? "Edita tus respuestas" : "Preguntas"}
        </h2>
        <ol ref={listaRef} className="m-0 flex list-none flex-col gap-4 p-0">
          {preguntas.map((p, i) =>
            esVarias(p) ? (
              <QuestionCardAnswer
                key={p.id}
                numero={i + 1}
                enunciado={p.enunciado}
                valor={p.valor}
                bloqueadaPor={bloqueadaPor}
                {...bloqueoDe(p, i + 1)}
                level={3}
                formato="imagenes"
                limite={p.maxImagenes ?? 1}
                uploads={(varias[p.id] ?? []).map((img, j) => ({
                  key: img.id,
                  status: img.status,
                  file: img.file,
                  progress: img.progress,
                  alt: `Vista previa de la imagen ${j + 1} de la respuesta de ${autor} a la pregunta ${i + 1}`,
                  // Una zona llena no ofrece elegir otra: solo quitarla
                  onSelect: () => {},
                  onReject: () => {},
                  onRemove: () => {
                    setItem(p.id, img.id, null);
                    setEdiciones((n) => n + 1);
                  },
                }))}
                agregar={
                  (varias[p.id]?.length ?? 0) < (p.maxImagenes ?? 1)
                    ? {
                        status: errorAgregar[p.id] ? "error" : "vacia",
                        error: errorAgregar[p.id],
                        onSelect: (blob, meta) => {
                          void agregarImagen(p, blob, meta);
                        },
                        onReject: (message) =>
                          setErrorAgregar((prev) => ({
                            ...prev,
                            [p.id]: message,
                          })),
                        onRemove: () => quitarError(p.id),
                      }
                    : null
                }
              />
            ) : p.formato === "url" ? (
              <QuestionCardAnswer
                key={p.id}
                numero={i + 1}
                enunciado={p.enunciado}
                valor={p.valor}
                bloqueadaPor={bloqueadaPor}
                level={3}
                formato="url"
                value={textos[p.id] ?? ""}
                onValueChange={(v) => {
                  setTextos((prev) => ({ ...prev, [p.id]: v }));
                  setEdiciones((n) => n + 1);
                }}
                mostrarError={urlsTocadas.has(p.id)}
                onBlur={() =>
                  setUrlsTocadas((prev) =>
                    prev.has(p.id) ? prev : new Set(prev).add(p.id),
                  )
                }
              />
            ) : p.formato === "texto" ? (
              <QuestionCardAnswer
                key={p.id}
                numero={i + 1}
                enunciado={p.enunciado}
                valor={p.valor}
                bloqueadaPor={bloqueadaPor}
                {...bloqueoDe(p, i + 1)}
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
                {...bloqueoDe(p, i + 1)}
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
                  <>
                    {/* Con todo lo suyo listo y partes por aceptar, solo lo que falta (D462) */}
                    {faltaAceptar && faltan === 0 && subiendo === 0 ? null : (
                      <span className="text-small-b text-text">
                        {faltaTexto(faltan, subiendo)}
                      </span>
                    )}
                    {faltaAceptar ? (
                      <span id={faltaId} className="text-small-b text-text">
                        {faltaAceptar}
                      </span>
                    ) : null}
                  </>
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
                <div className="flex flex-wrap justify-end gap-2">
                  {edicion && !enEspera ? (
                    <Button
                      variant="secondary"
                      onClick={cancelarEdicion}
                      disabled={enviando}
                    >
                      Cancelar
                    </Button>
                  ) : null}
                  <DialogTrigger asChild>
                    <Button
                      disabled={!listo}
                      aria-describedby={
                        listo
                          ? undefined
                          : faltaAceptar && !enEspera
                            ? `${faltaId} ${helpId}`
                            : helpId
                      }
                    >
                      {edicion ? (
                        <Save aria-hidden="true" />
                      ) : (
                        <Send aria-hidden="true" />
                      )}
                      {edicion ? "Guardar cambios" : "Entregar tarea"}
                    </Button>
                  </DialogTrigger>
                </div>
                <DialogContent>
                  <DialogHeader>
                    {/* PROVISIONAL (CONTENT_CHECKLIST fila 205) */}
                    <DialogTitle>
                      {edicion ? "¿Guardar los cambios?" : "¿Entregar ahora?"}
                    </DialogTitle>
                    {/* El aviso del reparto va en la descripción: el lector lo anuncia al abrir */}
                    <DialogDescription>
                      {AVISO_EDITAR}
                      {avisoEnvio && !edicion ? (
                        <span className="mt-2 block text-text">
                          {avisoEnvio}
                        </span>
                      ) : null}
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
                      loadingLabel={edicion ? "Guardando…" : "Entregando…"}
                    >
                      {edicion ? (
                        <Save aria-hidden="true" />
                      ) : (
                        <Send aria-hidden="true" />
                      )}
                      {edicion ? "Guardar" : "Entregar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {listo || enviando || enEspera ? null : (
                <p id={helpId} className="text-small text-text-2">
                  {pendientes.length > 0
                    ? FALTA_ACEPTAR_AYUDA
                    : "Se activa cuando respondas todas las preguntas."}
                </p>
              )}
            </div>
          </ActionBar>
        </>
      )}
    </>
  );
}
