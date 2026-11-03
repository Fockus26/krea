import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import { BackLink } from "@/components/sections/shared/back-link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { TaskBuilder } from "@/components/sections/tareas-profe/task-builder";
import { Card } from "@/components/ui/card";
import { TAREAS } from "@/lib/demo/tareas";
import {
  BORRADOR_DEMO,
  BORRADOR_ID,
  BORRADOR_TITULO,
  HOY_DEMO,
} from "@/lib/demo/tareas-profe";
import { type DatosBorrador, RUTA_TAREAS } from "@/lib/tareas-profe";

type Props = PageProps<"/profe/tareas/[id]">;

// Una página por enlace de la lista: las tareas de TAREAS + el borrador (D152)
export function generateStaticParams() {
  return [...TAREAS.map((t) => t.id), BORRADOR_ID].map((id) => ({ id }));
}

/** Datos del constructor para un id: el borrador, o la tarea de `TAREAS` con lo que trae (D152). */
function datosDe(id: string): { titulo: string; datos: DatosBorrador } | null {
  if (id === BORRADOR_ID)
    return { titulo: BORRADOR_TITULO, datos: BORRADOR_DEMO };
  const t = TAREAS.find((x) => x.id === id);
  if (!t) return null;
  return {
    titulo: t.titulo,
    datos: {
      titulo: t.titulo,
      tipo: t.tipo,
      fecha: t.fecha,
      premio: t.premio ?? "",
      preguntas: t.preguntas.map(({ enunciado, formato, valor }) => ({
        enunciado,
        formato,
        valor,
      })),
    },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const d = datosDe(id);
  return { title: d ? `Constructor · ${d.titulo}` : "Tarea" };
}

// Constructor de una tarea existente (HANDOFF §3). Si el seed no trae sus preguntas, aviso vacío en
// vez de inventarlas (D136, D152). Sin barra inferior; «Guardar borrador» en la topbar móvil (D130).
export default async function TareaProfePage({ params }: Props) {
  const { id } = await params;
  const d = datosDe(id);
  if (!d) notFound();
  const sinPreguntas = !d.datos.preguntas || d.datos.preguntas.length === 0;

  return (
    <>
      <div className="flex flex-col gap-2">
        <BackLink href={RUTA_TAREAS}>Tareas</BackLink>
        <PageHeader
          title={id === BORRADOR_ID ? "Nueva tarea" : d.titulo}
          description={
            sinPreguntas
              ? undefined
              : "Las preguntas tienen que sumar exactamente 20 puntos para publicar."
          }
        />
      </div>
      {sinPreguntas ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            headingLevel={2}
            title="Todavía no hay preguntas de esta tarea"
            description="Cuando estén cargadas, aquí podrás revisarlas y editarlas."
          />
        </Card>
      ) : (
        <TaskBuilder
          inicial={d.datos}
          hoy={HOY_DEMO}
          listaHref={RUTA_TAREAS}
          guardarEnTopbar
        />
      )}
    </>
  );
}
