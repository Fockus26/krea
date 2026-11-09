/**
 * Las galerías internas (/secciones, /componentes, /tokens, /estados, /correos) solo existen en
 * desarrollo y en las vistas previas de Vercel (donde César revisa sin servidor local); en
 * producción responden 404 (D162; QA versión 1, D-A4).
 */
export function galeriaVisible(env: {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
}): boolean {
  return env.NODE_ENV === "development" || env.VERCEL_ENV === "preview";
}
