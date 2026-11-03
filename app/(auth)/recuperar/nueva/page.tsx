import type { Metadata } from "next";
import { AuthLayout } from "@/components/sections/auth/auth-layout";
import { NewPasswordForm } from "@/components/sections/auth/new-password-form";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false, follow: false },
};

/** Nueva contraseña (HANDOFF §3). El enlace vencido no es otra ruta: /secciones/ingresar/vencido. */
export default function RecuperarNuevaPage() {
  return (
    <AuthLayout>
      <NewPasswordForm pedirOtroHref="/recuperar" />
    </AuthLayout>
  );
}
