import type { Metadata } from "next";
import { PrizesBoard } from "@/components/sections/premios/prizes-board";
import { PageHeader } from "@/components/sections/shared/page-header";
import { decidirPremio } from "@/lib/acciones/tareas";
import { entregasTodas, equiposTodos, tareasProfe } from "@/lib/datos/profesor";
import { PREMIOS_EYEBROW } from "@/lib/premios";
import { tarjetasPremios } from "@/lib/tareas-profe-datos";

export const metadata: Metadata = {
  title: "Premios",
  robots: { index: false },
};

// Premios (HANDOFF §3; W6): las tareas grupales de Firestore, una tarjeta por sección con premio
// (D201). El empate se decide con `decidirPremio` (D123, D124) y su aviso usa el Toaster global.
export default async function PremiosPage() {
  const [tareas, equipos, entregas] = await Promise.all([
    tareasProfe(),
    equiposTodos(),
    entregasTodas(),
  ]);
  const nombres = Object.fromEntries(equipos.map((e) => [e.id, e.nombre]));
  return (
    <>
      <PageHeader eyebrow={PREMIOS_EYEBROW} title="Premios" />
      <PrizesBoard
        tarjetas={tarjetasPremios(tareas, equipos, entregas)}
        nombres={nombres}
        decidir={decidirPremio}
      />
    </>
  );
}
