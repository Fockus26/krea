import type { Metadata } from "next";
import { RankingEstudiante } from "../_ranking";

export const metadata: Metadata = { title: "Ranking de equipos" };

export default function RankingEquiposPage() {
  return <RankingEstudiante vista="equipos" />;
}
