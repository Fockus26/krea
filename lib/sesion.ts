// Sesión y acceso por rol (fase 07, D180–D182). Puro: lo usan el proxy, el DAL y las pruebas.
import type { RolUsuario, SeccionId } from "@/lib/modelo";

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
};

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

/**
 * Qué rol exige una ruta: `estudiante`, `profesor`, `invitado` (Ingresar y Recuperar: con sesión
 * se va a su inicio) o `null` (pública: galerías, estados, /salir, archivos).
 */
export function accesoDeRuta(ruta: string): RolUsuario | "invitado" | null {
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
  if (acceso === "invitado") return sesion ? inicioDe(sesion.rol) : null;
  if (!sesion) return RUTA_INGRESAR;
  return sesion.rol === acceso ? null : inicioDe(sesion.rol);
}

/** Claims del token → sesión; `null` si faltan o no son válidos (cuenta sin rol = sin acceso). */
export function sesionDeClaims(
  uid: string,
  claims: Record<string, unknown>,
): Sesion | null {
  const { rol, seccion, equipoId } = claims;
  if (rol !== "estudiante" && rol !== "profesor") return null;
  if (!/^\d{7,9}$/.test(uid)) return null;
  const sec = seccion === "5A" || seccion === "5C" ? seccion : null;
  if (rol === "estudiante" && sec === null) return null;
  return {
    uid,
    rol,
    seccion: sec,
    equipoId: typeof equipoId === "string" && equipoId ? equipoId : null,
  };
}

/** ¿El login del token es reciente? `authTime` en segundos (claim `auth_time`). */
export function loginReciente(authTimeSeg: number, ahora: number): boolean {
  return ahora - authTimeSeg * 1000 < LOGIN_RECIENTE_MS;
}
