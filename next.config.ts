import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // kit-deploy (D580): el Dockerfile construye con NEXT_OUTPUT=standalone (la imagen lleva solo
  // .next/standalone). Vercel construye igual que antes mientras sea el respaldo.
  ...(process.env.NEXT_OUTPUT === "standalone" && {
    output: "standalone" as const,
  }),
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // Service worker (D291): el navegador siempre pide la versión nueva (guía PWA de Next) y solo
  // puede cargar scripts del mismo origen.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
  experimental: {
    // Una imagen de respuesta por llamada: ≤ 2,5 MB ya comprimida (lib/almacen/imagen.ts) +
    // el sobrecosto del multipart. El valor por defecto (1 MB) no alcanza para una foto (D195).
    serverActions: { bodySizeLimit: "3mb" },
    // Volver a una ruta ya vista en los últimos 3 min la pinta desde la caché del router, sin
    // esqueleto ni viaje al servidor (D250). Cada Server Action que escribe llama a `refresh()`,
    // que vacía esa caché entera; el ranking sigue en vivo con `onSnapshot` (D190).
    staleTimes: { dynamic: 180 },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
