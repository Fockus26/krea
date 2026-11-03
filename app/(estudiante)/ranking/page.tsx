import type { Metadata } from "next";
import { RankingEstudiante } from "./_ranking";

export const metadata: Metadata = { title: "Ranking" };

export default function RankingPage() {
  return <RankingEstudiante vista="estudiantes" />;
}
