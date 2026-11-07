import type { Metadata } from "next";
import { SeccionesDirectory } from "@/components/sections/secciones/secciones-directory";
import {
  crearAnio,
  crearSeccion,
  editarAnio,
  editarSeccion,
  eliminarAnio,
  eliminarSeccion,
} from "@/lib/acciones/secciones";
import { pantallaSecciones } from "@/lib/datos/secciones";

export const metadata: Metadata = {
  title: "Años y secciones",
  robots: { index: false },
};

// Años y secciones (D319): solo el profesor admin (D231). `pantallaSecciones` exige admin: un
// profe que no lo es vuelve al Panel. Cada acción también lo exige y vuelve a comprobar que lo que
// se renombra o elimina esté vacío (D318).
export default async function SeccionesPage() {
  const { catalogo, anios } = await pantallaSecciones();
  return (
    <SeccionesDirectory
      catalogo={catalogo}
      anios={anios}
      acciones={{
        crearAnio,
        editarAnio,
        eliminarAnio,
        crearSeccion,
        editarSeccion,
        eliminarSeccion,
      }}
    />
  );
}
