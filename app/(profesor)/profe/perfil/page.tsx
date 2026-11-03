import type { Metadata } from "next";
import { AppearanceSettings } from "@/components/sections/perfil/appearance-settings";
import { SecuritySettings } from "@/components/sections/perfil/security-settings";
import { PageHeader } from "@/components/sections/shared/page-header";

export const metadata: Metadata = {
  title: "Perfil del profesor",
  robots: { index: false },
};

// Perfil del profesor (decisión de César, fase 05): solo Apariencia y Seguridad, sin avatar ni «Tus
// datos» (D158). «Cerrar sesión» → /ingresar mientras no hay sesión (D135).
export default function PerfilProfePage() {
  return (
    <>
      <PageHeader title="Perfil" />
      <AppearanceSettings />
      <SecuritySettings salirHref="/ingresar" />
    </>
  );
}
