import { CargaLista } from "@/components/estados/cargas";

/** Carga de Mi equipo: skeleton por sección (D167). */
export default function Loading() {
  return <CargaLista label="Cargando tu equipo" pildora={false} filas={4} />;
}
