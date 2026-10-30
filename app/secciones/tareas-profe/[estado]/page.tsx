import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/sections/shared/back-link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { TaskBuilder } from "@/components/sections/tareas-profe/task-builder";
import {
  BORRADOR_DEMO,
  BORRADOR_ID,
  HOY_DEMO,
  NUEVA_DEMO,
} from "@/lib/demo/tareas-profe";
import { RUTA_TAREAS } from "@/lib/tareas-profe";
import { Estados } from "../../_vista/estados";
import { Vista } from "../../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Constructor de tareas",
  robots: { index: false, follow: false },
};

const BASE = "/secciones/tareas-profe";
const ESTADOS = [
  ["nueva", "Nueva (1 pregunta)"],
  ["borrador", "Borrador (10 preguntas, suma 14)"],
] as const;
type Estado = (typeof ESTADOS)[number][0];

function estadoDe(valor: string): Estado | undefined {
  return ESTADOS.find(([k]) => k === valor)?.[0];
}

// Un estado por ruta estática (D072)
export function generateStaticParams() {
  return ESTADOS.map(([estado]) => ({ estado }));
}

// Rutas finales (fase 05): /profe/tareas/nueva y /profe/tareas/[id] (el borrador "plan-redes").
// Publicar vuelve a la lista de la vista previa; nada se guarda (fase 07).
export default async function ConstructorVista({
  params,
}: PageProps<"/secciones/tareas-profe/[estado]">) {
  const estado = estadoDe((await params).estado);
  if (!estado) notFound();
  const ruta =
    estado === "nueva" ? "/profe/tareas/nueva" : `/profe/tareas/${BORRADOR_ID}`;
  return (
    <>
      <Estados base={BASE} actual={estado} estados={ESTADOS} />
      <Vista
        rol="profesor"
        ruta={ruta}
        title="Nueva tarea"
        volverHref={RUTA_TAREAS}
      >
        <div className="flex flex-col gap-2">
          <BackLink href={RUTA_TAREAS}>Tareas</BackLink>
          {/* Copy del lienzo: el borrador también es una tarea nueva hasta publicarla */}
          <PageHeader
            title="Nueva tarea"
            description="Las preguntas tienen que sumar exactamente 20 puntos para publicar."
          />
        </div>
        <TaskBuilder
          key={estado}
          inicial={estado === "nueva" ? NUEVA_DEMO : BORRADOR_DEMO}
          hoy={HOY_DEMO}
          listaHref={BASE}
        />
      </Vista>
    </>
  );
}
