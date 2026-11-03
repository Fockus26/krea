import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import { GradeSummary } from "@/components/sections/notas/grade-summary";
import { QuestionList } from "@/components/sections/notas/question-list";
import { BackLink } from "@/components/sections/shared/back-link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Card } from "@/components/ui/card";
import { CEDULA_DETALLE, detalleDe } from "@/lib/demo/notas";
import { TAREA_IDENTIDAD } from "@/lib/demo/seed";
import { TAREAS } from "@/lib/demo/tareas";

type Props = PageProps<"/notas/[tarea]">;

// Una página por tarea del ejemplo (los enlaces de Mis notas apuntan a todas)
export function generateStaticParams() {
  return TAREAS.map((t) => ({ tarea: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tarea } = await params;
  const t = TAREAS.find((x) => x.id === tarea);
  return { title: t ? `Nota · ${t.titulo}` : "Detalle de nota" };
}

// Detalle de nota (HANDOFF §3). Hoy solo «Identidad de marca» tiene respuestas y evaluación pregunta
// a pregunta en el seed (la nota es la de Heymi Sierra, como el lienzo; PLACEHOLDER hasta la fase 07).
// Las demás tareas muestran un aviso en vez de inventar el detalle (CONTENT_CHECKLIST fila 100).
export default async function DetalleNotaPage({ params }: Props) {
  const id = (await params).tarea;
  const tarea = TAREAS.find((t) => t.id === id);
  if (!tarea) notFound();

  if (tarea.id !== TAREA_IDENTIDAD.id) {
    return (
      <>
        <BackLink href="/notas">Mis notas</BackLink>
        <PageHeader
          eyebrow={tarea.tipo === "grupal" ? "Grupal" : "Individual"}
          title={tarea.titulo}
        />
        <Card>
          <EmptyState
            icon={ClipboardList}
            headingLevel={2}
            title="Todavía no hay detalle de esta nota"
            description="Cuando tu profe evalúe la tarea, aquí verás cómo salió cada pregunta."
          />
        </Card>
      </>
    );
  }

  const d = detalleDe(CEDULA_DETALLE);
  return (
    <>
      <BackLink href="/notas">Mis notas</BackLink>
      <GradeSummary
        tipo={d.tipo}
        eyebrow={d.eyebrow}
        titulo={d.titulo}
        puntaje={d.puntaje}
        base={d.base}
        final={d.final}
      />
      <QuestionList preguntas={d.preguntas} />
    </>
  );
}
