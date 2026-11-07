import type { Metadata } from "next";
import { PanelConHora } from "@/components/sections/profe-panel/panel-con-hora";
import {
  ajustesTodos,
  colaEvaluar,
  entregasTodas,
  mapasProfe,
  profesorActual,
} from "@/lib/datos/profesor";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { nombreSaludoProfe } from "@/lib/panel";
import { panelDatosDe } from "@/lib/panel-datos";
import { seccionesDe } from "@/lib/secciones";

export const metadata: Metadata = { title: "Panel" };

// Panel del profesor (HANDOFF §3): la sección de /secciones/profe con el saludo por la hora del
// visitante (D133). Datos de Firestore (W7, D208): la cola «Por evaluar», los últimos ajustes y el
// avance de la tarea evaluada más reciente. El filtro es «Todas» + las secciones del catálogo (D322).
export default async function PanelPage() {
  const [cola, entregas, ajustes, mapas, { usuario }, catalogo] =
    await Promise.all([
      colaEvaluar(),
      entregasTodas(),
      ajustesTodos(),
      mapasProfe(),
      profesorActual(),
      catalogoSecciones(),
    ]);
  return (
    <PanelConHora
      datos={panelDatosDe({
        cola,
        entregas,
        ajustes,
        mapas,
        secciones: seccionesDe(catalogo),
      })}
      nombre={nombreSaludoProfe(usuario?.nombres)}
    />
  );
}
