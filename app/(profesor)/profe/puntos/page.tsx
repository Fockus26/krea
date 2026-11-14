import type { Metadata } from "next";
import { PuntosView } from "@/components/sections/puntos/puntos-view";
import { PageHeader } from "@/components/sections/shared/page-header";
import { SinSecciones } from "@/components/sections/shared/sin-secciones";
import { anularAjuste, aplicarAjuste } from "@/lib/acciones/ajustes";
import {
  borrarMotivo,
  crearMotivo,
  editarMotivo,
} from "@/lib/acciones/motivos";
import { candidatosDe, historialDe } from "@/lib/ajustes-datos";
import { catalogoMotivos } from "@/lib/datos/motivos";
import {
  ajustesTodos,
  equiposTodos,
  profesorActual,
  rankingsTodos,
  usuariosTodos,
} from "@/lib/datos/profesor";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { seccionesDe } from "@/lib/secciones";
import { nombreCorto } from "@/lib/vistas-estudiante";

export const metadata: Metadata = {
  title: "Ajustes de puntos",
  robots: { index: false },
};

const ACCIONES = {
  aplicar: aplicarAjuste,
  anular: anularAjuste,
  motivos: { crear: crearMotivo, editar: editarMotivo, borrar: borrarMotivo },
};

const EYEBROW = "Puntos del ranking · no cambian la nota";

// Ajustes de puntos (HANDOFF §3; W7, D207): las mismas secciones que /secciones/puntos con
// Firestore. Los ajustes mueven puntos del ranking, nunca la nota (D007); aplicar y anular
// escriben el ajuste y el ranking en una transacción y la página se refresca con lo guardado.
// Las secciones salen del catálogo (D323); sin ninguna, el vacío de D325. Los avisos usan el
// Toaster global (D131).
export default async function PuntosPage() {
  const [
    { usuario, sesion },
    usuarios,
    equipos,
    ajustes,
    rankings,
    catalogo,
    motivos,
  ] = await Promise.all([
    profesorActual(),
    usuariosTodos(),
    equiposTodos(),
    ajustesTodos(),
    rankingsTodos(),
    catalogoSecciones(),
    catalogoMotivos(),
  ]);
  const secciones = seccionesDe(catalogo);
  if (secciones.length === 0) {
    return (
      <>
        <PageHeader eyebrow={EYEBROW} title="Ajustes de puntos" />
        <SinSecciones admin={sesion.admin === true} />
      </>
    );
  }
  const nombres = {
    usuarios: new Map(usuarios.map((u) => [u.cedula, u])),
    equipos: new Map(equipos.map((e) => [e.id, e])),
  };
  return (
    <>
      <PageHeader eyebrow={EYEBROW} title="Ajustes de puntos" />
      <PuntosView
        candidatos={candidatosDe({ usuarios, equipos, rankings, secciones })}
        secciones={secciones}
        motivos={motivos}
        historial={historialDe(ajustes, nombres)}
        profe={usuario ? nombreCorto(usuario) : ""}
        acciones={ACCIONES}
      />
    </>
  );
}
