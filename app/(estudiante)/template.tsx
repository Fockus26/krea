import type { ReactNode } from "react";
import { TransicionPagina } from "@/components/layout/transicion-pagina";

// Pestañas del estudiante: la página nueva entra por el lado de su pestaña (D278).
export default function Template({ children }: { children: ReactNode }) {
  return <TransicionPagina nivel="pestana">{children}</TransicionPagina>;
}
