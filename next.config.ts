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
