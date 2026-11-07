import type { DicebearEstilo } from "@/lib/dicebear";

/** Datos del usuario que pintan la tarjeta lateral y el avatar de la topbar. */
export type NavUsuario = {
  nombre: string;
  estilo: DicebearEstilo;
  seed: string;
  /** Profesor admin de la sesión (D231): la navegación suma «Profesores». */
  admin?: boolean;
};

/** Ruta activa: la dan las páginas por prop o los envoltorios `Route*` con `usePathname()`. */
export type NavRoute = { pathname: string | null };
