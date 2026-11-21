// Modelo de datos (fase 07, D174–D177; en Postgres desde D327). Tipos, nombres de colecciones y
// esquemas zod de cada documento. Cada colección es hoy una tabla (`lib/db/schema.ts`) y cada fila
// se valida con estos esquemas al leerla (`lib/data/filas.ts`); se usan igual en el servidor, en el
// cliente (lo que llega por las rutas de sondeo), en el seed y en las pruebas.
//
// Escrituras: SOLO el servidor (Server Actions, D175). El navegador no toca la base: lee por
// /api/ranking y /api/presencia, y marca su presencia por /api/presencia (D275, D327).
import { z } from "zod";
import { esClaveValida } from "@/lib/almacen/clave";
import { esDiaValido, RE_HORA } from "@/lib/fecha";
import { BASE_MAX, BASE_MIN, NOTA_MAX } from "@/lib/grades";
import { URL_MAX_LENGTH } from "@/lib/url-respuesta";

/* ---------- Colecciones ---------- */

export const COL = {
  /** `usuarios/{cedula}`: perfil público dentro de la app (uid de Auth = cédula, D174). */
  usuarios: "usuarios",
  /** `privados/{cedula}`: email real para recuperar la contraseña (D008). */
  privados: "privados",
  /** `historialBase/{auto}`: cada cambio de base de un alumno (D176). */
  historialBase: "historialBase",
  /** `equipos/{id}`. */
  equipos: "equipos",
  /** `tareas/{id}`. */
  tareas: "tareas",
  /** `entregas/{tareaId}__{titularId}` (titular = alumno o equipo). */
  entregas: "entregas",
  /** `ajustes/{auto}`: ajustes de puntos con motivo (D007). */
  ajustes: "ajustes",
  /** `ranking/{seccion}`: puntos derivados, un documento por sección (D174). */
  ranking: "ranking",
  /** `recuperaciones/{cedula}`: envíos del enlace de recuperación (límite, D187). Solo servidor. */
  recuperaciones: "recuperaciones",
  /**
   * `presencia/{cedulaAlumno}/editores/{cedulaProfe}`: quién tiene abierto «Editar alumno»
   * (`{ nombre, desde, latido }`). Efímera; la escribe el navegador del profe (D275).
   */
  presencia: "presencia",
  /**
   * `operaciones/{opId}`: envíos ya procesados de la cola sin conexión (entrega o tarea), para
   * que un reintento devuelva el mismo resultado sin duplicar (D293). Solo servidor; vence a los 30 días.
   */
  operaciones: "operaciones",
  /** `config/{doc}`: configuración de la escuela: `config/secciones` (D317) y `config/motivos` (D375). */
  config: "config",
} as const;

/** Id del catálogo de años y secciones en `config/` (D317). */
export const DOC_SECCIONES = "secciones";

/** Id de las opciones fijas de Ajustes de puntos en `config/` (D375). */
export const DOC_MOTIVOS = "motivos";

/** Subcolección de `presencia/{cedulaAlumno}` (una entrada por profe). */
export const SUBCOL_EDITORES = "editores";

export function idEntrega(tareaId: string, titularId: string): string {
  return `${tareaId}__${titularId}`;
}

/* ---------- Primitivas ---------- */

/**
 * Código de sección = número de año + letra: «5A» (D317). Texto validado, no unión fija: las que
 * existen salen del catálogo `config/secciones` (`catalogoSecciones()` y `seccionesDe(...)`).
 */
export type SeccionId = string;
export const ANIO_MIN = 1;
export const ANIO_MAX = 6;
/** Letras de sección: de la A a la F (D349). */
export const LETRA_MIN = "A";
export const LETRA_MAX = "F";
export const LETRAS: readonly string[] = Array.from(
  { length: LETRA_MAX.charCodeAt(0) - LETRA_MIN.charCodeAt(0) + 1 },
  (_, i) => String.fromCharCode(LETRA_MIN.charCodeAt(0) + i),
);
const CLASE_LETRA = `[${LETRA_MIN}-${LETRA_MAX}]`;
export const zSeccion = z
  .string()
  .regex(
    new RegExp(`^[${ANIO_MIN}-${ANIO_MAX}]${CLASE_LETRA}$`),
    "Sección inválida",
  );
/** Letra de una sección dentro de su año (D317). */
export const zLetra = z
  .string()
  .regex(new RegExp(`^${CLASE_LETRA}$`), "Letra inválida");
/** Número de año: 1.º a 6.º (D317, D348). */
export const zNumeroAnio = z.number().int().min(ANIO_MIN).max(ANIO_MAX);

export const ROLES = ["estudiante", "profesor"] as const;
export type RolUsuario = (typeof ROLES)[number];
export const zRol = z.enum(ROLES);

/** Cédula: solo dígitos, 7–9 (D008). */
export const zCedula = z
  .string()
  .trim()
  .regex(/^\d{7,9}$/, "Cédula inválida");

const esMedio = (n: number) => Number.isInteger(n * 2);

/** Base de evaluación 10–20 en pasos de 0,5 (D006). */
export const zBase = z
  .number()
  .min(BASE_MIN)
  .max(BASE_MAX)
  .refine(esMedio, "La base va en pasos de 0,5");

/** Puntaje sobre 20 en pasos de 0,5 (D004). */
export const zPuntaje = z
  .number()
  .min(0)
  .max(NOTA_MAX)
  .refine(esMedio, "El puntaje va en pasos de 0,5");

/** Día civil `AAAA-MM-DD` con año de 4 cifras (nunca `new Date(<texto libre>)`). */
export const zDia = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Fecha inválida")
  // El día tiene que existir: "2027-02-31" respondía `red` en vez de `invalida` (F-B2, D228)
  .refine(esDiaValido, "Fecha inválida");

/** Hora de entrega "HH:MM" de 24 h, civil de Caracas (D352). */
export const zHora = z.string().regex(RE_HORA, "Hora inválida");

/** Instante en milisegundos epoch (el servidor lo pone; Firestore lo guarda como número). */
export const zInstante = z.number().int().nonnegative();

const texto = (max: number) => z.string().trim().min(1).max(max);

/* ---------- usuarios / privados ---------- */

export const zAvatar = z.object({
  estilo: z.string().trim().min(1).max(40),
  semilla: z.string().trim().min(1).max(80),
});

/** Tema y acento elegidos en Perfil (D001, D015); `localStorage` solo evita el parpadeo. */
export const zApariencia = z.object({
  tema: z.enum(["light", "dark", "system"]),
  acento: z.enum(["azul", "rojo", "verde", "morado"]),
});
export type Apariencia = z.infer<typeof zApariencia>;

export const zUsuario = z.object({
  cedula: zCedula,
  rol: zRol,
  nombres: texto(80),
  apellidos: texto(80),
  /** `null` en el profesor (ve las dos secciones). */
  seccion: zSeccion.nullable(),
  /** Equipo actual del estudiante; `null` sin equipo o profesor. */
  equipoId: z.string().min(1).nullable(),
  /** Base vigente del estudiante (D006, D176); 20 en el profesor (no se usa). */
  base: zBase,
  avatar: zAvatar,
  /** Ausente hasta que el usuario elige tema o acento en Perfil (D191). */
  apariencia: zApariencia.optional(),
  /**
   * Profesor admin: gestiona a los demás profesores (D231). Ausente = false; en un estudiante no
   * cuenta (`claimsDe` solo lo copia si el rol es profesor).
   */
  admin: z.boolean().optional(),
  /** `true` al crear la cuenta con contraseña temporal; se borra al cambiarla (D232). */
  debeCambiarPassword: z.boolean().optional(),
  actualizadoEn: zInstante,
});
export type Usuario = z.infer<typeof zUsuario>;

export const zPrivado = z.object({
  /** Email real para «Olvidé mi contraseña»; `null` mientras no se cargue (checklist #3). */
  email: z.string().trim().toLowerCase().email().max(254).nullable(),
});
export type Privado = z.infer<typeof zPrivado>;

export const zCambioBase = z.object({
  alumnoId: zCedula,
  de: zBase,
  a: zBase,
  /** Por qué cambió (D108: el formulario lo exige; el alumno lo verá). */
  motivo: texto(300),
  autorId: zCedula,
  en: zInstante,
});
export type CambioBase = z.infer<typeof zCambioBase>;

/* ---------- equipos ---------- */

export const zEquipo = z.object({
  nombre: texto(80),
  seccion: zSeccion,
  /** `null`: el equipo aún no eligió tema. */
  tema: texto(60).nullable(),
  capitanId: zCedula.nullable(),
  /** Ruta en Storage del logo; `null` sin logo (iniciales). */
  logoPath: z.string().min(1).nullable(),
});
export type Equipo = z.infer<typeof zEquipo>;

/* ---------- tareas ---------- */

export const TIPOS_TAREA = ["individual", "grupal"] as const;
export type TipoTareaId = (typeof TIPOS_TAREA)[number];

export const ESTADOS_TAREA = ["borrador", "abierta", "evaluada"] as const;
export type EstadoTareaId = (typeof ESTADOS_TAREA)[number];

/** Límite de imágenes de una pregunta «Varias imágenes» (D373): de 2 a 10. */
export const MAX_IMAGENES_MIN = 2;
export const MAX_IMAGENES_TOPE = 10;
export const zMaxImagenes = z
  .number()
  .int()
  .min(MAX_IMAGENES_MIN)
  .max(MAX_IMAGENES_TOPE);

/** Formatos de respuesta de una pregunta: texto, imagen(es) o enlace (D468). */
export const FORMATOS_PREGUNTA = ["texto", "imagen", "url"] as const;
export type FormatoPreguntaId = (typeof FORMATOS_PREGUNTA)[number];

export const zPregunta = z.object({
  id: z.string().min(1).max(40),
  enunciado: texto(500),
  /** «Enlace» (`url`, D468): la respuesta es un enlace `http(s)` (`lib/url-respuesta.ts`). */
  formato: z.enum(FORMATOS_PREGUNTA),
  /**
   * Solo en imagen (D373): cuántas imágenes puede subir el alumno, de 2 a 10. Ausente = una sola
   * (las preguntas de antes siguen igual, sin migración).
   */
  maxImagenes: zMaxImagenes.optional(),
  /** Valor sobre 20 en pasos de 0,5; mayor que 0. */
  valor: zPuntaje.refine((n) => n > 0, "El valor debe ser mayor que 0"),
});
export type Pregunta = z.infer<typeof zPregunta>;

/** Imágenes que admite la pregunta: 1 salvo «Varias imágenes» (D373). */
export function limiteImagenes(p: {
  formato: FormatoPreguntaId;
  maxImagenes?: number | null | undefined;
}): number {
  return p.formato === "imagen" ? (p.maxImagenes ?? 1) : 0;
}

/**
 * Decisión del profe ante un empate en la mejor nota de una sección (D123, D124, D201): «dar» a
 * un equipo (grupal), «darAlumno» a un alumno (individual, D263) o «compartir».
 */
export const zDecisionPremio = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("dar"), equipoId: z.string().min(1) }),
  z.object({ tipo: z.literal("darAlumno"), alumnoId: zCedula }),
  z.object({ tipo: z.literal("compartir") }),
]);
export type DecisionPremio = z.infer<typeof zDecisionPremio>;

/** A quién da el premio la decisión (equipo o alumno); `null` si lo comparte. */
export function idDeDecision(d: DecisionPremio): string | null {
  switch (d.tipo) {
    case "dar":
      return d.equipoId;
    case "darAlumno":
      return d.alumnoId;
    case "compartir":
      return null;
  }
}

/** Prefijo de las fotos de premio en B2 (D265). */
export const PREFIJO_FOTO_PREMIO = "premios/";

/** Clave B2 de la foto del premio: `premios/{tareaId}/{uuid}.{ext}` (D265). */
export const zClaveFotoPremio = z
  .string()
  .refine(
    (c) => c.startsWith(PREFIJO_FOTO_PREMIO) && esClaveValida(c),
    "Clave de foto inválida",
  );

/**
 * Por sección: el premio se disputa entre los equipos de cada sección (D201). Registro por
 * código (D320): vale para cualquier sección del catálogo y lee igual los `{ "5A": … }` guardados.
 */
export const zDecisionesPremio = z.record(zSeccion, zDecisionPremio);
export type DecisionesPremio = z.infer<typeof zDecisionesPremio>;

/** Titular de una entrega: cédula (individual) o id del equipo (grupal); `idEntrega` lo une a la tarea. */
export const zTitularId = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,120}$/, "Titular inválido");

/**
 * Prórroga de un titular al reabrir para algunos (D452): su propia fecha y hora de entrega, con
 * las reglas de `fechaEntrega` / `horaEntrega` (`null` = al final del día).
 */
export const zProrroga = z.object({
  fecha: zDia,
  hora: zHora.nullable(),
});
export type Prorroga = z.infer<typeof zProrroga>;

/** Prórrogas por titular (D452). Ausente = ninguna. */
export const zProrrogas = z.record(zTitularId, zProrroga);
export type Prorrogas = z.infer<typeof zProrrogas>;

/** Sin premio no hay foto del premio (D265). */
const fotoConPremio = (
  t: { premio: string | null; premioFoto?: string | null | undefined },
  ctx: z.RefinementCtx,
) => {
  if (t.premio === null && t.premioFoto) {
    ctx.addIssue({ code: "custom", message: "La foto va con un premio" });
  }
};

export const zTarea = z
  .object({
    titulo: texto(120),
    tipo: z.enum(TIPOS_TAREA),
    secciones: z.array(zSeccion).min(1),
    estado: z.enum(ESTADOS_TAREA),
    /** Fecha de entrega; `null` en un borrador sin fecha. */
    fechaEntrega: zDia.nullable(),
    /**
     * Hora de entrega del día de `fechaEntrega`, en Caracas (D352). Ausente o `null` = al final
     * del día (las guardadas antes de la hora siguen igual).
     */
    horaEntrega: zHora.nullable().optional(),
    /**
     * Opcional en grupales (D012) y en individuales (D263): lo gana la mejor nota de cada
     * sección, el equipo o el alumno.
     */
    premio: texto(200).nullable(),
    /** Clave B2 de la foto del premio (D265); ausente o `null` = sin foto. */
    premioFoto: zClaveFotoPremio.nullable().optional(),
    preguntas: z.array(zPregunta),
    /** Notas traídas del Excel sin preguntas ni desglose (D174): no exige la suma de 20. */
    importada: z.boolean().default(false),
    autorId: zCedula.nullable(),
    actualizadoEn: zInstante,
    /** Empates de premio ya decididos (ausente: ninguno). */
    decisionesPremio: zDecisionesPremio.optional(),
    /** Prórrogas de quienes la tienen reabierta (D452); ausente = ninguna. */
    prorrogas: zProrrogas.optional(),
  })
  .superRefine((t, ctx) => {
    fotoConPremio(t, ctx);
    // Publicada (abierta/evaluada) = suma exacta de 20 (D004). Un borrador puede no sumar.
    if (
      !t.importada &&
      t.estado !== "borrador" &&
      sumaValores(t.preguntas) !== NOTA_MAX
    ) {
      ctx.addIssue({ code: "custom", message: "Las preguntas deben sumar 20" });
    }
  });
export type Tarea = z.infer<typeof zTarea>;

/**
 * Pregunta de un borrador a medias (D199): enunciado vacío y valor sin poner (D103) se guardan
 * para seguir otro día; al publicar tienen que cumplir `zPregunta`.
 */
export const zPreguntaBorrador = z.object({
  id: zPregunta.shape.id,
  enunciado: z.string().trim().max(500),
  formato: zPregunta.shape.formato,
  maxImagenes: zPregunta.shape.maxImagenes,
  valor: zPregunta.shape.valor.nullable(),
});
export type PreguntaBorrador = z.infer<typeof zPreguntaBorrador>;

/** Borrador del profe que aún no cumple `zTarea` (D199). Solo lo lee el profe. */
export const zTareaBorrador = z
  .object({
    titulo: texto(120),
    tipo: z.enum(TIPOS_TAREA),
    secciones: z.array(zSeccion).min(1),
    estado: z.literal("borrador"),
    fechaEntrega: zDia.nullable(),
    horaEntrega: zHora.nullable().optional(),
    premio: texto(200).nullable(),
    premioFoto: zClaveFotoPremio.nullable().optional(),
    preguntas: z.array(zPreguntaBorrador).min(1).max(20),
    importada: z.literal(false).default(false),
    autorId: zCedula.nullable(),
    actualizadoEn: zInstante,
  })
  .superRefine(fotoConPremio);
export type TareaBorrador = z.infer<typeof zTareaBorrador>;

/**
 * Cualquier documento de `tareas`: una tarea válida (publicada o borrador completo) o un
 * borrador a medias. Las lecturas del estudiante siguen con `zTarea` (no ve borradores).
 */
export const zTareaDoc = z.union([zTarea, zTareaBorrador]);
export type TareaDoc = Tarea | TareaBorrador;

/** Suma de valores en medios enteros (sin errores de coma flotante). */
export function sumaValores(
  preguntas: ReadonlyArray<{ valor: number }>,
): number {
  return preguntas.reduce((s, p) => s + Math.round(p.valor * 2), 0) / 2;
}

/* ---------- entregas ---------- */

export const ESTADOS_ENTREGA = ["borrador", "entregada", "evaluada"] as const;
export type EstadoEntregaId = (typeof ESTADOS_ENTREGA)[number];

/**
 * Respuesta: texto, una imagen (`imagenPath`), varias (`imagenPaths`, D373) o un enlace (`url`,
 * D468). Una pregunta de una imagen sigue guardando `imagenPath`; quien lee las rutas usa
 * `rutasImagen`. Ojo: `"texto" in r` falso ya no implica imagen.
 */
export const zRespuesta = z.union([
  z.object({ texto: z.string().max(5000) }),
  // La regla del enlace (protocolo, credenciales) la aplica `respuestasValidas` (D469)
  z.object({ url: z.string().min(1).max(URL_MAX_LENGTH) }),
  z.object({ imagenPath: z.string().min(1) }),
  z.object({
    imagenPaths: z.array(z.string().min(1)).min(1).max(MAX_IMAGENES_TOPE),
  }),
]);
export type Respuesta = z.infer<typeof zRespuesta>;

/** Rutas de imagen de una respuesta, en orden (ninguna si es de texto o enlace). */
export function rutasImagen(r: Respuesta | null | undefined): string[] {
  if (!r) return [];
  if ("imagenPaths" in r) return [...r.imagenPaths];
  if ("imagenPath" in r) return [r.imagenPath];
  return [];
}

export const zEvaluacion = z.object({
  /** Puntos por pregunta (id → puntos); `null` si la nota vino del Excel sin desglose. */
  puntos: z.record(z.string(), zPuntaje).nullable(),
  comentarios: z.record(z.string(), z.string().trim().max(1000)),
  /** Puntaje total sobre 20, antes de la base (D006). */
  puntaje: zPuntaje,
  evaluadaPor: zCedula.nullable(),
  evaluadaEn: zInstante,
  /**
   * Solo en grupales: integrantes que el profe marcó «No participó» (D364). Cada uno queda con
   * `NOTA_MIN` en esta tarea; el equipo y los demás conservan su nota. Opcional: las evaluaciones
   * de antes no lo traen y se leen igual (sin migración); se escribe solo si hay alguno.
   */
  noParticiparon: z.array(zCedula).optional(),
  /**
   * La base con la que se evaluó a cada integrante en ESTA entrega (cédula → base, D403). La app
   * la escribe siempre (una clave por integrante); opcional porque las evaluaciones de antes no
   * la traen: quien lee cae a la base vigente del alumno (`baseDeIntegrante`).
   */
  bases: z.record(zCedula, zBase).optional(),
  /**
   * Comentario general de la entrega (además del de cada pregunta; en grupal, uno para el
   * equipo; D445). Opcional, como `bases`: se escribe solo si tiene texto y las evaluaciones de
   * antes no lo traen. 1000 como `comentarios`: aquí se lee lo guardado, el tope de 300 lo pone
   * `zGuardarEvaluacion`.
   */
  comentarioGeneral: z.string().trim().max(1000).optional(),
});
export type Evaluacion = z.infer<typeof zEvaluacion>;

export const zEntrega = z
  .object({
    tareaId: z.string().min(1),
    tipo: z.enum(TIPOS_TAREA),
    /** Cédula (individual) o id del equipo (grupal). */
    titularId: z.string().min(1),
    /**
     * Nombre del equipo cuando se eliminó (D308): solo en una grupal cuyo equipo ya no existe.
     * Quien la muestra usa el equipo vivo; si no, esto; si no, `TITULAR_DESCONOCIDO`.
     */
    titularNombre: z.string().min(1).optional(),
    seccion: zSeccion,
    /**
     * Quiénes reciben la nota: el alumno, o los integrantes del equipo al entregar (foto fija:
     * si alguien cambia de equipo después, la nota se queda con quien la hizo).
     */
    integrantes: z.array(zCedula).min(1),
    estado: z.enum(ESTADOS_ENTREGA),
    respuestas: z.record(z.string(), zRespuesta),
    enviadaPor: zCedula.nullable(),
    enviadaEn: zInstante.nullable(),
    evaluacion: zEvaluacion.nullable(),
    /**
     * La evaluación que la última guardada reemplazó (`null`: estaba sin evaluar), para que
     * «Deshacer» la devuelva (D205). Ausente si nunca se evaluó desde la app o ya se deshizo.
     */
    evaluacionAnterior: zEvaluacion.nullable().optional(),
    /**
     * Solo en grupales repartidas por partes (D416): integrantes que tenían al menos una pregunta
     * asignada y no entregaron ninguna al capitán. Lo calcula el servidor al enviar; Evaluar lo
     * trae premarcado como «No participó» (D364) y el profe lo puede desmarcar. Opcional: las
     * entregas de antes y las grupales sin reparto no lo traen; se escribe solo si hay alguno.
     */
    sinParte: z.array(zCedula).optional(),
  })
  .superRefine((e, ctx) => {
    if (
      e.sinParte &&
      (e.tipo !== "grupal" ||
        e.sinParte.some((c) => !e.integrantes.includes(c)))
    ) {
      ctx.addIssue({
        code: "custom",
        message: "«Sin parte» va solo en grupales y entre sus integrantes",
      });
    }
    if ((e.estado === "evaluada") !== (e.evaluacion !== null)) {
      ctx.addIssue({
        code: "custom",
        message: "Solo una entrega evaluada lleva evaluación",
      });
    }
    if (
      e.tipo === "individual" &&
      (e.integrantes.length !== 1 || e.integrantes[0] !== e.titularId)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Una entrega individual es solo de su titular",
      });
    }
  });
export type Entrega = z.infer<typeof zEntrega>;

/* ---------- partes de una grupal (D416) ---------- */

/**
 * Estado de una pregunta que el capitán repartió (D417): `asignada` (aún sin entregar),
 * `entregada` al capitán, `aceptada` por él o `devuelta` para rehacerla.
 */
export const ESTADOS_PARTE = [
  "asignada",
  "entregada",
  "aceptada",
  "devuelta",
] as const;
export type EstadoParteId = (typeof ESTADOS_PARTE)[number];

/**
 * Una pregunta de una grupal asignada a un integrante (D416). Solo hay parte si la pregunta está
 * asignada: sin parte, la responde el capitán. `entregaId` = `idEntrega(tareaId, equipoId)`, exista
 * o no la entrega todavía.
 */
export const zParte = z.object({
  entregaId: z.string().min(1),
  preguntaId: z.string().min(1).max(40),
  tareaId: z.string().min(1),
  equipoId: z.string().min(1),
  asignado: zCedula,
  estado: z.enum(ESTADOS_PARTE),
  /** Lo que entregó el integrante; `null` mientras no haya entregado nada. */
  respuesta: zRespuesta.nullable(),
  entregadaEn: zInstante.nullable(),
  actualizadoEn: zInstante,
});
export type Parte = z.infer<typeof zParte>;

/* ---------- ajustes ---------- */

export const zAjuste = z.object({
  destino: z.enum(["alumno", "equipo"]),
  destinoId: z.string().min(1),
  seccion: zSeccion,
  /** Id de la opción de `config/motivos` (D375), `anulacion` / `importado`, u `otro` en ajustes viejos (D376). */
  motivoId: z.string().min(1).max(40),
  /** Etiqueta visible en el historial (se guarda: el catálogo puede cambiar). */
  motivo: texto(80),
  /** Puntos ± en pasos de 0,5, distinto de 0 (D007). */
  valor: z
    .number()
    .min(-20)
    .max(20)
    .refine((n) => n !== 0 && esMedio(n), "Valor inválido"),
  /** Detalle escrito, opcional (D376). */
  nota: z.string().trim().max(300).nullable(),
  autorId: zCedula.nullable(),
  en: zInstante,
  /** Id del ajuste que este anula (D121); `null` si es un ajuste normal. */
  anulaA: z.string().min(1).nullable(),
});
export type Ajuste = z.infer<typeof zAjuste>;

/* ---------- ranking (derivado) ---------- */

export const zFilaRankingAlumno = z.object({
  nombres: z.string(),
  apellidos: z.string(),
  equipoId: z.string().nullable(),
  estilo: z.string(),
  /** Semilla del avatar (D191); los documentos anteriores no la traen: se usa la cédula. */
  semilla: z.string().optional(),
  puntos: z.number(),
});

export const zFilaRankingEquipo = z.object({
  nombre: z.string(),
  logoPath: z.string().nullable(),
  puntos: z.number(),
});

export const zRankingSeccion = z.object({
  alumnos: z.record(zCedula, zFilaRankingAlumno),
  equipos: z.record(z.string(), zFilaRankingEquipo),
  actualizadoEn: zInstante,
});
export type RankingSeccion = z.infer<typeof zRankingSeccion>;

/* ---------- config/secciones: catálogo de años y secciones (D317) ---------- */

const sinRepetir = <T>(xs: readonly T[]) => new Set(xs).size === xs.length;

/** Un año y las letras de sus secciones (puede no tener ninguna todavía). */
export const zAnio = z.object({
  numero: zNumeroAnio,
  letras: z.array(zLetra).min(0).max(26).refine(sinRepetir, "Letra repetida"),
});

/**
 * `config/secciones`. Se guarda ordenado (años y letras). Ausente = `CATALOGO_INICIAL`
 * (`lib/secciones.ts`); presente con `anios: []` = la escuela sin secciones.
 */
export const zCatalogoSecciones = z.object({
  anios: z
    .array(zAnio)
    .max(9)
    .refine((a) => sinRepetir(a.map((x) => x.numero)), "Año repetido"),
  actualizadoEn: zInstante,
});
export type CatalogoSeccionesDoc = z.infer<typeof zCatalogoSecciones>;

/** Una opción fija de Ajustes de puntos: el valor solo se propone al elegirla (D103, D375). */
export const zMotivo = z.object({
  id: z.string().min(1).max(40),
  etiqueta: texto(40),
  valor: zAjuste.shape.valor,
});

/**
 * `config/motivos`: las opciones fijas de Ajustes de puntos, comunes a todos los profes (D375).
 * Ausente = `MOTIVOS_INICIALES` (`lib/motivos.ts`); nunca vacía.
 */
export const zCatalogoMotivos = z.object({
  motivos: z
    .array(zMotivo)
    .min(1)
    .max(60)
    .refine((m) => sinRepetir(m.map((x) => x.id)), "Id repetido"),
  actualizadoEn: zInstante,
});

/* ---------- Custom claims de Auth (D174) ---------- */

/** Lo que el servidor pone en el token: las reglas leen esto en vez de hacer `get()`. */
export type Claims = {
  rol: RolUsuario;
  seccion: SeccionId | null;
  equipoId: string | null;
  /** Solo un profesor puede ser admin (D231). Ausente = false. */
  admin?: true;
  /** Cuenta con contraseña temporal: el proxy y el DAL la mandan a crear la suya (D232). */
  debeCambiarPassword?: true;
};

/**
 * Claims que salen del perfil. `admin` y `debeCambiarPassword` solo van cuando son `true` (un
 * perfil sin ellas deja las claims como antes); quien las mezcla con las que ya tiene la cuenta
 * y quiere quitarlas las borra antes (`lib/data/cuentas.ts`).
 */
export function claimsDe(
  u: Pick<Usuario, "rol" | "seccion" | "equipoId"> &
    Partial<Pick<Usuario, "admin" | "debeCambiarPassword">>,
): Claims {
  return {
    rol: u.rol,
    seccion: u.seccion,
    equipoId: u.equipoId,
    ...(u.rol === "profesor" && u.admin === true ? { admin: true } : {}),
    ...(u.debeCambiarPassword === true ? { debeCambiarPassword: true } : {}),
  };
}

/* ---------- Email interno de Auth (D008) ---------- */

export const DOMINIO_EMAIL_INTERNO = "alumnos.krea.app";

/** La cédula se traduce a `<cedula>@alumnos.krea.app` para Firebase Auth (todos los roles). */
export function emailInterno(cedula: string): string {
  return `${zCedula.parse(cedula)}@${DOMINIO_EMAIL_INTERNO}`;
}
