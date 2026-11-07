import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
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
