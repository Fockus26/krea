import { CargaRanking } from "@/components/estados/cargas";

/** Carga del Ranking de equipos de una sección: el `loading` del padre no cubre esta ruta (D219). */
export default function Loading() {
  return <CargaRanking />;
}
