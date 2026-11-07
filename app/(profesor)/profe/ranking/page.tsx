import type { Metadata } from "next";
import { RankingProfe } from "./_ranking";

export const metadata: Metadata = {
  title: "Ranking",
  robots: { index: false },
};

// La primera sección del catálogo; las demás en /profe/ranking/[seccion] (D323).
export default function RankingPage() {
  return <RankingProfe vista="estudiantes" />;
}
