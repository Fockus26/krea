// Grupal por partes (D416–D424): el capitán reparte preguntas, cada integrante responde las suyas y
// se las entrega; el capitán acepta, devuelve o reasigna y solo él envía la tarea (D012). Puro (sin
// base ni reloj): lo usan la capa de datos (`lib/data/partes.ts`), la entrega y las pruebas.
import { z } from "zod";
import {
  type ErrorEntrega,
  type PermisoEntrega,
  permisoEntrega,
  type TareaPermiso,
  zIdPregunta,
  zIdTarea,
} from "@/lib/entregas";
import {
  type Entrega,
  type Equipo,
  type EstadoParteId,
  idEntrega,
  type Parte,
  type Respuesta,
  rutasImagen,
  type Usuario,
  zCedula,
  zRespuesta,
} from "@/lib/modelo";

type ConId<T> = { id: string } & T;

/* ---------- Entradas de las Server Actions ---------- */

const zClaveParte = z.object({ tareaId: zIdTarea, preguntaId: zIdPregunta });

/** Capitán: asigna la pregunta a un integrante, o la quita (`asignado: null`, la responde él). */
export const zAsignarParte = zClaveParte.extend({
  asignado: zCedula.nullable(),
});
/** Capitán: acepta o devuelve una parte entregada. */
export const zDecidirParte = zClaveParte;
/** Integrante asignado: entrega su respuesta al capitán. */
export const zEntregarParte = zClaveParte.extend({ respuesta: zRespuesta });

export type AsignarParte = z.infer<typeof zAsignarParte>;
export type EntregarParte = z.infer<typeof zEntregarParte>;

export type AccionParte =
  | { tipo: "asignar"; asignado: string | null }
  | { tipo: "aceptar" }
  | { tipo: "devolver" }
  | { tipo: "entregar"; respuesta: Respuesta };

/* ---------- Permiso ---------- */

export type ErrorParte =
  | ErrorEntrega
  /** La entrega del equipo ya se envió: las partes quedan congeladas (D419). */
  | "enviada"
  /** Esta pregunta no está asignada a quien la quiere entregar. */
  | "no-asignada"
  /** La acción no cabe en el estado de la parte (aceptar una sin entregar, entregar una aceptada). */
  | "estado"
  /** Se asignó a alguien que no es integrante del equipo (o al capitán). */
  | "integrante"
  | "almacen"
  | "imagen-falta"
  | "red";

export type PermisoParte = PermisoEntrega & {
  equipoId: string;
  /** Capitán del equipo actual (D012): reparte, acepta y devuelve. */
  capitan: boolean;
};

/**
 * ¿Puede este alumno tocar el reparto de esta tarea? Solo grupales abiertas para su equipo en
 * `ahora` (D451, D452), de su sección y con su equipo actual (D221: manda el equipo de hoy). Lo
 * mismo que `permisoEntrega`, pero el integrante que no es capitán también pasa (`capitan: false`).
 */
export function permisoParte(
  usuario: Pick<Usuario, "cedula" | "rol" | "seccion" | "equipoId">,
  tarea: TareaPermiso | null,
  tareaId: string,
  equipo: ConId<Pick<Equipo, "seccion" | "capitanId">> | null,
  ahora: number,
): { ok: true; permiso: PermisoParte } | { ok: false; error: ErrorEntrega } {
  if (tarea?.tipo === "individual") return { ok: false, error: "no-existe" };
  const p = permisoEntrega(usuario, tarea, tareaId, equipo, ahora);

  if (p.ok) {
    return {
      ok: true,
      permiso: { ...p.permiso, equipoId: p.permiso.titularId, capitan: true },
    };
  }
  // `no-capitan` solo sale con el equipo ya comprobado (actual y de su sección)
  if (p.error !== "no-capitan" || !equipo) return p;
  return {
    ok: true,
    permiso: {
      tipo: "grupal",
      titularId: equipo.id,
      entregaId: idEntrega(tareaId, equipo.id),
      equipoId: equipo.id,
      capitan: false,
    },
  };
}

/* ---------- Partes vigentes ---------- */

/**
 * La parte cuenta solo si su `asignado` sigue en el equipo y no es el capitán (D421): quien se
 * fue (o pasó a capitán) deja la pregunta sin asignar, sin borrar la fila.
 */
export function esVigente(
  p: Pick<Parte, "asignado">,
  miembros: readonly string[],
  capitanId: string | null,
): boolean {
  return miembros.includes(p.asignado) && p.asignado !== capitanId;
}

export function partesVigentes<P extends Pick<Parte, "asignado">>(
  partes: readonly P[],
  miembros: readonly string[],
  capitanId: string | null,
): P[] {
  return partes.filter((p) => esVigente(p, miembros, capitanId));
}

/** Estados en que el integrante ya entregó (D420: una entregada sin aceptar cuenta). */
const ENTREGO: readonly EstadoParteId[] = ["entregada", "aceptada"];

/**
 * `sinParte` de la entrega al enviar (D420): integrantes de la entrega, salvo quien envía, con al
 * menos una pregunta asignada y ninguna entregada ni aceptada. En el orden de `integrantes`.
 * Sin reparto (ninguna parte) → vacío: nadie queda marcado.
 */
export function sinParteDe(
  partes: ReadonlyArray<Pick<Parte, "asignado" | "estado">>,
  integrantes: readonly string[],
  enviadaPor: string,
): string[] {
  return integrantes.filter((c) => {
    if (c === enviadaPor) return false;
    const suyas = partes.filter((p) => p.asignado === c);
    return suyas.length > 0 && !suyas.some((p) => ENTREGO.includes(p.estado));
  });
}

/* ---------- Transiciones ---------- */

export type ResultadoParte =
  | {
      ok: true;
      /** La parte que queda (`null`: sin asignar, se borra la fila). */
      parte: Parte | null;
      /** Imágenes que la parte dejó de usar: se borran de B2 tras el commit (D396). */
      sinUso: string[];
    }
  | { ok: false; error: ErrorParte };

/**
 * Aplica una acción a la parte de una pregunta (D417, D418). `actual` es la fila tal cual (puede
 * no estar vigente); `quien` ya pasó `permisoParte`. Capitán: asignar (reasignar descarta la
 * respuesta anterior; asignar al mismo no cambia nada), quitar, aceptar una `entregada`, devolver
 * una `entregada` o `aceptada`. Integrante asignado: entregar mientras no esté `aceptada` (la
 * `respuesta` ya viene normalizada por `respuestasValidas`).
 */
export function aplicarParte(args: {
  actual: Parte | null;
  accion: AccionParte;
  quien: { cedula: string; capitan: boolean };
  miembros: readonly string[];
  capitanId: string | null;
  clave: Pick<Parte, "entregaId" | "preguntaId" | "tareaId" | "equipoId">;
  ahora: number;
}): ResultadoParte {
  const { actual, accion, quien, miembros, capitanId, clave, ahora } = args;
  const vigente =
    actual && esVigente(actual, miembros, capitanId) ? actual : null;
  const rutasActual = rutasImagen(actual?.respuesta);

  if (accion.tipo === "entregar") {
    if (quien.capitan || vigente?.asignado !== quien.cedula)
      return { ok: false, error: "no-asignada" };
    if (vigente.estado === "aceptada") return { ok: false, error: "estado" };
    const nuevas = new Set(rutasImagen(accion.respuesta));
    return {
      ok: true,
      parte: {
        ...vigente,
        estado: "entregada",
        respuesta: accion.respuesta,
        entregadaEn: ahora,
        actualizadoEn: ahora,
      },
      sinUso: rutasActual.filter((r) => !nuevas.has(r)),
    };
  }

  if (!quien.capitan) return { ok: false, error: "no-capitan" };

  if (accion.tipo === "asignar") {
    if (accion.asignado === null) {
      return { ok: true, parte: null, sinUso: rutasActual };
    }
    if (!miembros.includes(accion.asignado) || accion.asignado === capitanId) {
      return { ok: false, error: "integrante" };
    }
    // Asignar al mismo: nada cambia (ni su respuesta)
    if (vigente?.asignado === accion.asignado) {
      return { ok: true, parte: vigente, sinUso: [] };
    }
    return {
      ok: true,
      parte: {
        ...clave,
        asignado: accion.asignado,
        estado: "asignada",
        respuesta: null,
        entregadaEn: null,
        actualizadoEn: ahora,
      },
      sinUso: rutasActual,
    };
  }

  if (accion.tipo === "aceptar") {
    if (vigente?.estado !== "entregada") return { ok: false, error: "estado" };
    return {
      ok: true,
      parte: { ...vigente, estado: "aceptada", actualizadoEn: ahora },
      sinUso: [],
    };
  }

  // Devolver: el integrante la rehace; lo que entregó se queda para que lo corrija
  if (vigente?.estado !== "entregada" && vigente?.estado !== "aceptada") {
    return { ok: false, error: "estado" };
  }
  return {
    ok: true,
    parte: { ...vigente, estado: "devuelta", actualizadoEn: ahora },
    sinUso: [],
  };
}

/* ---------- Vistas ---------- */

/** Respuesta guardada → la forma que pintan las páginas (como `RespuestaEnviada`). */
export type RespuestaParte =
  | { tipo: "texto"; texto: string }
  | { tipo: "imagen"; imagenPaths: string[] }
  | { tipo: "url"; url: string };

export function respuestaParte(
  r: Respuesta | null | undefined,
): RespuestaParte | null {
  if (!r) return null;
  if ("texto" in r)
    return r.texto.trim() ? { tipo: "texto", texto: r.texto } : null;
  if ("url" in r) return { tipo: "url", url: r.url };
  return { tipo: "imagen", imagenPaths: rutasImagen(r) };
}

export type FilaReparto = {
  preguntaId: string;
  /** Cédula del integrante; `null` = sin asignar (la responde el capitán). */
  asignado: string | null;
  estado: EstadoParteId | null;
  respuesta: RespuestaParte | null;
};

/**
 * Panel «Reparto» del capitán (D422): una fila por pregunta, en orden, con su parte vigente.
 * Solo el capitán la ve con las respuestas (D423).
 */
export function repartoCapitan(
  preguntas: ReadonlyArray<{ id: string }>,
  partes: readonly Parte[],
  miembros: readonly string[],
  capitanId: string | null,
): FilaReparto[] {
  const vigentes = partesVigentes(partes, miembros, capitanId);
  return preguntas.map((p) => {
    const parte = vigentes.find((x) => x.preguntaId === p.id);
    return {
      preguntaId: p.id,
      asignado: parte?.asignado ?? null,
      estado: parte?.estado ?? null,
      respuesta: respuestaParte(parte?.respuesta),
    };
  });
}

export type ParteIntegrante =
  | {
      mia: true;
      estado: EstadoParteId;
      /** Solo la suya (D423): la del resto no llega a su teléfono. */
      respuesta: RespuestaParte | null;
    }
  /** No es suya: la responde `asignado` (otro integrante) o, con `null`, el capitán. */
  | { mia: false; asignado: string | null };

/**
 * Lo que ve el integrante (D422): por pregunta, si es suya (con su estado y lo que entregó) o de
 * quién es. `null` si no tiene ninguna asignada: ve la tarea como hoy (solo lectura).
 */
export function partesDeIntegrante(
  preguntas: ReadonlyArray<{ id: string }>,
  partes: readonly Parte[],
  miembros: readonly string[],
  capitanId: string | null,
  cedula: string,
): ParteIntegrante[] | null {
  const vigentes = partesVigentes(partes, miembros, capitanId);
  if (!vigentes.some((p) => p.asignado === cedula)) return null;
  return preguntas.map((p): ParteIntegrante => {
    const parte = vigentes.find((x) => x.preguntaId === p.id);
    if (parte?.asignado === cedula) {
      return {
        mia: true,
        estado: parte.estado,
        respuesta: respuestaParte(parte.respuesta),
      };
    }
    return { mia: false, asignado: parte?.asignado ?? null };
  });
}

/**
 * Lo aceptado precarga el formulario del capitán (D418): respuesta por pregunta y la versión (el
 * mayor `actualizadoEn` de las aceptadas) para remontarlo cuando cambia. Gana sobre su borrador.
 */
export function aceptadas(
  partes: readonly Parte[],
  miembros: readonly string[],
  capitanId: string | null,
): { respuestas: Record<string, RespuestaParte>; version: number } {
  const respuestas: Record<string, RespuestaParte> = {};
  let version = 0;
  for (const p of partesVigentes(partes, miembros, capitanId)) {
    if (p.estado !== "aceptada") continue;
    const r = respuestaParte(p.respuesta);
    if (!r) continue;
    respuestas[p.preguntaId] = r;
    version = Math.max(version, p.actualizadoEn);
  }
  return { respuestas, version };
}

/** ¿La entrega del equipo ya salió? Con ella enviada, el reparto queda congelado (D419). */
export function repartoCongelado(
  entrega: Pick<Entrega, "estado"> | null,
): boolean {
  return entrega !== null && entrega.estado !== "borrador";
}

/* ---------- Copy (PROVISIONAL, CONTENT_CHECKLIST filas 223–231) ---------- */

/** Estado de una parte en palabras (va con ícono, nunca solo color). Fila 223. */
export const ESTADO_PARTE_TEXTO: Record<EstadoParteId, string> = {
  asignada: "Asignada",
  entregada: "Entregada al capitán",
  aceptada: "Aceptada",
  devuelta: "Devuelta",
};
/** Pregunta sin asignar en el panel del capitán. Fila 223. */
export const SIN_ASIGNAR_TEXTO = "La respondes tú";

/** Imagen entregada que no se pudo firmar. Fila 223. */
export const PARTE_IMAGEN_SIN_VISTA =
  "Entregó una imagen, pero no se pudo cargar. Recarga la página para verla.";
/** Quien ya no tiene perfil (no debería pasar: la parte vigente es de alguien del equipo). */
export const PARTE_SIN_NOMBRE = "Alguien del equipo";

/** Panel «Reparto» del capitán. Fila 224. */
export const REPARTO_TITULO = "Reparto";
export const REPARTO_AYUDA =
  "Opcional: asigna preguntas a tu equipo. Cada quien te entrega la suya y tú decides si la aceptas. Solo tú envías la tarea.";
export const REPARTO_ACTUALIZAR_AYUDA =
  "Lo que te entreguen aparece al tocar «Actualizar».";
export const REPARTO_ASIGNAR_ETIQUETA = "Asignada a";
export const REPARTO_NADIE = "Nadie (la respondes tú)";

/** Integrante con preguntas asignadas. Fila 225. */
export const PARTES_TITULO = "Tus preguntas";
export function partesAvisoTexto(capitan: string): string {
  return `Responde las preguntas que te asignó ${capitan} y entrégaselas. ${capitan} envía la tarea completa.`;
}
export const ENTREGAR_PARTE = "Entregar al capitán";
export const REENTREGAR_PARTE = "Volver a entregar";
export const PARTE_ENTREGADA_TOAST = "Le entregaste tu parte al capitán";
export const PARTE_ACEPTADA_AYUDA =
  "El capitán ya la aceptó: no hace falta que hagas nada más.";
export const PARTE_DEVUELTA_AYUDA =
  "El capitán te la devolvió: corrígela y vuelve a entregarla.";
export const PARTE_ENTREGADA_AYUDA =
  "Puedes cambiarla y volver a entregarla mientras el capitán no la acepte.";

/** Botones del capitán sobre una parte entregada. Fila 226. */
export const ACEPTAR_PARTE = "Aceptar";
export const DEVOLVER_PARTE = "Devolver";
export const PARTE_ACEPTADA_TOAST = "Parte aceptada: ya está en tus respuestas";
export const PARTE_DEVUELTA_TOAST = "Parte devuelta para que la rehagan";

/**
 * Confirmación de «Entregar» del capitán (D420): a quién se premarcará «No participó». Fila 227.
 * «Ana y Luis quedarán como “No participó”: tenían preguntas y no entregaron ninguna.»
 */
export function avisoSinParteTexto(nombres: readonly string[]): string | null {
  if (nombres.length === 0) return null;
  const lista =
    nombres.length === 1
      ? (nombres[0] ?? "")
      : `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
  return nombres.length === 1
    ? `${lista} quedará como “No participó”: tenía preguntas y no entregó ninguna.`
    : `${lista} quedarán como “No participó”: tenían preguntas y no entregaron ninguna.`;
}

/** Copy de los errores de las partes. Fila 228. */
export function mensajeErrorParte(error: ErrorParte): string {
  switch (error) {
    case "no-existe":
      return "Esta tarea ya no está disponible.";
    case "cerrada":
      return "La tarea ya cerró: el reparto ya no se puede cambiar.";
    case "sin-equipo":
      return "Necesitas un equipo para trabajar en esta tarea.";
    case "no-capitan":
      return "Solo el capitán de tu equipo puede repartir y aceptar las partes.";
    case "ya-entregada":
    case "ya-evaluada":
    case "enviada":
      return "El capitán ya envió la tarea: el reparto ya no se puede cambiar.";
    case "no-asignada":
      return "Esta pregunta ya no es tuya: el capitán la quitó o se la dio a otra persona.";
    case "estado":
      return "Esa parte cambió mientras la tenías abierta. Actualiza la página para verla.";
    case "integrante":
      return "Esa persona ya no está en tu equipo. Actualiza la página.";
    case "incompleta":
      return "Revisa tu respuesta: está vacía o hay una imagen que no se subió.";
    case "almacen":
      return "No pudimos guardar la imagen por un problema del portal, no de tu internet. Inténtalo más tarde.";
    case "imagen-falta":
      return "Una de tus imágenes no llegó a guardarse. Súbela otra vez.";
    case "red":
      return "Necesitas conexión para esto. Revisa tu internet e inténtalo otra vez.";
  }
}
