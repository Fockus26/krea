// Esquema de Postgres en el VPS (migración desde Firestore, D327). Cada colección es una tabla
// con el mismo id que tenía el documento; lo que se filtra va en columnas y lo anidado (preguntas,
// respuestas, evaluación, filas del ranking) en `jsonb` validado con los esquemas de `lib/modelo`.
// Los instantes siguen en milisegundos epoch (`bigint` en modo number), como en Firestore.
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type {
  Apariencia,
  DecisionesPremio,
  Evaluacion,
  Prorrogas,
  RankingSeccion,
  Respuesta,
} from "@/lib/modelo";
import type { Borrador } from "@/lib/tareas";

const ms = (nombre: string) => bigint(nombre, { mode: "number" });

/* ---------- Better Auth (id del usuario = cédula, D008) ---------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/** Límite de intentos de Better Auth en la base (Vercel no comparte memoria entre instancias). */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: ms("last_request").notNull(),
});

/* ---------- KREA ---------- */

/** `usuarios/{cedula}` + `privados/{cedula}` (el email real queda en su columna, D008). */
export const usuarios = pgTable(
  "usuarios",
  {
    cedula: text("cedula")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    rol: text("rol", { enum: ["estudiante", "profesor"] }).notNull(),
    nombres: text("nombres").notNull(),
    apellidos: text("apellidos").notNull(),
    seccion: text("seccion"),
    equipoId: text("equipo_id"),
    base: doublePrecision("base").notNull(),
    avatar: jsonb("avatar")
      .$type<{ estilo: string; semilla: string }>()
      .notNull(),
    apariencia: jsonb("apariencia").$type<Apariencia>(),
    admin: boolean("admin").default(false).notNull(),
    debeCambiarPassword: boolean("debe_cambiar_password")
      .default(false)
      .notNull(),
    /** Email real para recuperar la contraseña (antes `privados/{cedula}`). */
    emailRecuperacion: text("email_recuperacion"),
    /**
     * Contacto opcional del profesor que ven sus alumnos (D378): teléfono móvil venezolano en
     * E.164 sin `+` (`58412…`, abre WhatsApp) y correo. `null` = no lo cargó.
     */
    telefono: text("telefono"),
    emailContacto: text("email_contacto"),
    actualizadoEn: ms("actualizado_en").notNull(),
  },
  (t) => [
    index("usuarios_seccion_idx").on(t.seccion),
    index("usuarios_equipo_idx").on(t.equipoId),
  ],
);

export const historialBase = pgTable(
  "historial_base",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    alumnoId: text("alumno_id").notNull(),
    de: doublePrecision("de").notNull(),
    a: doublePrecision("a").notNull(),
    motivo: text("motivo").notNull(),
    autorId: text("autor_id").notNull(),
    en: ms("en").notNull(),
  },
  (t) => [index("historial_base_alumno_idx").on(t.alumnoId)],
);

export const equipos = pgTable(
  "equipos",
  {
    id: text("id").primaryKey(),
    nombre: text("nombre").notNull(),
    seccion: text("seccion").notNull(),
    tema: text("tema"),
    capitanId: text("capitan_id"),
    logoPath: text("logo_path"),
  },
  (t) => [index("equipos_seccion_idx").on(t.seccion)],
);

export const tareas = pgTable("tareas", {
  id: text("id").primaryKey(),
  titulo: text("titulo").notNull(),
  tipo: text("tipo", { enum: ["individual", "grupal"] }).notNull(),
  secciones: text("secciones").array().notNull(),
  estado: text("estado", {
    enum: ["borrador", "abierta", "evaluada"],
  }).notNull(),
  fechaEntrega: text("fecha_entrega"),
  /** "HH:MM" de Caracas; `null` = al final del día (D352). */
  horaEntrega: text("hora_entrega"),
  premio: text("premio"),
  premioFoto: text("premio_foto"),
  /** `Pregunta[]` o, en un borrador a medias, `PreguntaBorrador[]` (D199). */
  preguntas: jsonb("preguntas").$type<unknown[]>().notNull(),
  importada: boolean("importada").default(false).notNull(),
  autorId: text("autor_id"),
  actualizadoEn: ms("actualizado_en").notNull(),
  decisionesPremio: jsonb("decisiones_premio").$type<DecisionesPremio>(),
  /**
   * Reabierta para algunos (D452): `{ [titularId]: { fecha, hora } }`, cédula en individual y
   * equipo en grupal; `null` = sin prórrogas.
   */
  prorrogas: jsonb("prorrogas").$type<Prorrogas>(),
});

/**
 * `entregas/{tareaId}__{titularId}`. `evaluacionAnterior` va envuelta: SQL NULL = ausente (no hay
 * qué deshacer) y `{ previa: null }` = estaba sin evaluar (D205).
 */
export const entregas = pgTable(
  "entregas",
  {
    id: text("id").primaryKey(),
    tareaId: text("tarea_id").notNull(),
    tipo: text("tipo", { enum: ["individual", "grupal"] }).notNull(),
    titularId: text("titular_id").notNull(),
    titularNombre: text("titular_nombre"),
    seccion: text("seccion").notNull(),
    integrantes: text("integrantes").array().notNull(),
    estado: text("estado", {
      enum: ["borrador", "entregada", "evaluada"],
    }).notNull(),
    respuestas: jsonb("respuestas").$type<Record<string, unknown>>().notNull(),
    enviadaPor: text("enviada_por"),
    enviadaEn: ms("enviada_en"),
    evaluacion: jsonb("evaluacion").$type<Evaluacion>(),
    evaluacionAnterior: jsonb("evaluacion_anterior").$type<{
      previa: Evaluacion | null;
    }>(),
    /** Grupal por partes (D416): quienes tenían pregunta y no entregaron ninguna. */
    sinParte: text("sin_parte").array(),
  },
  (t) => [
    index("entregas_tarea_idx").on(t.tareaId),
    index("entregas_seccion_idx").on(t.seccion),
    index("entregas_integrantes_idx").using("gin", t.integrantes),
  ],
);

/**
 * Preguntas de una grupal que el capitán repartió (D416): una fila por pregunta asignada (sin fila
 * = la responde el capitán). `entregaId` = `idEntrega(tareaId, equipoId)` aunque la entrega aún no
 * exista. Se borran con la tarea o el equipo.
 */
export const partes = pgTable(
  "partes",
  {
    entregaId: text("entrega_id").notNull(),
    preguntaId: text("pregunta_id").notNull(),
    tareaId: text("tarea_id").notNull(),
    equipoId: text("equipo_id").notNull(),
    asignado: text("asignado").notNull(),
    estado: text("estado", {
      // Solo TypeScript: sin CHECK en la base, `tomada` (D461) no pide migración
      enum: ["asignada", "entregada", "aceptada", "devuelta", "tomada"],
    }).notNull(),
    respuesta: jsonb("respuesta").$type<Respuesta>(),
    entregadaEn: ms("entregada_en"),
    actualizadoEn: ms("actualizado_en").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.entregaId, t.preguntaId] }),
    index("partes_tarea_idx").on(t.tareaId),
  ],
);

/**
 * Borrador del capitán de una grupal sin enviar (D544): una fila por entrega (`entregaId` =
 * `idEntrega(tareaId, equipoId)`), con las respuestas en el formato del borrador local (`Borrador`
 * de `lib/tareas`: textos e imágenes ya subidas, solo su ruta). Los integrantes lo ven en solo
 * lectura. `version` sube en cada guardado (versión optimista, D546). Se borra al enviar la
 * entrega, y con la tarea o el equipo en su transacción (sin claves foráneas, como `partes`).
 */
export const borradoresGrupales = pgTable(
  "borradores_grupales",
  {
    entregaId: text("entrega_id").primaryKey(),
    tareaId: text("tarea_id").notNull(),
    equipoId: text("equipo_id").notNull(),
    respuestas: jsonb("respuestas").$type<Borrador>().notNull(),
    /** Cédula de quien guardó: no sale al cliente (se muestra su nombre). */
    actualizadoPor: text("actualizado_por").notNull(),
    actualizadoEn: ms("actualizado_en").notNull(),
    version: integer("version").notNull(),
  },
  (t) => [
    index("borradores_grupales_tarea_idx").on(t.tareaId),
    index("borradores_grupales_equipo_idx").on(t.equipoId),
  ],
);

/**
 * Entrega ideal de una tarea (D430): una por tarea. O es la entrega de un alumno o equipo
 * (`entregaId`, con 20 / 20) o la respuesta que escribe el profe (`respuestas`, un texto por
 * pregunta); nunca las dos. `nota` = por qué es ideal (obligatoria); `notas` = por pregunta. Sin
 * claves foráneas: eliminar la entrega o la tarea la borra en su transacción (D531) y la lectura
 * tolera las que quedaron de antes (D434). `actualizadoEn` es su versión al guardar (D532).
 */
export const ideales = pgTable(
  "ideales",
  {
    tareaId: text("tarea_id").primaryKey(),
    entregaId: text("entrega_id"),
    respuestas: jsonb("respuestas").$type<Record<string, string>>(),
    nota: text("nota").notNull(),
    notas: jsonb("notas").$type<Record<string, string>>().notNull(),
    autorId: text("autor_id").notNull(),
    actualizadoEn: ms("actualizado_en").notNull(),
  },
  (t) => [
    check(
      "ideales_una_forma",
      sql`(${t.entregaId} IS NULL) <> (${t.respuestas} IS NULL)`,
    ),
  ],
);

export const ajustes = pgTable(
  "ajustes",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    destino: text("destino", { enum: ["alumno", "equipo"] }).notNull(),
    destinoId: text("destino_id").notNull(),
    seccion: text("seccion").notNull(),
    motivoId: text("motivo_id").notNull(),
    motivo: text("motivo").notNull(),
    valor: doublePrecision("valor").notNull(),
    nota: text("nota"),
    autorId: text("autor_id"),
    en: ms("en").notNull(),
    anulaA: text("anula_a"),
  },
  (t) => [
    index("ajustes_seccion_idx").on(t.seccion),
    index("ajustes_destino_idx").on(t.destinoId),
  ],
);

/** `ranking/{seccion}`: puntos derivados, una fila por sección (D174). */
export const ranking = pgTable("ranking", {
  seccion: text("seccion").primaryKey(),
  alumnos: jsonb("alumnos").$type<RankingSeccion["alumnos"]>().notNull(),
  equipos: jsonb("equipos").$type<RankingSeccion["equipos"]>().notNull(),
  actualizadoEn: ms("actualizado_en").notNull(),
});

/** `recuperaciones/{cedula}`: instantes de los envíos del enlace (límite, D187). */
export const recuperaciones = pgTable("recuperaciones", {
  cedula: text("cedula").primaryKey(),
  envios: jsonb("envios").$type<number[]>().notNull(),
});

/** `presencia/{alumno}/editores/{profe}` (D275): quién tiene abierto «Editar alumno». */
export const presencia = pgTable(
  "presencia",
  {
    alumnoId: text("alumno_id").notNull(),
    profeId: text("profe_id").notNull(),
    nombre: text("nombre").notNull(),
    desde: ms("desde").notNull(),
    latido: ms("latido").notNull(),
  },
  (t) => [primaryKey({ columns: [t.alumnoId, t.profeId] })],
);

/** `operaciones/{opId}`: envíos de la cola sin conexión ya procesados (D293). */
export const operaciones = pgTable("operaciones", {
  id: text("id").primaryKey(),
  datos: jsonb("datos").$type<Record<string, unknown>>().notNull(),
});

/**
 * Suscripciones Web Push del aviso de tarea nueva (D335): una por navegador (`endpoint`), varias
 * por alumno. Se van con el alumno y cuando el servicio de push responde 404/410.
 */
export const pushSuscripciones = pgTable(
  "push_suscripciones",
  {
    endpoint: text("endpoint").primaryKey(),
    cedula: text("cedula")
      .notNull()
      .references(() => usuarios.cedula, { onDelete: "cascade" }),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    creadoEn: ms("creado_en").notNull(),
  },
  (t) => [index("push_suscripciones_cedula_idx").on(t.cedula)],
);

/** `config/{doc}`: hoy solo `secciones` (D317). */
export const config = pgTable("config", {
  id: text("id").primaryKey(),
  datos: jsonb("datos").$type<Record<string, unknown>>().notNull(),
});

/**
 * % orientativo de uso de IA de una respuesta de texto (D425–D429): uno por respuesta, se
 * sobrescribe. `huella` = SHA-256 del texto analizado (si el alumno lo edita, queda desactualizado).
 * Sin claves foráneas: eliminar la entrega o su tarea borra sus filas en esa transacción (D531) y
 * quien lee tolera las que quedaron de antes.
 */
export const analisisIa = pgTable(
  "analisis_ia",
  {
    entregaId: text("entrega_id").notNull(),
    preguntaId: text("pregunta_id").notNull(),
    porcentaje: integer("porcentaje").notNull(),
    huella: text("huella").notNull(),
    modelo: text("modelo").notNull(),
    autorId: text("autor_id").notNull(),
    analizadoEn: ms("analizado_en").notNull(),
  },
  (t) => [primaryKey({ columns: [t.entregaId, t.preguntaId] })],
);
