// Identidad y URL base del sitio. El dominio final está pendiente (PROJECT_CONTEXT):
// NEXT_PUBLIC_SITE_URL manda; en Vercel cae al dominio de producción del proyecto.

export const SITE_NAME = "KREA";
export const SITE_TITLE = "KREA — Escuela Creativa";
// Bajada de la plantilla Open Graph (HANDOFF §5).
export const SITE_DESCRIPTION = "Portal de la Escuela Creativa · 5.º año";

// Colores de marca del SO (manifest, viewport, OG): el SO no conoce el acento (HANDOFF §8).
export const BRAND_BLUE = "#295AC3";
export const BRAND_BG = "#F6F4FA";

// Fondo oscuro para themeColor: mismo valor que --bg oscuro de globals.css (D024).
export const BRAND_BG_DARK = "#14121a";

// Colores fijos de la plantilla OG (HANDOFF §5); la imagen no conoce el acento ni el tema.
export const OG_COLORS = {
  SPLASH: "#00E5F5",
  INK: "#221D2B",
  MUTED: "#5E5869",
  GRADE_INK: "#111111",
  PILL_HIGH: "#17A127",
  PILL_LOW: "#F5D400",
  PILL_MID: "#57C110",
} as const;

type SiteEnv = Record<string, string | undefined>;

const FALLBACK_URL = "http://localhost:3000";

export function resolveSiteUrl(env: SiteEnv = process.env): URL {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return new URL(explicit);
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return new URL(`https://${vercel}`);
  return new URL(FALLBACK_URL);
}

export const SITE_URL = resolveSiteUrl();

// Anti-parpadeo (D015; app/layout.tsx y app/global-error.tsx): aplica tema y acento guardados antes del primer pintado.
// "system" (o sin valor) = sin data-theme; el CSS sigue prefers-color-scheme.
export const THEME_SCRIPT = `(function(){try{var d=document.documentElement,s=localStorage,t=s.getItem("krea-theme"),a=s.getItem("krea-accent");if(t==="light"||t==="dark")d.setAttribute("data-theme",t);if(a==="rojo"||a==="verde"||a==="morado"||a==="azul")d.setAttribute("data-accent",a)}catch(e){}})()`;
