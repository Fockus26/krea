import type { Metadata } from "next";
import { RankingProfe } from "../_ranking";

export const metadata: Metadata = {
  title: "Ranking de equipos",
  robots: { index: false },
};

// La primera sección del catálogo; las demás en /profe/ranking/[seccion]/equipos (D323).
export default function RankingEquiposPage() {
  return <RankingProfe vista="equipos" />;
}
