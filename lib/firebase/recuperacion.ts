// Adaptadores del Admin SDK para «Olvidé mi contraseña» (D186, D187). Sin `server-only` para
// que las pruebas de tests/rules los corran contra los emuladores; la app los usa solo desde
// lib/acciones/recuperar.ts.
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { Correo, ResultadoEnvio } from "@/lib/correo/brevo";
import { COL, emailInterno, zPrivado } from "@/lib/modelo";
import {
  type DepsRecuperacion,
  reservarEnvio,
  zRecuperacion,
} from "@/lib/recuperar";

export function depsRecuperacion(
  admin: { auth: Auth; db: Firestore },
  enviar: (correo: Correo) => Promise<ResultadoEnvio>,
  sitio: URL,
): DepsRecuperacion {
  const { auth, db } = admin;
  return {
    async leerEmail(cedula) {
      const snap = await db.collection(COL.privados).doc(cedula).get();
      if (!snap.exists) return null;
      const p = zPrivado.safeParse(snap.data());
      return p.success ? p.data.email : null;
    },
    async leerNombres(cedula) {
      const snap = await db.collection(COL.usuarios).doc(cedula).get();
      const n = snap.get("nombres");
      return typeof n === "string" ? n : null;
    },
    async reservar(cedula, ahora) {
      const ref = db.collection(COL.recuperaciones).doc(cedula);
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const previo = zRecuperacion.safeParse(snap.data());
        const envios = reservarEnvio(
          previo.success ? previo.data.envios : [],
          ahora,
        );
        if (!envios) return false;
        tx.set(ref, { envios });
        return true;
      });
    },
    generarEnlace: (cedula) =>
      auth.generatePasswordResetLink(emailInterno(cedula)),
    enviar,
    sitio,
    ahora: () => Date.now(),
  };
}
