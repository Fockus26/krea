import type { Metadata } from "next";
import {
  AparienciaConectada,
  AvatarPickerConectado,
  AvisoTareasConectado,
  SeguridadConectada,
} from "@/components/sections/perfil/perfil-conectado";
import { ProfileData } from "@/components/sections/perfil/profile-data";
import { ProfileIdentity } from "@/components/sections/perfil/profile-identity";
import { TusProfesores } from "@/components/sections/perfil/tus-profesores";
import {
  alumnoActual,
  equipoPorId,
  profesDelAlumno,
} from "@/lib/datos/estudiante";
import { baseSelectorAvatar } from "@/lib/perfil";
import { clavePublicaPush } from "@/lib/push";
import { perfilVista } from "@/lib/vistas-estudiante";

export const metadata: Metadata = { title: "Perfil" };

// Perfil (HANDOFF §3): una columna en todos los anchos (ancho de lectura por ruta, D129). Datos
// del perfil de la sesión (D189); nombres y cédula solo lectura (los edita el profe). Avatar,
// tema y acento se guardan al perfil; «Cambiar contraseña» por Server Action (D191, D192). Tras
// sus datos, «Tus profesores» con su contacto (D380; no sale si ninguno lo cargó).
export default async function PerfilPage() {
  const { usuario } = await alumnoActual();
  const [equipo, profes] = await Promise.all([
    usuario.equipoId ? equipoPorId(usuario.equipoId) : null,
    profesDelAlumno(),
  ]);
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
      <TusProfesores profes={profes} />
      <AvatarPickerConectado
        nombre={p.nombre}
        estilo={p.estilo}
        seed={p.seed}
        base={baseSelectorAvatar(usuario.avatar.semilla, usuario.cedula)}
      />
      <AparienciaConectada inicial={usuario.apariencia ?? null} />
      {/* Aviso de tarea nueva (D335): solo con las tres variables de VAPID */}
      <AvisoTareasConectado clavePublica={clavePublicaPush(process.env)} />
      <SeguridadConectada salirHref="/salir" />
    </>
  );
}
