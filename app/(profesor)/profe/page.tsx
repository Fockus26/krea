import type { Metadata } from "next";
import { PanelConHora } from "@/components/sections/profe-panel/panel-con-hora";
import {
  ajustesTodos,
  colaEvaluar,
  entregasTodas,
  mapasProfe,
  profesorActual,
} from "@/lib/datos/profesor";
import { nombreSaludoProfe } from "@/lib/panel";
import { panelDatosDe } from "@/lib/panel-datos";

export const metadata: Metadata = { title: "Panel" };

// Panel del profesor (HANDOFF §3): la sección de /secciones/profe con el saludo por la hora del
// visitante (D133). Datos de Firestore (W7, D208): la cola «Por evaluar», los últimos ajustes y el
// avance de la tarea evaluada más reciente.
export default async function PanelPage() {
  const [cola, entregas, ajustes, mapas, { usuario }] = await Promise.all([
    colaEvaluar(),
    entregasTodas(),
    ajustesTodos(),
    mapasProfe(),
    profesorActual(),
  ]);
  return (
    <PanelConHora
      datos={panelDatosDe({ cola, entregas, ajustes, mapas })}
      nombre={nombreSaludoProfe(usuario?.nombres)}
    />
  );
}
