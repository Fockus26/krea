// Entregas del estudiante (fase 07 W5, D195–D197): quién puede responder, claves de las
// imágenes en el almacén y la entrega que se escribe al «Enviar». Puro (sin Firebase ni reloj):
// lo usan las Server Actions (`lib/acciones/entregas.ts`) y las pruebas.
import { z } from "zod";
import type { ResultadoExiste } from "@/lib/almacen/s3";
import {
  type Entrega,
  type Equipo,
  idEntrega,
  type Tarea,
  type Usuario,
  zRespuesta,
} from "@/lib/modelo";
import { ANSWER_MAX_LENGTH } from "@/lib/question";

type ConId<T> = { id: string } & T;

/** Ids de Firestore que pueden ir en una clave de objeto (tarea, pregunta). */
const zIdSeguro = z.string().regex(/^[A-Za-z0-9_-]{1,120}$/, "Id inválido");

export const zIdTarea = zIdSeguro;
export const zIdPregunta = zIdSeguro.max(40);

/** Lo que manda el teléfono al tocar «Entregar»: la tarea y una respuesta por pregunta. */
export const zEnvioEntrega = z.object({
  tareaId: zIdTarea,
  respuestas: z.record(zIdPregunta, zRespuesta),
});
export type EnvioEntrega = z.infer<typeof zEnvioEntrega>;

/* ---------- Permiso ---------- */

export type ErrorEntrega =
  /** No es una tarea visible para él (otra sección o borrador). */
  | "no-existe"
  /** La tarea ya no está abierta. */
  | "cerrada"
  /** Grupal sin equipo (o el equipo es de otra sección). */
  | "sin-equipo"
  /** Grupal y no es el capitán (D012). */
  | "no-capitan"
  /** Ya hay una entrega enviada para este titular. */
  | "ya-entregada"
  /** Falta una respuesta, sobra una o no es del formato de la pregunta. */
  | "incompleta";

export type PermisoEntrega = {
  tipo: Tarea["tipo"];
  /** Cédula (individual) o id del equipo (grupal). */
  titularId: string;
  entregaId: string;
};

/**
 * ¿Puede este alumno responder y enviar esta tarea? Individual: cualquiera de la sección.
 * Grupal: solo el capitán de su equipo actual (D012). Solo mientras la tarea esté abierta (D196).
 */
export function permisoEntrega(
  usuario: Pick<Usuario, "cedula" | "rol" | "seccion" | "equipoId">,
  tarea: Pick<Tarea, "tipo" | "estado" | "secciones"> | null,
  tareaId: string,
  equipo: ConId<Pick<Equipo, "seccion" | "capitanId">> | null,
): { ok: true; permiso: PermisoEntrega } | { ok: false; error: ErrorEntrega } {
  if (
    !tarea ||
    usuario.rol !== "estudiante" ||
    usuario.seccion === null ||
    tarea.estado === "borrador" ||
    !tarea.secciones.includes(usuario.seccion)
  ) {
    return { ok: false, error: "no-existe" };
  }
  if (tarea.estado !== "abierta") return { ok: false, error: "cerrada" };
  if (tarea.tipo === "individual") {
    return {
      ok: true,
      permiso: {
        tipo: "individual",
        titularId: usuario.cedula,
        entregaId: idEntrega(tareaId, usuario.cedula),
      },
    };
  }
  if (
    !equipo ||
    usuario.equipoId !== equipo.id ||
    equipo.seccion !== usuario.seccion
  ) {
    return { ok: false, error: "sin-equipo" };
  }
  if (equipo.capitanId !== usuario.cedula) {
    return { ok: false, error: "no-capitan" };
  }
  return {
    ok: true,
    permiso: {
      tipo: "grupal",
      titularId: equipo.id,
      entregaId: idEntrega(tareaId, equipo.id),
    },
  };
}

/** Una entrega existente cierra el paso salvo que sea un borrador (estado del modelo). */
export function yaEnviada(existente: Pick<Entrega, "estado"> | null): boolean {
  return existente !== null && existente.estado !== "borrador";
}

/* ---------- Claves de imagen (D195) ---------- */

/**
 * Carpeta de una entrega en el almacén: SHA-256 del id de la entrega (que lleva la cédula del
 * titular en las individuales), 32 hex. Así la clave no muestra datos personales.
 */
export async function carpetaEntrega(entregaId: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(entregaId),
  );
  return Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0"),
  )
    .join("")
    .slice(0, 32);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** `entregas/{tareaId}/{carpeta}/{uuid}.jpg`. */
export function claveImagen(
  tareaId: string,
  carpeta: string,
  uuid: string,
): string {
  if (!zIdTarea.safeParse(tareaId).success || !UUID.test(uuid)) {
    throw new RangeError("Clave de imagen inválida");
  }
  return `entregas/${tareaId}/${carpeta}/${uuid}.jpg`;
}

/** ¿La ruta es una imagen subida para ESTA entrega (misma tarea y carpeta)? */
export function esImagenDe(
  ruta: string,
  tareaId: string,
  carpeta: string,
): boolean {
  const partes = ruta.split("/");
  if (partes.length !== 4) return false;
  const [raiz, tarea, carp, archivo] = partes;
  return (
    raiz === "entregas" &&
    tarea === tareaId &&
    carp === carpeta &&
    archivo !== undefined &&
    archivo.endsWith(".jpg") &&
    UUID.test(archivo.slice(0, -4))
  );
}

/* ---------- Armar la entrega ---------- */

/**
 * Respuestas normalizadas: una por pregunta, del formato de la pregunta. Textos sin espacios
 * en los extremos, no vacíos y de hasta `ANSWER_MAX_LENGTH`; imágenes de esta entrega.
 */
export function respuestasValidas(
  preguntas: ReadonlyArray<Pick<Tarea["preguntas"][number], "id" | "formato">>,
  respuestas: EnvioEntrega["respuestas"],
  tareaId: string,
  carpeta: string,
): Entrega["respuestas"] | null {
  const ids = new Set(preguntas.map((p) => p.id));
  if (Object.keys(respuestas).some((k) => !ids.has(k))) return null;
  const out: Entrega["respuestas"] = {};
  for (const p of preguntas) {
    const r = respuestas[p.id];
    if (!r) return null;
    if (p.formato === "texto") {
      if (!("texto" in r)) return null;
      const texto = r.texto.trim();
      if (texto === "" || texto.length > ANSWER_MAX_LENGTH) return null;
      out[p.id] = { texto };
    } else {
      if (!("imagenPath" in r)) return null;
      if (!esImagenDe(r.imagenPath, tareaId, carpeta)) return null;
      out[p.id] = { imagenPath: r.imagenPath };
    }
  }
  return out;
}

/**
 * Cédulas que ya figuran en OTRA entrega enviada de la misma tarea. Un alumno que el profe cambió
 * de equipo después de que su equipo viejo entregó conserva la nota de ese equipo y no entra en
 * la del nuevo (D221; QA versión 1, F-A2: antes contaba dos veces en el ranking).
 */
export function enOtraEntrega(
  entregas: ReadonlyArray<{
    id: string;
    entrega: Pick<Entrega, "estado" | "integrantes">;
  }>,
  propiaId: string,
): Set<string> {
  return new Set(
    entregas
      .filter((e) => e.id !== propiaId && yaEnviada(e.entrega))
      .flatMap((e) => e.entrega.integrantes),
  );
}

/**
 * La entrega que se escribe al enviar (estado `entregada`, sin evaluación). Integrantes: el
 * alumno, o los del equipo en ese momento (foto fija del modelo), salvo quienes ya están en otra
 * entrega enviada de la tarea (`excluidos`, D221).
 */
export function armarEntrega(args: {
  tareaId: string;
  tarea: Pick<Tarea, "preguntas">;
  permiso: PermisoEntrega;
  usuario: Pick<Usuario, "cedula" | "seccion">;
  integrantes: readonly string[];
  excluidos?: ReadonlySet<string>;
  respuestas: EnvioEntrega["respuestas"];
  carpeta: string;
  ahora: number;
}): { ok: true; entrega: Entrega } | { ok: false; error: ErrorEntrega } {
  const { permiso, usuario } = args;
  if (usuario.seccion === null) return { ok: false, error: "no-existe" };
  const respuestas = respuestasValidas(
    args.tarea.preguntas,
    args.respuestas,
    args.tareaId,
    args.carpeta,
  );
  if (!respuestas || args.tarea.preguntas.length === 0) {
    return { ok: false, error: "incompleta" };
  }
  const integrantes =
    permiso.tipo === "individual"
      ? [usuario.cedula]
      : [...new Set([...args.integrantes, usuario.cedula])]
          .filter((c) => !args.excluidos?.has(c))
          .sort();
  return {
    ok: true,
    entrega: {
      tareaId: args.tareaId,
      tipo: permiso.tipo,
      titularId: permiso.titularId,
      seccion: usuario.seccion,
      integrantes,
      estado: "entregada",
      respuestas,
      enviadaPor: usuario.cedula,
      enviadaEn: args.ahora,
      evaluacion: null,
    },
  };
}

/* ---------- Mensajes ---------- */

/**
 * `almacen`: el servidor no pudo usar B2 (sin configurar, caído o rechazó). No es la conexión del
 * alumno: esa falla en el cliente y llega como `red` (QA versión 1, F-B4; D229). `imagen-falta`:
 * una respuesta de imagen apunta a un objeto que no está en B2 (F-B3).
 */
export type ErrorSubida =
  | ErrorEntrega
  | "imagen-tipo"
  | "imagen-peso"
  | "almacen"
  | "red";
export type ErrorEnvio = ErrorEntrega | "almacen" | "imagen-falta" | "red";

/**
 * Cada imagen del envío tiene que estar en B2: una ruta con el formato correcto pero nunca subida
 * llegaba al profe como «Imagen no disponible» (F-B3, D229). `null` = todas están (o no hay
 * imágenes). Se llama fuera de la transacción: es otro servicio y no cambia con ella.
 */
export async function comprobarImagenes(
  almacen: { existe: (clave: string) => Promise<ResultadoExiste> } | null,
  respuestas: EnvioEntrega["respuestas"],
): Promise<"almacen" | "imagen-falta" | null> {
  const imagenes = imagenesDe(respuestas);
  if (imagenes.length === 0) return null;
  if (!almacen) return "almacen";
  const vistas = await Promise.all(imagenes.map((c) => almacen.existe(c)));
  if (vistas.some((v) => !v.ok)) return "almacen";
  if (vistas.some((v) => v.ok && !v.existe)) return "imagen-falta";
  return null;
}

/** Rutas de las respuestas de imagen de un envío (para comprobar que existen en B2). */
export function imagenesDe(respuestas: EnvioEntrega["respuestas"]): string[] {
  return Object.values(respuestas).flatMap((r) =>
    r && "imagenPath" in r ? [r.imagenPath] : [],
  );
}

/** Copy de los errores (PLACEHOLDER de copy, CONTENT_CHECKLIST fila 129). */
export function mensajeErrorEntrega(error: ErrorSubida | ErrorEnvio): string {
  switch (error) {
    case "no-existe":
      return "Esta tarea ya no está disponible.";
    case "cerrada":
      return "La tarea ya cerró: no se puede entregar.";
    case "sin-equipo":
      return "Necesitas un equipo para entregar esta tarea.";
    case "no-capitan":
      return "Solo el capitán de tu equipo puede entregar esta tarea.";
    case "ya-entregada":
      return "Esta tarea ya se entregó.";
    case "incompleta":
      return "Revisa tus respuestas: falta alguna o hay una imagen que no se subió.";
    case "imagen-tipo":
      return "Solo se aceptan imágenes JPG o PNG.";
    case "imagen-peso":
      return "La imagen es muy pesada. Prueba con otra.";
    case "almacen":
      return "No pudimos guardar la imagen por un problema del portal, no de tu internet. Inténtalo más tarde y, si sigue, avísale a tu profe.";
    case "imagen-falta":
      return "Una de tus imágenes no llegó a guardarse. Súbela otra vez y vuelve a entregar.";
    case "red":
      return "No se pudo conectar. Revisa tu conexión e inténtalo otra vez.";
  }
}
