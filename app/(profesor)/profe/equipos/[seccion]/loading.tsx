import { CargaTabla } from "@/components/estados/cargas";

/** Carga de Equipos de una sección: el `loading` del padre no cubre esta ruta (D219). */
export default function Loading() {
  return <CargaTabla label="Cargando equipos" />;
}
