import type { Metadata } from "next";
import { RankingProfe } from "../../_ranking";

export const metadata: Metadata = {
  title: "Ranking de equipos de 5C",
  robots: { index: false },
};

export default function Ranking5cEquiposPage() {
  return <RankingProfe seccion="5C" vista="equipos" />;
}
