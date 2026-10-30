"use client";

import { useState } from "react";
import type { NavUsuario } from "@/components/layout/nav-types";
import { TopBar } from "@/components/layout/top-bar";
import { PortalScope } from "@/components/ui/portal-scope";

// Sección interactiva de la familia: el botón Menú abre la hoja dentro del escenario (D034)
export function MenuDemo({ usuario }: { usuario: NavUsuario }) {
  const [cierres, setCierres] = useState(0);
  return (
    <PortalScope>
      <div className="flex max-w-sm flex-col gap-3">
        <div className="flex h-topbar items-center gap-3 rounded-md border border-divider bg-topbar px-(--page-px)">
          <TopBar
            rol="profesor"
            pathname="/profe/tareas"
            usuario={usuario}
            onSignOut={() => setCierres((n) => n + 1)}
          />
        </div>
        <p aria-live="polite" className="text-small text-text-2">
          {cierres === 0
            ? "Abre el Menú: Tareas aparece activa."
            : `«Cerrar sesión» pulsado ${cierres} ${cierres === 1 ? "vez" : "veces"} (la sesión real llega en la fase 07).`}
        </p>
      </div>
    </PortalScope>
  );
}
