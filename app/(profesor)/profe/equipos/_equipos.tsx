import {
  type AccionesEquipos,
  TeamsBoard,
} from "@/components/sections/equipos-profe/teams-board";
import {
  cambiarCapitanDeEquipo,
  crearEquipo,
  editarEquipo,
  eliminarEquipo,
  moverAlumnoDeEquipo,
  subirLogoEquipo,
} from "@/lib/acciones/equipos";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import {
  ajustesTodos,
  entregasTodas,
  equiposTodos,
  rankingsTodos,
  usuariosTodos,
} from "@/lib/datos/profesor";
import { equiposProfeDatos } from "@/lib/equipos-datos";
import type { SeccionEquipos } from "@/lib/equipos-profe";

/** Base de los enlaces del segmentado 5A | 5C: `${base}/5a`, `${base}/5c` (D110, D156). */
export const BASE_EQUIPOS = "/profe/equipos";

const ACCIONES: AccionesEquipos = {
  mover: moverAlumnoDeEquipo,
  capitan: cambiarCapitanDeEquipo,
  logo: subirLogoEquipo,
  gestion: {
    crear: crearEquipo,
    editar: editarEquipo,
    eliminar: eliminarEquipo,
  },
};

/**
 * Equipos del profesor (HANDOFF §3; W8, D210, D212) de una sección, con Firestore. Compartido por
 * `/profe/equipos` (5A, la sección por defecto) y `/profe/equipos/[seccion]`. Mover, capitán,
 * logo y crear/editar/eliminar equipo (W12, D270) se guardan con Server Actions; solo se firman
 * los logos de esta sección (los que se ven). Entregas y ajustes solo cuentan para saber qué
 * equipo se puede eliminar (D271). El aviso «pasó a …» usa el Toaster global (D131).
 */
export async function EquiposProfe({ seccion }: { seccion: SeccionEquipos }) {
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
    ranking: rankings[seccion],
    logos,
    entregas,
    ajustes,
  });
  return (
    <TeamsBoard
      seccion={d.seccion}
      base={BASE_EQUIPOS}
      equipos={d.equipos}
      alumnos={d.alumnos}
      inicial={d.inicial}
      total={d.total}
      acciones={ACCIONES}
    />
  );
}
