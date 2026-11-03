import type { Metadata } from "next";
import { RankingProfe } from "../_ranking";

export const metadata: Metadata = {
  title: "Ranking de 5C",
  robots: { index: false },
};

export default function Ranking5cPage() {
  return <RankingProfe seccion="5C" vista="estudiantes" />;
}
