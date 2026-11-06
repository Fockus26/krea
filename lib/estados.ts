import type { Rol } from "@/lib/layout";

/*
 * Pantallas de estado (fase 06, HANDOFF §5b). Puro: sin React ni DOM.
 * Familia: 404 (con sesión estudiante / profesor, sin sesión), 500 (con código / sin código) y
 * sin conexión. Mantenimiento no aplica en v1 (§5b, D163).
 */

/** Sesión que decide la cabecera y las acciones del 404. `null` = sin sesión. */
export type SesionEstado = Rol | null;

/** Prefijos de las rutas del estudiante (grupo `app/(estudiante)`). */
const RUTAS_ESTUDIANTE = [
  "/notas",
  "/tareas",
  "/equipo",
  "/ranking",
  "/perfil",
];

const empiezaPor = (pathname: string, prefijo: string) =>
  pathname === prefijo || pathname.startsWith(`${prefijo}/`);

/**
 * Sesión supuesta por la dirección pedida, mientras no hay sesión real (D160, provisional hasta la
 * fase 07): `/profe…` → profesor; las rutas del estudiante (y `/`) → estudiante; lo demás → sin
 * sesión. En la fase 07 lo sustituye la sesión de Firebase Auth.
 */
export function sesionPorRuta(pathname: string): SesionEstado {
  if (empiezaPor(pathname, "/profe")) return "profesor";
  if (pathname === "/" || RUTAS_ESTUDIANTE.some((p) => empiezaPor(pathname, p)))
    return "estudiante";
  return null;
}

export type AccionEstado = { label: string; href: string };

/** Las dos acciones del 404 por sesión (§5b): «Ir al inicio» + la segunda propia de cada caso. */
export function accionesNotFound(
  sesion: SesionEstado,
): readonly [AccionEstado, AccionEstado] {
  if (sesion === "profesor")
    return [
      { label: "Ir al inicio", href: "/profe" },
      { label: "Evaluar", href: "/profe/evaluar" },
    ];
  if (sesion === "estudiante")
    return [
      { label: "Ir al inicio", href: "/" },
      { label: "Mis notas", href: "/notas" },
    ];
  return [
    // Sin sesión, «/» lleva a Ingresar en cuanto haya sesión real (fase 07)
    { label: "Ir al inicio", href: "/" },
    { label: "Iniciar sesión", href: "/ingresar" },
  ];
}

/** Inicio de cada sesión (destino de «Ir al inicio» del 500). */
export const inicioDe = (sesion: SesionEstado): string =>
  accionesNotFound(sesion)[0].href;

const HEX6 = /^[0-9A-F]{6}/;

/**
 * Código de error para soporte `KR-{status}-{6 hex}` (§5b) a partir del `digest` de Next (id del
 * error en el registro del servidor; D161): sus 6 primeros caracteres en mayúsculas, que así se
 * buscan en el registro. Sin `digest` (o si no empieza por 6 hex) no hay código: variante «sin código».
 */
export function codigoError(
  status: number,
  digest?: string | null,
): string | null {
  const prefijo = digest?.trim().toUpperCase().match(HEX6)?.[0];
  return prefijo ? `KR-${status}-${prefijo}` : null;
}

/** El `digest` de un valor lanzado, si lo trae (los de Server Components lo traen). */
export function digestDe(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("digest" in error))
    return null;
  const { digest } = error as { digest: unknown };
  return typeof digest === "string" ? digest : null;
}

const dos = (n: number) => String(n).padStart(2, "0");

/** «25/10/2026, 4:22 p. m.» (es-VE, hora local), sin depender de los datos ICU del navegador. */
export function formatFechaHora(fecha: Date): string {
  const h = fecha.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const sufijo = h < 12 ? "a. m." : "p. m.";
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()}, ${h12}:${dos(fecha.getMinutes())} ${sufijo}`;
}

/** «4:20 p. m.» */
export const formatHora = (fecha: Date): string =>
  formatFechaHora(fecha).split(", ")[1] ?? "";

/** «hoy, 4:20 p. m.» si es el mismo día; si no, la fecha completa (línea «Última actualización»). */
export function formatUltimaActualizacion(fecha: Date, ahora: Date): string {
  const mismoDia =
    fecha.getFullYear() === ahora.getFullYear() &&
    fecha.getMonth() === ahora.getMonth() &&
    fecha.getDate() === ahora.getDate();
  const completa = formatFechaHora(fecha);
  return mismoDia ? `hoy, ${formatHora(fecha)}` : completa;
}

/* ---------- Banner sin conexión (D164) ---------- */

/** Toast al volver la red (§5b): 3 s. */
export const TOAST_EN_LINEA_MS = 3000;

/**
 * «Sin conexión. Ves tus notas de las 4:20 p. m.» (§5b). El profesor no tiene notas propias: «los
 * datos» (fila 115). `hora` = la de los datos que se ven (fase 07: la de la caché de Firestore).
 */
export function mensajeSinConexion(rol: Rol, hora: Date): string {
  const que = rol === "profesor" ? "los datos" : "tus notas";
  return `Sin conexión. Ves ${que} de las ${formatHora(hora)}`;
}

/* ---------- Carga (D167) ---------- */

/** Pasado este tiempo, bajo el skeleton: «Está tardando más de lo normal» + Reintentar (Vacios.dc.html). */
export const CARGA_LENTA_MS = 8000;

/* ---------- Galería /estados (D162) ---------- */

export const PANTALLAS_ESTADO = [
  { id: "404-estudiante", label: "404 · con sesión · estudiante" },
  { id: "404-profesor", label: "404 · con sesión · profesor" },
  { id: "404-sin-sesion", label: "404 · sin sesión" },
  { id: "500-codigo", label: "500 · con código" },
  { id: "500-sin-codigo", label: "500 · sin código" },
  { id: "sin-conexion", label: "Sin conexión" },
  { id: "sin-conexion-hora", label: "Sin conexión · con hora" },
  { id: "banner-sin-conexion", label: "Banner sin conexión" },
  { id: "carga-estudiante", label: "Carga · estudiante" },
  { id: "carga-profesor", label: "Carga · profesor" },
  { id: "errores-en-pantalla", label: "Errores en pantalla" },
] as const;

export type PantallaEstado = (typeof PANTALLAS_ESTADO)[number]["id"];

/** `?screen=` válido, o la primera pantalla. */
export function pantallaDe(
  valor: string | string[] | undefined,
): PantallaEstado {
  const v = Array.isArray(valor) ? valor[0] : valor;
  return PANTALLAS_ESTADO.find((p) => p.id === v)?.id ?? PANTALLAS_ESTADO[0].id;
}

/** La galería de estados sigue la regla de todas las galerías internas (lib/galerias.ts). */
export { galeriaVisible as galeriaEstadosVisible } from "./galerias";
