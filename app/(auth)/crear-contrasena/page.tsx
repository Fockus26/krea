import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthLayout } from "@/components/sections/auth/auth-layout";
import { CrearPassword } from "@/components/sections/auth/crear-password";
import { Spinner } from "@/components/ui/spinner";
import { verificarSesion } from "@/lib/dal";
import { inicioDe, RUTA_INGRESAR } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Crea tu contraseña",
  robots: { index: false, follow: false },
};

/**
 * «Crea tu contraseña» (D232): primer ingreso con la contraseña temporal. El proxy ya manda aquí
 * a esas sesiones; la página lo vuelve a comprobar con revocación (DAL): sin sesión → Ingresar,
 * sesión que ya creó la suya → su inicio.
 */
export default function CrearContrasenaPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="grid place-items-center py-12">
            <Spinner label="Cargando…" />
          </div>
        }
      >
        <ConSesion />
      </Suspense>
    </AuthLayout>
  );
}

async function ConSesion() {
  const sesion = await verificarSesion();
  if (!sesion) redirect(RUTA_INGRESAR);
  if (!sesion.debeCambiarPassword) redirect(inicioDe(sesion.rol));
  return <CrearPassword />;
}
