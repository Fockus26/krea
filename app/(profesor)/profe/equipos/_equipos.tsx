import {
  type AccionesEquipos,
  TeamsBoard,
} from "@/components/sections/equipos-profe/teams-board";
import {
  cambiarCapitanDeEquipo,
  moverAlumnoDeEquipo,
  subirLogoEquipo,
} from "@/lib/acciones/equipos";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import {
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
};

/**
 * Equipos del profesor (HANDOFF §3; W8, D210, D212) de una sección, con Firestore. Compartido por
 * `/profe/equipos` (5A, la sección por defecto) y `/profe/equipos/[seccion]`. Mover, capitán y
 * logo se guardan con Server Actions; solo se firman los logos de esta sección (los que se ven).
 * El aviso «pasó a …» usa el Toaster global (D131).
 */
export async function EquiposProfe({ seccion }: { seccion: SeccionEquipos }) {
  const [usuarios, equipos, rankings] = await Promise.all([
    usuariosTodos(),
    equiposTodos(),
    rankingsTodos(),
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
