import { CargaRanking } from "@/components/estados/cargas";

/** Carga de Ranking de equipos de 5A: el `loading` del padre no cubre esta ruta (D219). */
export default function Loading() {
  return <CargaRanking />;
}
