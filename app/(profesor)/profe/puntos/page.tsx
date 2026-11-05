import type { Metadata } from "next";
import { PuntosView } from "@/components/sections/puntos/puntos-view";
import { PageHeader } from "@/components/sections/shared/page-header";
import { anularAjuste, aplicarAjuste } from "@/lib/acciones/ajustes";
import { candidatosDe, historialDe } from "@/lib/ajustes-datos";
import {
  ajustesTodos,
  equiposTodos,
  profesorActual,
  rankingsTodos,
  usuariosTodos,
} from "@/lib/datos/profesor";
import { nombreCorto } from "@/lib/vistas-estudiante";

export const metadata: Metadata = {
  title: "Ajustes de puntos",
  robots: { index: false },
};

const ACCIONES = { aplicar: aplicarAjuste, anular: anularAjuste };

// Ajustes de puntos (HANDOFF §3; W7, D207): las mismas secciones que /secciones/puntos con
// Firestore. Los ajustes mueven puntos del ranking, nunca la nota (D007); aplicar y anular
// escriben el ajuste y el ranking en una transacción y la página se refresca con lo guardado.
// Los avisos usan el Toaster global (D131).
export default async function PuntosPage() {
  const [{ usuario }, usuarios, equipos, ajustes, rankings] = await Promise.all(
    [
      profesorActual(),
      usuariosTodos(),
      equiposTodos(),
      ajustesTodos(),
      rankingsTodos(),
    ],
  );
  const nombres = {
    usuarios: new Map(usuarios.map((u) => [u.cedula, u])),
    equipos: new Map(equipos.map((e) => [e.id, e])),
  };
  return (
    <>
      <PageHeader
        eyebrow="Puntos del ranking · no cambian la nota"
        title="Ajustes de puntos"
      />
      <PuntosView
        candidatos={candidatosDe({ usuarios, equipos, rankings })}
        historial={historialDe(ajustes, nombres)}
        profe={usuario ? nombreCorto(usuario) : ""}
        acciones={ACCIONES}
      />
    </>
  );
}
