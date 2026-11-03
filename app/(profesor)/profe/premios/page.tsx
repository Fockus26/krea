import type { Metadata } from "next";
import { PrizesBoard } from "@/components/sections/premios/prizes-board";
import { PageHeader } from "@/components/sections/shared/page-header";
import { NOMBRES_EQUIPO, TARJETAS_PREMIOS } from "@/lib/demo/premios";
import { PREMIOS_EYEBROW } from "@/lib/premios";

export const metadata: Metadata = {
  title: "Premios",
  robots: { index: false },
};

// Premios (HANDOFF §3): las mismas secciones que /secciones/premios. Una tarjeta de cada estado
// (D122); el empate se decide en el cliente con estado local (D125) y su aviso usa el Toaster global.
export default function PremiosPage() {
  return (
    <>
      <PageHeader eyebrow={PREMIOS_EYEBROW} title="Premios" />
      <PrizesBoard tarjetas={TARJETAS_PREMIOS} nombres={NOMBRES_EQUIPO} />
    </>
  );
}
