import { CargaLista } from "@/components/estados/cargas";

/** Carga de Profesores: encabezado + lista sin píldora (D167). */
export default function Loading() {
  return <CargaLista label="Cargando profesores" pildora={false} filas={3} />;
}
