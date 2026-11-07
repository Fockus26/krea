import type { Metadata } from "next";
import { EquiposProfe } from "./_equipos";

export const metadata: Metadata = {
  title: "Equipos",
  robots: { index: false },
};

// La primera sección del catálogo; las demás en /profe/equipos/[seccion] (D323).
export default function EquiposPage() {
  return <EquiposProfe />;
}
