import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { PrizeDialog } from "@/components/sections/premios/prize-dialog";
import { PrizesBoard } from "@/components/sections/premios/prizes-board";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Button } from "@/components/ui/button";
import { decidirPremio, guardarPremio } from "@/lib/acciones/tareas";
import { hayAlmacen, urlsFirmadas } from "@/lib/datos/imagenes";
import {
  entregasTodas,
  equiposTodos,
  tareasProfe,
  usuariosTodos,
} from "@/lib/datos/profesor";
import { CREAR_PREMIO_LABEL, PREMIOS_EYEBROW } from "@/lib/premios";
import { tareasParaPremio, tarjetasPremios } from "@/lib/tareas-profe-datos";
import { nombreCompleto } from "@/lib/vistas-estudiante";

export const metadata: Metadata = {
  title: "Premios",
  robots: { index: false },
};

// Premios (HANDOFF §3; W6, W11): las tareas de Firestore con premio, grupales e individuales, una
// tarjeta por sección (D201, D263). El empate se decide con `decidirPremio` (D123, D124) y su aviso
// usa el Toaster global. «Crear premio» y «Editar premio» guardan con `guardarPremio` (D266); las
// fotos (D265) se firman aquí, solo las de las tarjetas que se pintan.
export default async function PremiosPage() {
  const [tareas, equipos, entregas, usuarios] = await Promise.all([
    tareasProfe(),
    equiposTodos(),
    entregasTodas(),
    usuariosTodos(),
  ]);
  const alumnos = usuarios.filter((u) => u.rol === "estudiante");
  const nombres = Object.fromEntries([
    ...equipos.map((e) => [e.id, e.nombre]),
    ...alumnos.map((a) => [a.cedula, nombreCompleto(a)]),
  ]);
  const tarjetas = tarjetasPremios(
    tareas,
    equipos,
    entregas,
    alumnos,
    Date.now(),
  );
  const fotos = await urlsFirmadas(
    tarjetas.flatMap((t) => (t.premio && t.premioFoto ? [t.premioFoto] : [])),
  );
  const conFotos = tarjetas.map((t) => {
    const url = t.premioFoto ? fotos.get(t.premioFoto) : undefined;
    return url ? { ...t, fotoUrl: url } : t;
  });
  const fotoDisponible = hayAlmacen();
  return (
    <>
      <PageHeader
        eyebrow={PREMIOS_EYEBROW}
        title="Premios"
        actions={
          <PrizeDialog
            trigger={
              <Button>
                <Plus aria-hidden="true" />
                {CREAR_PREMIO_LABEL}
              </Button>
            }
            tareas={tareasParaPremio(tareas)}
            fotoDisponible={fotoDisponible}
            guardar={guardarPremio}
          />
        }
      />
      <PrizesBoard
        tarjetas={conFotos}
        nombres={nombres}
        decidir={decidirPremio}
        guardarPremio={guardarPremio}
        fotoDisponible={fotoDisponible}
      />
    </>
  );
}
