import { CargaLista } from "@/components/estados/cargas";

/** Carga de Años y secciones: encabezado + lista sin píldora (D167). */
export default function Loading() {
  return (
    <CargaLista label="Cargando años y secciones" pildora={false} filas={3} />
  );
}
