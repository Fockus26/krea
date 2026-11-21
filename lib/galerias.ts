/**
 * Las galerías internas (/secciones, /componentes, /tokens, /estados, /correos) solo existen en
 * desarrollo y en las vistas previas (donde César revisa sin servidor local); en
 * producción responden 404 (D162; QA versión 1, D-A4). En kit-deploy los layouts se prerenderizan
 * en el build, que solo ve las `NEXT_PUBLIC_*` del entorno: el set «preview» lleva
 * `NEXT_PUBLIC_GALERIAS=1` (D580).
 */
export function galeriaVisible(env: {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  NEXT_PUBLIC_GALERIAS?: string;
}): boolean {
  return (
    env.NODE_ENV === "development" ||
    env.VERCEL_ENV === "preview" ||
    env.NEXT_PUBLIC_GALERIAS === "1"
  );
}
