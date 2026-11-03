import type { Metadata } from "next";
import { RankingProfe } from "./_ranking";

export const metadata: Metadata = {
  title: "Ranking de 5A",
  robots: { index: false },
};

export default function RankingPage() {
  return <RankingProfe seccion="5A" vista="estudiantes" />;
}
