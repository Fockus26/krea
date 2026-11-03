import type { Metadata } from "next";
import { EquiposProfe } from "./_equipos";

export const metadata: Metadata = {
  title: "Equipos",
  robots: { index: false },
};

export default function EquiposPage() {
  return <EquiposProfe seccion="5A" />;
}
