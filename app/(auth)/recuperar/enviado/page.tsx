import type { Metadata } from "next";
import { AuthLayout } from "@/components/sections/auth/auth-layout";
import { RecoverSent } from "@/components/sections/auth/recover-sent";

export const metadata: Metadata = {
  title: "Revisa tu correo",
  robots: { index: false, follow: false },
};

export default function RecuperarEnviadoPage() {
  return (
    <AuthLayout>
      {/* PLACEHOLDER: correo de ejemplo (CONTENT_CHECKLIST fila 3: faltan los reales). La fase 07 pone el del alumno. */}
      <RecoverSent email="yeilin@gmail.com" volverHref="/ingresar" />
    </AuthLayout>
  );
}
