// Recarga tras un deploy (D438). Una pestaña abierta con el build anterior (o una página vieja que
// sirvió el SW, D291) pide un chunk que ya no existe o una Server Action con un id que el servidor
// nuevo no conoce. Eso no se arregla con «Reintentar» (`retry` vuelve a pintar con el mismo JS):
// hace falta UNA recarga completa. La marca en `sessionStorage` evita el bucle: si vuelve a fallar
// antes de VENTANA_RECARGA_MS, sale la pantalla de error normal.
//
// Cómo se reconocen (leído en Next 16, no inventado):
// - Chunk: Turbopack lanza `name = "ChunkLoadError"`, «Failed to load chunk …»; webpack, el mismo
//   nombre con «Loading chunk … failed» (o «Loading CSS chunk …»).
// - Server Action: el cliente lanza `UnrecognizedActionError` («Server Action "…" was not found on
//   the server», enlace a failed-to-find-server-action); el servidor registra «Failed to find
//   Server Action».

export const CLAVE_RECARGA = "krea:recarga-deploy";

/** Si la recarga vuelve a fallar antes de esto, no se recarga otra vez. */
export const VENTANA_RECARGA_MS = 30_000;

const NOMBRES = new Set(["ChunkLoadError", "UnrecognizedActionError"]);

const MENSAJES = [
  /Failed to load chunk/i,
  /Loading (CSS )?chunk \S+ failed/i,
  /Failed to find Server Action/i,
  /failed-to-find-server-action/i,
  /Server Action "[^"]*" was not found on the server/i,
];

/** ¿El error es de un build desfasado (chunk o Server Action que ya no existen)? */
export function esErrorDeDeploy(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  if (typeof name === "string" && NOMBRES.has(name)) return true;
  return typeof message === "string" && MENSAJES.some((r) => r.test(message));
}

/**
 * ¿Recargar ahora? Solo un error de deploy, y solo si no hubo otra recarga por lo mismo en los
 * últimos VENTANA_RECARGA_MS (`ultimoIntento`: la marca guardada, o `null`).
 */
export function debeRecargar(
  error: unknown,
  ultimoIntento: number | null,
  ahora: number,
): boolean {
  if (!esErrorDeDeploy(error)) return false;
  return (
    ultimoIntento === null ||
    !Number.isFinite(ultimoIntento) ||
    ahora - ultimoIntento >= VENTANA_RECARGA_MS ||
    ahora < ultimoIntento
  );
}

/**
 * En el navegador: recarga la página completa si toca (`true`). Sin `sessionStorage` (modo
 * privado estricto, bloqueado) no recarga: sin la marca no habría freno para el bucle.
 */
export function recargarSiEsDeploy(error: unknown): boolean {
  if (!esErrorDeDeploy(error)) return false;
  const ahora = Date.now();
  try {
    const guardado = window.sessionStorage.getItem(CLAVE_RECARGA);
    const ultimo = guardado === null ? null : Number(guardado);
    if (!debeRecargar(error, ultimo, ahora)) return false;
    window.sessionStorage.setItem(CLAVE_RECARGA, String(ahora));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
