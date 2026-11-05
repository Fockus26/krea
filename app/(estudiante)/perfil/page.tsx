import type { Metadata } from "next";
import {
  AparienciaConectada,
  AvatarPickerConectado,
  SeguridadConectada,
} from "@/components/sections/perfil/perfil-conectado";
import { ProfileData } from "@/components/sections/perfil/profile-data";
import { ProfileIdentity } from "@/components/sections/perfil/profile-identity";
import { alumnoActual, equipoPorId } from "@/lib/datos/estudiante";
import { perfilVista } from "@/lib/vistas-estudiante";

export const metadata: Metadata = { title: "Perfil" };

// Perfil (HANDOFF §3): una columna en todos los anchos (ancho de lectura por ruta, D129). Datos
// del perfil de la sesión (D189); nombres y cédula solo lectura (los edita el profe). Avatar,
// tema y acento se guardan al perfil; «Cambiar contraseña» por Server Action (D191, D192).
export default async function PerfilPage() {
  const { usuario } = await alumnoActual();
  const equipo = usuario.equipoId ? await equipoPorId(usuario.equipoId) : null;
  const p = perfilVista(usuario, equipo);
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
      <AvatarPickerConectado
        nombre={p.nombre}
        estilo={p.estilo}
        seed={p.seed}
        base={usuario.cedula}
      />
      <AparienciaConectada inicial={usuario.apariencia ?? null} />
      <SeguridadConectada salirHref="/salir" />
    </>
  );
}
