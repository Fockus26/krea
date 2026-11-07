import type { ReactNode } from "react";
import { TransicionPagina } from "@/components/layout/transicion-pagina";

// Tareas ↔ una tarea: fundido (D278).
export default function Template({ children }: { children: ReactNode }) {
  return <TransicionPagina nivel="detalle">{children}</TransicionPagina>;
}
