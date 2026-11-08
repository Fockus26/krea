// «Olvidé mi contraseña» sobre Postgres (D186, D187, D327). La app lo usa solo desde
// lib/acciones/recuperar.ts; las pruebas lo corren sobre PGlite.
import { and, eq, gt } from "drizzle-orm";
import type { Correo, ResultadoEnvio } from "@/lib/correo/brevo";
import type { Db } from "@/lib/db";
import { recuperaciones, usuarios, verification } from "@/lib/db/schema";
import { zApariencia } from "@/lib/modelo";
import { type DepsRecuperacion, reservarEnvio } from "@/lib/recuperar";

/** Identificador de Better Auth para un código de restablecer (better-auth/api/routes/password). */
export const idVerificacion = (codigo: string) => `reset-password:${codigo}`;

export function depsRecuperacion(
  db: Db,
  generarCodigo: (cedula: string) => Promise<string | null>,
  enviar: (correo: Correo) => Promise<ResultadoEnvio>,
  sitio: URL,
): DepsRecuperacion {
  return {
    async leerEmail(cedula) {
      const [f] = await db
        .select({ email: usuarios.emailRecuperacion })
        .from(usuarios)
        .where(eq(usuarios.cedula, cedula))
        .limit(1);
      return f?.email ?? null;
    },
    async leerPerfil(cedula) {
      const [f] = await db
        .select({ nombres: usuarios.nombres, apariencia: usuarios.apariencia })
        .from(usuarios)
        .where(eq(usuarios.cedula, cedula))
        .limit(1);
      // jsonb sin garantía de forma: lo que no valide va como «sin apariencia» (azul en claro).
      const apariencia = zApariencia.safeParse(f?.apariencia);
      return {
        nombres: f?.nombres ?? null,
        apariencia: apariencia.success ? apariencia.data : null,
      };
    },
    async reservar(cedula, ahora) {
      return db.transaction(async (tx) => {
        await tx
          .insert(recuperaciones)
          .values({ cedula, envios: [] })
          .onConflictDoNothing();
        const [f] = await tx
          .select()
          .from(recuperaciones)
          .where(eq(recuperaciones.cedula, cedula))
          .for("update");
        const envios = reservarEnvio(f?.envios ?? [], ahora);
        if (!envios) return false;
        await tx
          .update(recuperaciones)
          .set({ envios })
          .where(eq(recuperaciones.cedula, cedula));
        return true;
      });
    },
    generarCodigo,
    enviar,
    sitio,
    ahora: () => Date.now(),
  };
}

/** ¿El código existe y no venció? (sin gastarlo; la página decide entre el formulario y «venció»). */
export async function codigoVigente(db: Db, codigo: string): Promise<boolean> {
  const [f] = await db
    .select({ id: verification.id })
    .from(verification)
    .where(
      and(
        eq(verification.identifier, idVerificacion(codigo)),
        gt(verification.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return f !== undefined;
}
