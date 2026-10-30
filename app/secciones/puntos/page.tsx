import type { Metadata } from "next";
import { PuntosView } from "@/components/sections/puntos/puntos-view";
import { PageHeader } from "@/components/sections/shared/page-header";
import {
  AJUSTE_INICIAL,
  candidatosPuntos,
  historialPuntos,
} from "@/lib/demo/puntos";
import { USUARIO_PROFESOR } from "@/lib/demo/usuarios";
import { Vista } from "../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Ajustes de puntos",
  robots: { index: false, follow: false },
};

// Ruta final (fase 05): /profe/puntos. Datos: alumnos, equipos y puntos del seed (D069) y el historial
// del lienzo; aplicar y anular solo cambian el estado local (D120, D121). Ejemplo inicial = el del lienzo.
export default function PuntosVista() {
  return (
    <Vista rol="profesor" ruta="/profe/puntos">
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
    </Vista>
  );
}
