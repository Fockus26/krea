import "server-only";
// Admin SDK (D175): el ÚNICO que escribe en Firestore, desde Server Actions y scripts.
// Con los emuladores, el SDK lee FIREBASE_AUTH_EMULATOR_HOST / FIRESTORE_EMULATOR_HOST solo.
import {
  type App,
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { type Firestore, getFirestore } from "firebase-admin/firestore";
import { credencialesAdmin } from "@/lib/firebase/credenciales";

type Admin = { app: App; auth: Auth; db: Firestore };

let admin: Admin | null = null;

/** `null` si faltan las credenciales (proyecto aún sin crear): el llamador devuelve un error tipado. */
export function firebaseAdmin(): Admin | null {
  if (admin) return admin;
  const cred = credencialesAdmin(process.env);
  if (!cred) return null;
  const app = getApps().length
    ? getApp()
    : initializeApp(
        cred.tipo === "emulador"
          ? { projectId: cred.projectId }
          : {
              projectId: cred.projectId,
              credential: cert({
                projectId: cred.projectId,
                clientEmail: cred.clientEmail,
                privateKey: cred.privateKey,
              }),
              storageBucket: cred.storageBucket,
            },
      );
  admin = { app, auth: getAuth(app), db: getFirestore(app) };
  return admin;
}
