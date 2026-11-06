// Modelo de datos de Firestore (fase 07, D174–D177). Tipos, nombres de colecciones y esquemas
// zod de cada documento. Sin Firebase: se usa igual en el servidor (Admin SDK), en el cliente
// (lecturas con onSnapshot), en el seed del emulador y en las pruebas.
//
// Escrituras: SOLO el servidor (Server Actions + Admin SDK, D175). Las reglas niegan toda
// escritura del cliente; el cliente solo lee lo que su rol le deja (firebase/firestore.rules).
import { z } from "zod";
import { esDiaValido } from "@/lib/fecha";
import { BASE_MAX, BASE_MIN, NOTA_MAX } from "@/lib/grades";

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
} as const;

export function idEntrega(tareaId: string, titularId: string): string {
  return `${tareaId}__${titularId}`;
}

/* ---------- Primitivas ---------- */

export const SECCIONES = ["5A", "5C"] as const;
export type SeccionId = (typeof SECCIONES)[number];
export const zSeccion = z.enum(SECCIONES);

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

export const zPregunta = z.object({
  id: z.string().min(1).max(40),
  enunciado: texto(500),
  formato: z.enum(["texto", "imagen"]),
  /** Valor sobre 20 en pasos de 0,5; mayor que 0. */
  valor: zPuntaje.refine((n) => n > 0, "El valor debe ser mayor que 0"),
});
export type Pregunta = z.infer<typeof zPregunta>;

/** Decisión del profe ante un empate en la mejor nota de una sección (D123, D124, D201). */
export const zDecisionPremio = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("dar"), equipoId: z.string().min(1) }),
  z.object({ tipo: z.literal("compartir") }),
]);
export type DecisionPremio = z.infer<typeof zDecisionPremio>;

/** Por sección: el premio se disputa entre los equipos de cada sección (D201). */
export const zDecisionesPremio = z.object({
  "5A": zDecisionPremio.optional(),
  "5C": zDecisionPremio.optional(),
});
export type DecisionesPremio = z.infer<typeof zDecisionesPremio>;

const premioSoloGrupal = (
  t: { tipo: TipoTareaId; premio: string | null },
  ctx: z.RefinementCtx,
) => {
  if (t.tipo === "individual" && t.premio !== null) {
    ctx.addIssue({
      code: "custom",
      message: "Solo las grupales llevan premio",
    });
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
    /** Solo grupales (D012). */
    premio: texto(200).nullable(),
    preguntas: z.array(zPregunta),
    /** Notas traídas del Excel sin preguntas ni desglose (D174): no exige la suma de 20. */
    importada: z.boolean().default(false),
    autorId: zCedula.nullable(),
    actualizadoEn: zInstante,
    /** Empates de premio ya decididos (ausente: ninguno). */
    decisionesPremio: zDecisionesPremio.optional(),
  })
  .superRefine((t, ctx) => {
    premioSoloGrupal(t, ctx);
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
    premio: texto(200).nullable(),
    preguntas: z.array(zPreguntaBorrador).min(1).max(20),
    importada: z.literal(false).default(false),
    autorId: zCedula.nullable(),
    actualizadoEn: zInstante,
  })
  .superRefine(premioSoloGrupal);
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

export const zRespuesta = z.union([
  z.object({ texto: z.string().max(5000) }),
  z.object({ imagenPath: z.string().min(1) }),
]);

export const zEvaluacion = z.object({
  /** Puntos por pregunta (id → puntos); `null` si la nota vino del Excel sin desglose. */
  puntos: z.record(z.string(), zPuntaje).nullable(),
  comentarios: z.record(z.string(), z.string().trim().max(1000)),
  /** Puntaje total sobre 20, antes de la base (D006). */
  puntaje: zPuntaje,
  evaluadaPor: zCedula.nullable(),
  evaluadaEn: zInstante,
});
export type Evaluacion = z.infer<typeof zEvaluacion>;

export const zEntrega = z
  .object({
    tareaId: z.string().min(1),
    tipo: z.enum(TIPOS_TAREA),
    /** Cédula (individual) o id del equipo (grupal). */
    titularId: z.string().min(1),
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
  })
  .superRefine((e, ctx) => {
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

/* ---------- ajustes ---------- */

export const zAjuste = z.object({
  destino: z.enum(["alumno", "equipo"]),
  destinoId: z.string().min(1),
  seccion: zSeccion,
  /** Id del catálogo (`lib/puntos.ts` MOTIVOS) o `anulacion` / `importado`. */
  motivoId: z.string().min(1).max(40),
  /** Etiqueta visible en el historial (se guarda: el catálogo puede cambiar). */
  motivo: texto(80),
  /** Puntos ± en pasos de 0,5, distinto de 0 (D007). */
  valor: z
    .number()
    .min(-20)
    .max(20)
    .refine((n) => n !== 0 && esMedio(n), "Valor inválido"),
  /** Nota escrita (obligatoria con «Otro»). */
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

/* ---------- Custom claims de Auth (D174) ---------- */

/** Lo que el servidor pone en el token: las reglas leen esto en vez de hacer `get()`. */
export type Claims = {
  rol: RolUsuario;
  seccion: SeccionId | null;
  equipoId: string | null;
};

export function claimsDe(
  u: Pick<Usuario, "rol" | "seccion" | "equipoId">,
): Claims {
  return { rol: u.rol, seccion: u.seccion, equipoId: u.equipoId };
}

/* ---------- Email interno de Auth (D008) ---------- */

export const DOMINIO_EMAIL_INTERNO = "alumnos.krea.app";

/** La cédula se traduce a `<cedula>@alumnos.krea.app` para Firebase Auth (todos los roles). */
export function emailInterno(cedula: string): string {
  return `${zCedula.parse(cedula)}@${DOMINIO_EMAIL_INTERNO}`;
}
