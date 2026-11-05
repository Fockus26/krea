import type { Metadata } from "next";
import { AuthLayout } from "@/components/sections/auth/auth-layout";
import { Recuperar } from "@/components/sections/auth/recuperar";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: false },
};

/**
 * Recuperar (HANDOFF §3, fase 07 D186): pide el enlace por cédula y muestra «Revisa tu correo»
 * en la misma ruta, con la misma respuesta exista o no la cuenta.
 */
export default function RecuperarPage() {
  return (
    <AuthLayout>
      <Recuperar volverHref="/ingresar" />
    </AuthLayout>
  );
}
