// Lado de la página del service worker (D291): registrarlo (solo en producción: en `next dev`
// los archivos cambian sin hash y una caché vieja confunde) y avisarle de la sesión.

export const RUTA_SW = "/sw.js";

function hayServiceWorker(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

export function registrarServiceWorker() {
  if (!hayServiceWorker() || process.env.NODE_ENV !== "production") return;
  navigator.serviceWorker
    .register(RUTA_SW, { scope: "/", updateViaCache: "none" })
    .catch(() => {
      // Sin service worker la app funciona igual, solo que no sin conexión
    });
}

async function avisar(
  mensaje: { tipo: "usuario"; usuario: string } | { tipo: "salir" },
) {
  if (!hayServiceWorker()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    (reg?.active ?? navigator.serviceWorker.controller)?.postMessage(mensaje);
  } catch {
    // Nada que avisar
  }
}

/** La sesión de esta página: si es otra persona que la de las páginas guardadas, se vacían. */
export function avisarUsuarioServiceWorker(usuario: string) {
  void avisar({ tipo: "usuario", usuario });
}

/** Al cerrar sesión: fuera las páginas guardadas (llevan notas y datos de quien sale). */
export async function vaciarPaginasGuardadas() {
  await avisar({ tipo: "salir" });
  try {
    const nombres = await caches.keys();
    await Promise.all(
      nombres
        .filter((n) => n.startsWith("krea-paginas-"))
        .map((n) => caches.delete(n)),
    );
  } catch {
    // Sin Cache API (contexto no seguro): no hay nada guardado
  }
}
