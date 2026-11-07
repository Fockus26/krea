import { notFound } from "next/navigation";
import {
  type AccionesEquipos,
  TeamsBoard,
} from "@/components/sections/equipos-profe/teams-board";
import { PageHeader } from "@/components/sections/shared/page-header";
import { SinSecciones } from "@/components/sections/shared/sin-secciones";
import {
  cambiarCapitanDeEquipo,
  crearEquipo,
  editarEquipo,
  eliminarEquipo,
  eliminarEquipos,
  moverAlumnoDeEquipo,
  subirLogoEquipo,
} from "@/lib/acciones/equipos";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import {
  ajustesTodos,
  entregasTodas,
  equiposTodos,
  profesorActual,
  rankingsTodos,
  usuariosTodos,
} from "@/lib/datos/profesor";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { equiposProfeDatos } from "@/lib/equipos-datos";
import { seccionDeSlug, seccionesDe } from "@/lib/secciones";

/** Base de los enlaces del selector de sección: `${base}/4b`, `${base}/5a` (D110, D156, D323). */
export const BASE_EQUIPOS = "/profe/equipos";

const ACCIONES: AccionesEquipos = {
  mover: moverAlumnoDeEquipo,
  capitan: cambiarCapitanDeEquipo,
  logo: subirLogoEquipo,
  gestion: {
    crear: crearEquipo,
    editar: editarEquipo,
    eliminar: eliminarEquipo,
    eliminarVarios: eliminarEquipos,
  },
};

/**
 * Equipos del profesor (HANDOFF §3; W8, D210, D212) de una sección, con Firestore. Compartido por
 * `/profe/equipos` (la primera sección del catálogo) y `/profe/equipos/[seccion]` (`slug`, «4b»;
 * si no está en el catálogo, 404; D323). Sin secciones, el vacío de D325. Mover, capitán,
 * logo y crear/editar/eliminar equipo (W12, D270) se guardan con Server Actions; solo se firman
 * los logos de esta sección (los que se ven). Entregas y ajustes solo cuentan para saber qué
 * arrastra eliminar un equipo (D307). El aviso «pasó a …» usa el Toaster global (D131).
 */
export async function EquiposProfe({ slug }: { slug?: string }) {
  const [{ sesion }, catalogo] = await Promise.all([
    profesorActual(),
    catalogoSecciones(),
  ]);
  const secciones = seccionesDe(catalogo);
  if (secciones.length === 0) {
    return (
      <>
        <PageHeader title="Equipos" />
        <SinSecciones admin={sesion.admin === true} />
      </>
    );
  }
  const seccion =
    slug === undefined ? secciones[0] : seccionDeSlug(slug, catalogo);
  if (!seccion) notFound();
  const [usuarios, equipos, rankings, entregas, ajustes] = await Promise.all([
    usuariosTodos(),
    equiposTodos(),
    rankingsTodos(),
    entregasTodas(),
    ajustesTodos(),
  ]);
  const logos = await urlsFirmadas(
    equipos.flatMap((e) =>
      e.seccion === seccion && e.logoPath ? [e.logoPath] : [],
    ),
  );
  const d = equiposProfeDatos(seccion, {
    usuarios,
    equipos,
    ranking: rankings[seccion] ?? null,
    logos,
    entregas,
    ajustes,
  });
  return (
    <TeamsBoard
      seccion={d.seccion}
      secciones={secciones}
      base={BASE_EQUIPOS}
      equipos={d.equipos}
      alumnos={d.alumnos}
      inicial={d.inicial}
      total={d.total}
      acciones={ACCIONES}
    />
  );
}
