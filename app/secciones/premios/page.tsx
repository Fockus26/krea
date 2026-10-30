import type { Metadata } from "next";
import { PrizesBoard } from "@/components/sections/premios/prizes-board";
import { PageHeader } from "@/components/sections/shared/page-header";
import { NOMBRES_EQUIPO, TARJETAS_PREMIOS } from "@/lib/demo/premios";
import { PREMIOS_EYEBROW } from "@/lib/premios";
import { Vista } from "../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Premios",
  robots: { index: false, follow: false },
};

// Ruta final (fase 05): /profe/premios. Una tarjeta de cada estado (D122); el empate se decide en el
// cliente con estado local (D125).
export default function PremiosVista() {
  return (
    <Vista rol="profesor" ruta="/profe/premios">
      <PageHeader eyebrow={PREMIOS_EYEBROW} title="Premios" />
      <PrizesBoard tarjetas={TARJETAS_PREMIOS} nombres={NOMBRES_EQUIPO} />
    </Vista>
  );
}
