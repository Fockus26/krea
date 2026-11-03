import type { Metadata } from "next";
import { AuthLayout } from "@/components/sections/auth/auth-layout";
import { RecoverForm } from "@/components/sections/auth/recover-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: false },
};

/** Recuperar (HANDOFF §3). "Enviar enlace" valida y pasa a /recuperar/enviado (sin envío real). */
export default function RecuperarPage() {
  return (
    <AuthLayout>
      <RecoverForm volverHref="/ingresar" enviadoHref="/recuperar/enviado" />
    </AuthLayout>
  );
}
