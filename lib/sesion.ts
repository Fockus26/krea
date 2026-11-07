// Sesión y acceso por rol (fase 07, D180–D182). Puro: lo usan el proxy, el DAL y las pruebas.
import type { RolUsuario, SeccionId } from "@/lib/modelo";
import { esCodigoSeccion } from "@/lib/secciones";

/** Cookie de sesión de Firebase (httpOnly, la crea el Admin SDK). */
export const COOKIE_SESION = "__session";
/** Duración de la sesión: 5 días (Firebase permite hasta 14). */
export const SESION_MS = 5 * 24 * 60 * 60 * 1000;
/** El idToken para crear la sesión tiene que venir de un login de hace menos de 5 minutos. */
export const LOGIN_RECIENTE_MS = 5 * 60 * 1000;

export const RUTA_INGRESAR = "/ingresar";

export type Sesion = {
  uid: string;
  rol: RolUsuario;
  seccion: SeccionId | null;
  equipoId: string | null;
  /** Profesor admin (D231): gestiona a los demás profesores. Ausente = no. */
  admin?: true;
  /** Entró con la contraseña temporal: solo puede crear la suya (D232). Ausente = no. */
  debeCambiarPassword?: true;
};

/** «Crea tu contraseña»: única ruta de una cuenta con contraseña temporal (D232). */
export const RUTA_CREAR_PASSWORD = "/crear-contrasena";

/** Inicio de cada rol. */
export function inicioDe(rol: RolUsuario): string {
  return rol === "profesor" ? "/profe" : "/";
}

const EMPIEZA = (ruta: string, prefijo: string) =>
  ruta === prefijo || ruta.startsWith(`${prefijo}/`);

/** Rutas del estudiante (grupo `(estudiante)`). */
const RUTAS_ESTUDIANTE = [
  "/notas",
  "/equipo",
  "/ranking",
  "/perfil",
  "/tareas",
];

/** Nueva contraseña del enlace del correo: se abre con o sin sesión (D188). */
export const RUTA_NUEVA_PASSWORD = "/recuperar/nueva";

/**
 * Qué rol exige una ruta: `estudiante`, `profesor`, `invitado` (Ingresar y Recuperar: con sesión
 * se va a su inicio), `sesion` («Crea tu contraseña»: cualquier rol, solo con contraseña temporal,
 * D232) o `null` (pública: galerías, estados, /salir, archivos, y la nueva contraseña del enlace,
 * que vale aunque haya una sesión abierta en ese navegador, D188).
 */
export function accesoDeRuta(
  ruta: string,
): RolUsuario | "invitado" | "sesion" | null {
  if (EMPIEZA(ruta, RUTA_NUEVA_PASSWORD)) return null;
  if (EMPIEZA(ruta, RUTA_CREAR_PASSWORD)) return "sesion";
  if (EMPIEZA(ruta, "/profe")) return "profesor";
  if (ruta === "/" || RUTAS_ESTUDIANTE.some((p) => EMPIEZA(ruta, p)))
    return "estudiante";
  if (EMPIEZA(ruta, RUTA_INGRESAR) || EMPIEZA(ruta, "/recuperar"))
    return "invitado";
  return null;
}

/** Decisión del proxy: `null` deja pasar; si no, a dónde redirigir. */
export function redireccion(
  ruta: string,
  sesion: Sesion | null,
): string | null {
  const acceso = accesoDeRuta(ruta);
  if (acceso === null) return null;
  if (acceso === "invitado") return sesion ? destinoDe(sesion) : null;
  if (!sesion) return RUTA_INGRESAR;
  // Con contraseña temporal no carga nada de su rol hasta crear la suya (D232)
  if (acceso === "sesion")
    return sesion.debeCambiarPassword ? null : inicioDe(sesion.rol);
  if (sesion.debeCambiarPassword) return RUTA_CREAR_PASSWORD;
  return sesion.rol === acceso ? null : inicioDe(sesion.rol);
}

/** A dónde va una sesión recién abierta: su inicio, o «Crea tu contraseña» si es temporal (D232). */
export function destinoDe(sesion: Sesion): string {
  return sesion.debeCambiarPassword
    ? RUTA_CREAR_PASSWORD
    : inicioDe(sesion.rol);
}

/** Claims del token → sesión; `null` si faltan o no son válidos (cuenta sin rol = sin acceso). */
export function sesionDeClaims(
  uid: string,
  claims: Record<string, unknown>,
): Sesion | null {
  const { rol, seccion, equipoId, admin, debeCambiarPassword } = claims;
  if (rol !== "estudiante" && rol !== "profesor") return null;
  if (!/^\d{7,9}$/.test(uid)) return null;
  // Cualquier código «año + letra» (D317): el catálogo no se lee en el proxy
  const sec = esCodigoSeccion(seccion) ? seccion : null;
  if (rol === "estudiante" && sec === null) return null;
  return {
    uid,
    rol,
    seccion: sec,
    equipoId: typeof equipoId === "string" && equipoId ? equipoId : null,
    // Solo un profesor puede ser admin (D231); las marcas van solo cuando son `true`
    ...(rol === "profesor" && admin === true ? { admin: true } : {}),
    ...(debeCambiarPassword === true ? { debeCambiarPassword: true } : {}),
  };
}

/** ¿El login del token es reciente? `authTime` en segundos (claim `auth_time`). */
export function loginReciente(authTimeSeg: number, ahora: number): boolean {
  return ahora - authTimeSeg * 1000 < LOGIN_RECIENTE_MS;
}
