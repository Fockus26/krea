import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import { GradeSummary } from "@/components/sections/notas/grade-summary";
import { QuestionList } from "@/components/sections/notas/question-list";
import { BackLink } from "@/components/sections/shared/back-link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Card } from "@/components/ui/card";
import tareaSeed from "@/data/seed/tarea-identidad-marca.json";
import { verificarSesion } from "@/lib/dal";
import { datosAlumno } from "@/lib/datos/estudiante";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import { imagenesConAlt, respuestaFirmada } from "@/lib/question";
import { TAREA_GRUPAL_SEED } from "@/lib/seed-firestore";
import { detalleNota } from "@/lib/vistas-estudiante";

type Props = PageProps<"/notas/[tarea]">;

// `cacheComponents` pide al menos un parámetro para validar el shell: las tareas del seed. Las
// demás se renderizan al pedirlas (D189).
export function generateStaticParams() {
  return [{ tarea: tareaSeed.id }, { tarea: TAREA_GRUPAL_SEED.id }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tarea } = await params;
  const s = await verificarSesion();
  if (s?.rol !== "estudiante") return { title: "Detalle de nota" };
  const t = (await datosAlumno()).tareas.find((x) => x.id === tarea);
  return { title: t ? `Nota · ${t.titulo}` : "Detalle de nota" };
}

// Detalle de nota (HANDOFF §3) con su entrega evaluada (D189). Una tarea que no es de su sección
// (o borrador) es 404; sin evaluar todavía, el aviso en vez de inventar el detalle.
export default async function DetalleNotaPage({ params }: Props) {
  const id = (await params).tarea;
  const d = detalleNota(await datosAlumno(), id);
  if (d.estado === "no-existe") notFound();

  if (d.estado === "sin-detalle") {
    return (
      <>
        <BackLink href="/notas">Mis notas</BackLink>
        <PageHeader
          eyebrow={d.tipo === "grupal" ? "Grupal" : "Individual"}
          title={d.titulo}
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

  // Solo se firman las imágenes de esta entrega, que es suya (D195)
  const urls = await urlsFirmadas(
    d.preguntas.flatMap((p) => p.imagenPaths ?? []),
  );
  const preguntas = d.preguntas.map(({ imagenPaths, ...p }, i) => {
    const imagen = respuestaFirmada(
      imagenesConAlt(imagenPaths ?? [], d.autor, i + 1),
      urls,
    );
    return imagen ? { ...p, imagen } : p;
  });

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
        noParticipo={d.noParticipo}
      />
      {preguntas.length > 0 ? (
        <QuestionList preguntas={preguntas} />
      ) : (
        <Card>
          {/* PLACEHOLDER de copy (CONTENT_CHECKLIST fila 127): notas del Excel sin desglose */}
          <EmptyState
            icon={ClipboardList}
            headingLevel={2}
            title="Esta nota no tiene detalle por pregunta"
            description="Se cargó con el total, sin los puntos de cada pregunta."
          />
        </Card>
      )}
    </>
  );
}
