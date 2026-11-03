import type { Metadata } from "next";
import { AppearanceSettings } from "@/components/sections/perfil/appearance-settings";
import { AvatarPicker } from "@/components/sections/perfil/avatar-picker";
import { ProfileData } from "@/components/sections/perfil/profile-data";
import { ProfileIdentity } from "@/components/sections/perfil/profile-identity";
import { SecuritySettings } from "@/components/sections/perfil/security-settings";
import { perfilDe } from "@/lib/demo/perfil";

export const metadata: Metadata = { title: "Perfil" };

// Perfil (HANDOFF §3): una columna en todos los anchos (ancho de lectura por ruta, D129).
// Datos: Yeilin Duarte del seed (D069). «Cerrar sesión» → /ingresar mientras no hay sesión (D135).
export default function PerfilPage() {
  const p = perfilDe();
  return (
    <>
      <ProfileIdentity
        nombre={p.nombre}
        estilo={p.estilo}
        seed={p.seed}
        cedula={p.cedula}
        seccion={p.seccion}
        capitan={p.capitan}
        base={p.base}
      />
      <ProfileData campos={p.campos} />
      <AvatarPicker
        nombre={p.nombre}
        estilo={p.estilo}
        seed={p.seed}
        base={p.seed}
      />
      <AppearanceSettings />
      <SecuritySettings salirHref="/ingresar" />
    </>
  );
}
