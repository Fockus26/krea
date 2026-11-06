import type { Metadata } from "next";
import { ProfesoresDirectory } from "@/components/sections/profesores/profesores-directory";
import {
  crearProfesor,
  editarProfesor,
  eliminarProfesor,
} from "@/lib/acciones/profesores";
import { profesoresTodos } from "@/lib/datos/profesores";

export const metadata: Metadata = {
  title: "Profesores",
  robots: { index: false },
};

// Profesores (D233): solo el profesor admin (D231). `profesoresTodos` exige admin: un profe que
// no lo es vuelve al Panel. Crear, editar y eliminar van por Server Actions que también lo exigen.
export default async function ProfesoresPage() {
  const profesores = await profesoresTodos();
  return (
    <ProfesoresDirectory
      profesores={profesores}
      acciones={{
        crear: crearProfesor,
        editar: editarProfesor,
        eliminar: eliminarProfesor,
      }}
    />
  );
}
