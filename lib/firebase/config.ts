// Configuración pública de Firebase (D174). Puro: lo leen el cliente y el servidor. Las
// NEXT_PUBLIC_* se escriben literales para que Next las incruste en el bundle del cliente.

export type ConfigFirebase = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  appId: string;
  /** `true`: conectar a los emuladores locales (qa:local, seed); nunca en Vercel. */
  usarEmuladores: boolean;
};

export type EnvFirebase = Partial<Record<string, string | undefined>>;

/** Proyecto de los emuladores: `demo-*` no puede tocar recursos reales. */
export const PROYECTO_DEMO = "demo-krea";

export const EMULADORES = {
  auth: "127.0.0.1:9099",
  firestore: { host: "127.0.0.1", port: 8080 },
  storage: { host: "127.0.0.1", port: 9199 },
} as const;

/**
 * Lee la configuración de un objeto de entorno. Con emuladores, lo que falte se completa con
 * el proyecto demo; sin emuladores, falta algo → `null` (la app avisa, no inventa claves).
 */
export function leerConfig(env: EnvFirebase): ConfigFirebase | null {
  const usarEmuladores = env.NEXT_PUBLIC_USE_EMULATORS === "true";
  const projectId =
    env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    (usarEmuladores ? PROYECTO_DEMO : "");
  const apiKey =
    env.NEXT_PUBLIC_FIREBASE_API_KEY || (usarEmuladores ? "demo-api-key" : "");
  if (!projectId || !apiKey) return null;
  return {
    apiKey,
    projectId,
    authDomain:
      env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    storageBucket:
      env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      `${projectId}.firebasestorage.app`,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    usarEmuladores,
  };
}

/** Las variables públicas, escritas literales (Next solo incrusta `process.env.NEXT_PUBLIC_X`). */
export function envPublico(): EnvFirebase {
  return {
    NEXT_PUBLIC_USE_EMULATORS: process.env.NEXT_PUBLIC_USE_EMULATORS,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}
