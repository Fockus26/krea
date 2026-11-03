import type { Metadata } from "next";
import { PuntosView } from "@/components/sections/puntos/puntos-view";
import { PageHeader } from "@/components/sections/shared/page-header";
import {
  AJUSTE_INICIAL,
  candidatosPuntos,
  historialPuntos,
} from "@/lib/demo/puntos";
import { USUARIO_PROFESOR } from "@/lib/demo/usuarios";

export const metadata: Metadata = {
  title: "Ajustes de puntos",
  robots: { index: false },
};

// Ajustes de puntos (HANDOFF §3): las mismas secciones que /secciones/puntos. Los ajustes mueven
// puntos del ranking, nunca la nota (D007). Aplicar y anular solo cambian el estado local (D120, D121);
// los avisos usan el Toaster global (D131).
export default function PuntosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Puntos del ranking · no cambian la nota"
        title="Ajustes de puntos"
      />
      <PuntosView
        candidatos={candidatosPuntos()}
        historial={historialPuntos()}
        inicial={AJUSTE_INICIAL}
        profe={USUARIO_PROFESOR.nombre}
      />
    </>
  );
}
