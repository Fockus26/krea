import { CargaDetalle } from "@/components/estados/cargas";

/** Carga de Evaluar entrega: el `loading` del padre no cubre esta ruta (D219). */
export default function Loading() {
  return <CargaDetalle label="Cargando la entrega" />;
}
