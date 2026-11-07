import type { Rol } from "@/lib/layout";

/*
 * Ítems de navegación por rol y superficie (HANDOFF §2.7 y §2.13). Puro: sin React ni lucide.
 * `icon` es una clave que components/layout/nav-icon.tsx traduce al ícono; las constantes
 * viven aquí y no en un archivo cliente (Next 16 rompe el prerender si no).
 */
export type NavIconKey =
  | "inicio"
  | "notas"
  | "tareas"
  | "ranking"
  | "equipo"
  | "perfil"
  | "panel"
  | "evaluar"
  | "alumnos"
  | "equipos"
  | "puntos"
  | "premios"
  | "profesores";

export type NavSurface = "lateral" | "inferior" | "menu";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconKey;
  /** `exact`: solo esa ruta (raíz de cada rol). `prefix`: también sus subrutas. */
  match: "exact" | "prefix";
  /** Superficies donde aparece. */
  on: readonly NavSurface[];
  /** Solo para el profesor admin (D231). */
  soloAdmin?: true;
};

/** Pantalla Profesores del admin (D233). */
export const PROFESORES_HREF = "/profe/profesores";

/** Perfil del estudiante (avatar de la topbar y tarjeta de usuario). */
export const PERFIL_HREF = "/perfil";
/** Perfil del profesor: Apariencia y Seguridad (decisión de César, fase 05). */
export const PERFIL_PROFE_HREF = "/profe/perfil";

const ESTUDIANTE: readonly NavItem[] = [
  {
    id: "inicio",
    label: "Inicio",
    href: "/",
    icon: "inicio",
    match: "exact",
    on: ["lateral", "inferior"],
  },
  {
    id: "notas",
    label: "Notas",
    href: "/notas",
    icon: "notas",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "tareas",
    label: "Tareas",
    href: "/tareas",
    icon: "tareas",
    match: "prefix",
    on: ["lateral"],
  },
  {
    id: "ranking",
    label: "Ranking",
    href: "/ranking",
    icon: "ranking",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "equipo",
    label: "Equipo",
    href: "/equipo",
    icon: "equipo",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "perfil",
    label: "Perfil",
    href: "/perfil",
    icon: "perfil",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
];

const PROFESOR: readonly NavItem[] = [
  {
    id: "panel",
    label: "Panel",
    href: "/profe",
    icon: "panel",
    match: "exact",
    on: ["lateral", "inferior"],
  },
  {
    id: "evaluar",
    label: "Evaluar",
    href: "/profe/evaluar",
    icon: "evaluar",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "tareas",
    label: "Tareas",
    href: "/profe/tareas",
    icon: "tareas",
    match: "prefix",
    on: ["lateral", "menu"],
  },
  {
    id: "alumnos",
    label: "Alumnos",
    href: "/profe/alumnos",
    icon: "alumnos",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "equipos",
    label: "Equipos",
    href: "/profe/equipos",
    icon: "equipos",
    match: "prefix",
    on: ["lateral", "menu"],
  },
  {
    id: "puntos",
    label: "Puntos",
    href: "/profe/puntos",
    icon: "puntos",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    // Ranking del profe con 5A/5C dentro de su grupo (decisión de César, fase 05)
    id: "ranking",
    label: "Ranking",
    href: "/profe/ranking",
    icon: "ranking",
    match: "prefix",
    on: ["lateral", "inferior"],
  },
  {
    id: "premios",
    label: "Premios",
    href: "/profe/premios",
    icon: "premios",
    match: "prefix",
    on: ["lateral", "menu"],
  },
  {
    // Solo el admin (D231, D233): tras Premios, como las secciones que no caben en la barra
    // inferior (D132). PROVISIONAL: no está en el handoff (CONTENT_CHECKLIST fila 137)
    id: "profesores",
    label: "Profesores",
    href: PROFESORES_HREF,
    icon: "profesores",
    match: "prefix",
    on: ["lateral", "menu"],
    soloAdmin: true,
  },
  {
    // En la lateral, Perfil es la tarjeta de usuario; en < lg, la hoja Menú (D132). PROVISIONAL:
    // el handoff no pone Perfil en el Menú (CONTENT_CHECKLIST fila 97)
    id: "perfil",
    label: "Perfil",
    href: PERFIL_PROFE_HREF,
    icon: "perfil",
    match: "prefix",
    on: ["menu"],
  },
];

/**
 * Ítems de un rol para una superficie, en el orden del handoff. Los `soloAdmin` solo con
 * `admin` (el profesor admin de la sesión, D231).
 */
export function navItems(
  rol: Rol,
  surface: NavSurface,
  { admin = false }: { admin?: boolean } = {},
): readonly NavItem[] {
  const items = rol === "profesor" ? PROFESOR : ESTUDIANTE;
  return items.filter(
    (item) => item.on.includes(surface) && (!item.soloAdmin || admin),
  );
}

/** Perfil por rol (tarjeta de usuario, avatar de la topbar y hoja Menú del profe; D132). */
export function perfilHref(rol: Rol): string {
  return rol === "profesor" ? PERFIL_PROFE_HREF : PERFIL_HREF;
}

/** Etiqueta de rol de la tarjeta de usuario. */
export function rolLabel(rol: Rol): string {
  return rol === "profesor" ? "Profesor" : "Estudiante";
}

/**
 * ¿`pathname` cae dentro del ítem? Ruta exacta para la raíz de cada rol (`/`, `/profe`) y
 * prefijo con frontera de segmento para el resto: `/notas/x` activa Notas, `/notasx` no.
 * Ignora la query, el hash y la barra final.
 */
export function isActive(
  item: Pick<NavItem, "href" | "match">,
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  const path = normalize(pathname);
  const href = normalize(item.href);
  if (item.match === "exact") return path === href;
  return path === href || path.startsWith(`${href}/`);
}

function normalize(path: string): string {
  const clean = path.split(/[?#]/)[0] ?? "";
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean || "/";
}

/** Texto accesible del contador de Evaluar; `null` si no hay nada que anunciar. */
export function counterLabel(count: number | null | undefined): string | null {
  if (count == null || count <= 0) return null;
  return `${count} por evaluar`;
}
