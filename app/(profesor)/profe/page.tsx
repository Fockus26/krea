import type { Metadata } from "next";
import { PanelConHora } from "@/components/sections/profe-panel/panel-con-hora";
import { panelDe } from "@/lib/demo/panel";

export const metadata: Metadata = { title: "Panel" };

// Panel del profesor (HANDOFF §3): la sección de /secciones/profe con el saludo por la hora del
// visitante (D133). Datos: seed real + cola y ajustes de ejemplo (lib/demo/panel.ts, D069).
export default function PanelPage() {
  return <PanelConHora datos={panelDe()} />;
}
