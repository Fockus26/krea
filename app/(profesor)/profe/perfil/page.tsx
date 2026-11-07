import type { Metadata } from "next";
import {
  AparienciaConectada,
  AvatarPickerConectado,
  SeguridadConectada,
} from "@/components/sections/perfil/perfil-conectado";
import { ProfileDataEditable } from "@/components/sections/perfil/profile-data-editable";
import { PageHeader } from "@/components/sections/shared/page-header";
import { profesorActual } from "@/lib/datos/profesor";
import { estiloDe, nombreCompleto, nombreCorto } from "@/lib/vistas-estudiante";

export const metadata: Metadata = {
  title: "Perfil del profesor",
  robots: { index: false },
};

// Perfil del profesor (D158 → D234): sus datos (nombres y apellidos editables, la cédula no), su
// avatar, Apariencia y Seguridad, todo de la sesión y guardado con las Server Actions de Perfil
// (D191, D192). Sin perfil legible quedan Apariencia y Seguridad.
export default async function PerfilProfePage() {
  const { usuario } = await profesorActual();
  return (
    <>
      <PageHeader
        title="Perfil"
        description={usuario ? nombreCompleto(usuario) : undefined}
      />
      {usuario ? (
        <>
          <ProfileDataEditable
            cedula={usuario.cedula}
            nombres={usuario.nombres}
            apellidos={usuario.apellidos}
          />
          <AvatarPickerConectado
            nombre={nombreCorto(usuario)}
            estilo={estiloDe(usuario.avatar.estilo)}
            seed={usuario.avatar.semilla}
            base={usuario.cedula}
          />
        </>
      ) : null}
      <AparienciaConectada inicial={usuario?.apariencia ?? null} />
      <SeguridadConectada salirHref="/salir" />
    </>
  );
}
