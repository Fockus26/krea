import type { Metadata } from "next";
import { AppearanceSettings } from "@/components/sections/perfil/appearance-settings";
import { AvatarPicker } from "@/components/sections/perfil/avatar-picker";
import { ProfileData } from "@/components/sections/perfil/profile-data";
import { ProfileIdentity } from "@/components/sections/perfil/profile-identity";
import { SecuritySettings } from "@/components/sections/perfil/security-settings";
import { perfilDe } from "@/lib/demo/perfil";
import { Vista } from "../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Perfil",
  robots: { index: false, follow: false },
};

// Ruta final (fase 05): /perfil. Una columna en todos los anchos (HANDOFF §3 Perfil).
// Datos: Raquel Figueroa del seed (D069).
export default function PerfilVista() {
  const p = perfilDe();
  return (
    <Vista rol="estudiante" ruta="/perfil" width="lectura">
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
      <SecuritySettings salirHref="/secciones/ingresar/login" />
    </Vista>
  );
}
