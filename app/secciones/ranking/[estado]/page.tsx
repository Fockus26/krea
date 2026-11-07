import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Ranking } from "@/components/sections/ranking/ranking";
import {
  AHORA_DEMO,
  ESTADOS_SLUG,
  type EstadoRanking,
  equipoIdDemo,
  estadoDeSlug,
  estadoSlug,
  itemsEquipos,
  itemsEstudiantes,
  movimientosDe,
} from "@/lib/demo/ranking";
import { CEDULA_DEMO } from "@/lib/demo/seed";
import { Estados } from "../../_vista/estados";
import { Vista } from "../../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Ranking",
  robots: { index: false, follow: false },
};

const BASE = "/secciones/ranking";
const TEXTOS: Record<string, string> = {
  estudiantes: "Estudiantes",
  equipos: "Equipos",
  profesor: "Profe · 5A",
  "profesor-equipos": "Profe · 5A equipos",
  "profesor-5c": "Profe · 5C",
  "profesor-5c-equipos": "Profe · 5C equipos",
};
const ESTADOS = ESTADOS_SLUG.map((s) => [s, TEXTOS[s]] as const);

// Un estado por ruta estática (D072): las pestañas y la sección son enlaces entre estas rutas (D095)
export function generateStaticParams() {
  return ESTADOS_SLUG.map((estado) => ({ estado }));
}

const href = (e: EstadoRanking) => `${BASE}/${estadoSlug(e)}`;

// Ruta final (fase 05): /ranking. Datos: seed de 5A/5C; Yeilin Duarte = «tú» (D069).
export default async function RankingVista({
  params,
}: PageProps<"/secciones/ranking/[estado]">) {
  const slug = (await params).estado;
  const estado = estadoDeSlug(slug);
  if (!estado) notFound();
  const { rol, seccion, vista } = estado;
  const items =
    vista === "estudiantes"
      ? itemsEstudiantes(seccion, rol === "estudiante" ? CEDULA_DEMO : null)
      : itemsEquipos(seccion, rol === "estudiante" ? equipoIdDemo() : null);
  return (
    <>
      <Estados base={BASE} actual={slug} estados={ESTADOS} />
      <Vista rol={rol} ruta="/ranking">
        <Ranking
          rol={rol}
          seccion={seccion}
          vista={vista}
          items={items}
          movimientos={movimientosDe(items)}
          ahora={AHORA_DEMO}
          enlaces={{
            vista: {
              estudiantes: href({ ...estado, vista: "estudiantes" }),
              equipos: href({ ...estado, vista: "equipos" }),
            },
            seccion:
              rol === "profesor"
                ? {
                    "5A": href({ ...estado, seccion: "5A" }),
                    "5C": href({ ...estado, seccion: "5C" }),
                  }
                : undefined,
          }}
        />
      </Vista>
    </>
  );
}
