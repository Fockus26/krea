// Credenciales del Admin SDK desde el entorno (D174). Puro, con pruebas. Nunca se registran
// ni se devuelven al cliente.
import { type EnvFirebase, PROYECTO_DEMO } from "@/lib/firebase/config";

export type CredencialesAdmin =
  | { tipo: "emulador"; projectId: string }
  | {
      tipo: "servicio";
      projectId: string;
      clientEmail: string;
      privateKey: string;
      storageBucket: string;
    };

export function credencialesAdmin(env: EnvFirebase): CredencialesAdmin | null {
  if (env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST) {
    const projectId =
      env.GCLOUD_PROJECT ||
      env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      PROYECTO_DEMO;
    // Con emuladores solo se acepta un proyecto demo-*: nunca la base real (qa-local).
    if (!projectId.startsWith("demo-")) return null;
    return { tipo: "emulador", projectId };
  }
  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  return {
    tipo: "servicio",
    projectId,
    clientEmail,
    // Vercel guarda la clave con «\n» literales.
    privateKey: privateKey.replace(/\\n/g, "\n"),
    storageBucket:
      env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      `${projectId}.firebasestorage.app`,
  };
}
