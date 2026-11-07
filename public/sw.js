// Service worker de KREA (D291): leer sin conexión lo ya visitado. Propio y sin librería: tres
// cachés y reglas cortas, para poder revisarlo entero.
//
// - `/_next/static/*` (archivos con hash, no cambian): primero la caché.
// - Páginas (navegaciones): primero la red; si no responde en ESPERA_RED_MS o no hay red, la copia
//   guardada; si no hay copia, la página «Sin conexión». Solo se guardan respuestas 200 propias,
//   sin redirección (una página que mandó a /ingresar no se guarda).
// - Payloads RSC (`RSC: 1`, `?_rsc=`), Server Actions (POST / `Next-Action`), /api y todo lo de
//   otro origen (URLs firmadas de B2, Firebase) NO pasan por aquí: sin red, Next cae solo a una
//   navegación completa, y esa sí la sirve la caché.
// - Por usuario: la caché de páginas se vacía al cerrar sesión, al ir a /ingresar, cuando una
//   página redirige a /ingresar y cuando la app avisa que la sesión es de otra persona.
const VERSION = "v1";
const ESTATICOS = `krea-estaticos-${VERSION}`;
const PAGINAS = `krea-paginas-${VERSION}`;
const META = `krea-meta-${VERSION}`;
const CACHES = [ESTATICOS, PAGINAS, META];

const SIN_CONEXION = "/sin-conexion";
const CLAVE_USUARIO = "/__krea/usuario";
const ESPERA_RED_MS = 6000;
const MAX_ESTATICOS = 400;
const MAX_PAGINAS = 60;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await precargarSinConexion().catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres
          .filter((n) => n.startsWith("krea-") && !CACHES.includes(n))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const datos = event.data;
  if (!datos || typeof datos !== "object") return;
  if (datos.tipo === "usuario")
    event.waitUntil(fijarUsuario(String(datos.usuario ?? "")));
  if (datos.tipo === "salir") event.waitUntil(vaciarPaginas());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (
    req.headers.has("RSC") ||
    req.headers.has("Next-Action") ||
    req.headers.has("Next-Router-Prefetch") ||
    url.searchParams.has("_rsc")
  )
    return;
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(primeroCache(req));
    return;
  }
  if (req.mode === "navigate") {
    event.respondWith(navegar(event, url));
    return;
  }
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(copiaYActualiza(event, req));
  }
});

/* ---------- Estrategias ---------- */

async function primeroCache(req) {
  const cache = await caches.open(ESTATICOS);
  const guardada = await cache.match(req);
  if (guardada) return guardada;
  const res = await fetch(req);
  if (res.ok && res.type === "basic") {
    await guardar(cache, req, res.clone());
    void recortar(ESTATICOS, MAX_ESTATICOS);
  }
  return res;
}

async function copiaYActualiza(event, req) {
  const cache = await caches.open(ESTATICOS);
  const guardada = await cache.match(req);
  const red = fetch(req).then(async (res) => {
    if (res.ok && res.type === "basic") await guardar(cache, req, res.clone());
    return res;
  });
  if (guardada) {
    event.waitUntil(red.catch(() => {}));
    return guardada;
  }
  return red;
}

async function navegar(event, url) {
  const clave = url.pathname + url.search;
  // Ingresar o salir: lo guardado era de la sesión que termina
  if (url.pathname.startsWith("/ingresar") || url.pathname.startsWith("/salir"))
    await vaciarPaginas();
  const cache = await caches.open(PAGINAS);
  const red = fetch(event.request).then(async (res) => {
    const destino = new URL(res.url || url.href);
    if (res.redirected && destino.pathname.startsWith("/ingresar")) {
      await vaciarPaginas();
    } else if (
      res.status === 200 &&
      res.type === "basic" &&
      !res.redirected &&
      esHtml(res)
    ) {
      await guardar(cache, clave, res.clone());
      void recortar(PAGINAS, MAX_PAGINAS);
    }
    return res;
  });
  const guardada = await cache.match(clave, { ignoreVary: true });
  if (!guardada) {
    try {
      return await red;
    } catch {
      return (await paginaSinConexion()) ?? Response.error();
    }
  }
  // Hay copia: la red tiene unos segundos; si no llega (o falla), la copia. La red sigue y
  // deja la página al día para la próxima vez.
  event.waitUntil(red.catch(() => {}));
  const espera = new Promise((resolve) =>
    setTimeout(() => resolve(guardada), ESPERA_RED_MS),
  );
  try {
    const res = await Promise.race([red, espera]);
    return res.status >= 500 ? guardada : res;
  } catch {
    return guardada;
  }
}

/* ---------- Página «Sin conexión» ---------- */

async function precargarSinConexion() {
  const res = await fetch(SIN_CONEXION, { cache: "reload" });
  if (!res.ok) return;
  const html = await res.clone().text();
  const meta = await caches.open(META);
  await meta.put(SIN_CONEXION, res);
  // Su CSS y su JS, para que se vea bien aunque nunca se haya visitado otra página
  const estaticos = [
    ...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? []),
  ];
  const cache = await caches.open(ESTATICOS);
  await Promise.allSettled(estaticos.map((u) => cache.add(u)));
}

async function paginaSinConexion() {
  const meta = await caches.open(META);
  return meta.match(SIN_CONEXION);
}

/* ---------- Usuario ---------- */

async function fijarUsuario(usuario) {
  const meta = await caches.open(META);
  const previo = await meta.match(CLAVE_USUARIO);
  const anterior = previo ? await previo.text() : null;
  if (anterior !== null && anterior !== usuario) await vaciarPaginas();
  await meta.put(CLAVE_USUARIO, new Response(usuario));
}

async function vaciarPaginas() {
  await caches.delete(PAGINAS);
}

/* ---------- Utilidades ---------- */

function esHtml(res) {
  return (res.headers.get("Content-Type") ?? "").includes("text/html");
}

async function guardar(cache, clave, res) {
  try {
    await cache.put(clave, res);
  } catch {
    // Sin espacio o `Vary: *`: se sigue sin copia
  }
}

async function recortar(nombre, max) {
  const cache = await caches.open(nombre);
  const claves = await cache.keys();
  // Las más viejas primero (orden de inserción)
  await Promise.all(
    claves
      .slice(0, Math.max(0, claves.length - max))
      .map((k) => cache.delete(k)),
  );
}
