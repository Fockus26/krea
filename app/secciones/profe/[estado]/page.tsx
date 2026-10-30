import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PanelView } from "@/components/sections/profe-panel/panel-view";
import { panelDe } from "@/lib/demo/panel";
import { type FiltroSeccion, saludoTexto } from "@/lib/panel";
import { Estados } from "../../_vista/estados";
import { Vista } from "../../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Panel del profesor",
  robots: { index: false, follow: false },
};

const BASE = "/secciones/profe";
// Hora fija por estado: con `cacheComponents` el servidor no lee el reloj (D098). `filtro` es el del segmentado al abrir.
const ESTADOS = [
  ["manana", "Mañana (9 h)", 9, "ambas"],
  ["tarde", "Tarde (15 h)", 15, "ambas"],
  ["noche", "Noche (21 h)", 21, "ambas"],
  ["5c", "Sección 5C", 9, "5C"],
] as const satisfies ReadonlyArray<
  readonly [string, string, number, FiltroSeccion]
>;
type Estado = (typeof ESTADOS)[number];

function estadoDe(valor: string): Estado | undefined {
  return ESTADOS.find(([k]) => k === valor);
}

// Un estado por ruta estática (D072)
export function generateStaticParams() {
  return ESTADOS.map(([estado]) => ({ estado }));
}

// Ruta final (fase 05): /profe. Datos: seed real + cola y ajustes de ejemplo (lib/demo/panel.ts, D069).
export default async function PanelProfeVista({
  params,
}: PageProps<"/secciones/profe/[estado]">) {
  const estado = estadoDe((await params).estado);
  if (!estado) notFound();
  const [clave, , hora, filtro] = estado;
  return (
    <>
      <Estados
        base={BASE}
        actual={clave}
        estados={ESTADOS.map(([k, texto]) => [k, texto] as const)}
      />
      <Vista rol="profesor" ruta="/profe">
        <PanelView
          saludo={saludoTexto(hora)}
          datos={panelDe()}
          filtroInicial={filtro}
        />
      </Vista>
    </>
  );
}
