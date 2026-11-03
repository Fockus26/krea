"use client";
// SDK de Firebase del navegador (D174, D175): Auth y LECTURAS de Firestore (onSnapshot del
// ranking). No escribe en Firestore: las reglas lo niegan; las escrituras van por Server Actions.
import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  type Firestore,
  getFirestore,
} from "firebase/firestore";
import { EMULADORES, envPublico, leerConfig } from "@/lib/firebase/config";

type Cliente = { app: FirebaseApp; auth: Auth; db: Firestore };

let cliente: Cliente | null = null;

/** `null` si faltan las variables públicas (proyecto Firebase aún sin crear). */
export function firebaseCliente(): Cliente | null {
  if (cliente) return cliente;
  const config = leerConfig(envPublico());
  if (!config) return null;
  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (config.usarEmuladores) {
    connectAuthEmulator(auth, `http://${EMULADORES.auth}`, {
      disableWarnings: true,
    });
    connectFirestoreEmulator(
      db,
      EMULADORES.firestore.host,
      EMULADORES.firestore.port,
    );
  }
  cliente = { app, auth, db };
  return cliente;
}
