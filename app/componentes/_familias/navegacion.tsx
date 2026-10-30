import { BottomNav } from "@/components/layout/bottom-nav";
import type { NavUsuario } from "@/components/layout/nav-types";
import { SideNav } from "@/components/layout/side-nav";
import { TopBar } from "@/components/layout/top-bar";
import { UserCard } from "@/components/layout/user-card";
import { Familia, Muestra } from "./familia";
import { MenuDemo } from "./navegacion-menu";

// Ítems por rol, lateral con tarjeta de usuario, topbar, barra inferior, hoja Menú (§2.7).
// Nombres, contador y título de ejemplo: provisionales (CONTENT_CHECKLIST 50–52).
const ESTUDIANTE: NavUsuario = {
  nombre: "María Méndez",
  estilo: "adventurer-neutral",
  seed: "maria-mendez",
};
const PROFESOR: NavUsuario = {
  nombre: "Carlos Ramírez",
  estilo: "bottts-neutral",
  seed: "carlos-ramirez",
};

// Marcos de ancho fijo para verlas fuera de su breakpoint. No usan AppShell: los landmarks
// reales (<nav aria-label="Principal">, <header>) los pone él, y aquí la página ya tiene un <main>.
const FRAME = "overflow-hidden rounded-md border border-divider bg-surface";
const TOP =
  "flex h-topbar items-center gap-3 border-b border-divider bg-topbar px-(--page-px)";
const BNAV =
  "grid h-bnav grid-cols-5 border-t border-divider bg-surface px-1 shadow-bnav";

export function Navegacion() {
  return (
    <Familia
      id="navegacion"
      title="Navegación"
      description="Barra lateral con tarjeta de usuario (≥ 1024), barra superior y barra inferior (< 1024) y hoja Menú del profesor. El ítem activo lleva aria-current, fondo y peso 700 (HANDOFF §2.7 y §2.13)."
    >
      <Muestra title="Barra lateral · estudiante (activo: Notas) y profesor (activo: Evaluar, con contador)">
        <div className="flex flex-wrap items-start gap-6">
          <div className={`${FRAME} h-176 w-side px-4 py-6`}>
            <SideNav
              rol="estudiante"
              pathname="/notas/proyecto-final"
              usuario={ESTUDIANTE}
            />
          </div>
          <div className={`${FRAME} h-176 w-side px-4 py-6`}>
            <SideNav
              rol="profesor"
              pathname="/profe/evaluar/entrega-1"
              usuario={PROFESOR}
              evaluarCount={3}
            />
          </div>
        </div>
      </Muestra>

      <Muestra title="Tarjeta de usuario (idéntica en ambos roles)">
        <div className="flex flex-wrap gap-6">
          <UserCard usuario={ESTUDIANTE} rol="estudiante" className="w-side" />
          <UserCard usuario={PROFESOR} rol="profesor" className="w-side" />
        </div>
      </Muestra>

      <Muestra title="Barra superior · logo + avatar (estudiante) · volver + título · logo + Menú (profesor)">
        <div className="flex max-w-sm flex-col gap-4">
          <div className={`${FRAME} ${TOP}`}>
            <TopBar rol="estudiante" pathname="/" usuario={ESTUDIANTE} />
          </div>
          <div className={`${FRAME} ${TOP}`}>
            <TopBar
              rol="estudiante"
              pathname="/notas/proyecto-final"
              usuario={ESTUDIANTE}
              volverHref="/notas"
              title="Proyecto final de emprendimiento"
            />
          </div>
          <div className={`${FRAME} ${TOP}`}>
            <TopBar rol="profesor" pathname="/profe" usuario={PROFESOR} />
          </div>
        </div>
      </Muestra>

      <Muestra title="Barra inferior · estudiante (activo: Ranking) y profesor (activo: Alumnos)">
        <div className="flex max-w-sm flex-col gap-4">
          <div className={`${FRAME} ${BNAV}`}>
            <BottomNav rol="estudiante" pathname="/ranking" />
          </div>
          <div className={`${FRAME} ${BNAV}`}>
            <BottomNav rol="profesor" pathname="/profe/alumnos" />
          </div>
          <div className={`${FRAME} ${BNAV}`}>
            <BottomNav rol="estudiante" pathname="/tareas" />
          </div>
          <p className="text-small text-text-2">
            Tercera barra: «Tareas» del estudiante no está en la barra inferior
            (se alcanza desde Inicio), así que ninguna columna queda activa.
          </p>
        </div>
      </Muestra>

      <Muestra title="Hoja Menú del profesor (Tareas, Equipos, Premios y Cerrar sesión)">
        <MenuDemo usuario={PROFESOR} />
      </Muestra>
    </Familia>
  );
}
