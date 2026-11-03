import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuestionCardDetail } from "@/components/krea/question-card-detail";
import { BackLink } from "@/components/sections/shared/back-link";
import { CaptainNotice } from "@/components/sections/tareas/captain-notice";
import { PrizeCard } from "@/components/sections/tareas/prize-card";
import { TaskAnswerForm } from "@/components/sections/tareas/task-answer-form";
import { TaskDelivered } from "@/components/sections/tareas/task-delivered";
import { TaskHeader } from "@/components/sections/tareas/task-header";
import { entregaDe, modoDe } from "@/lib/demo/entrega";
import { TAREAS } from "@/lib/demo/tareas";

type Props = PageProps<"/tareas/[tarea]">;

// Una página por tarea del ejemplo (los enlaces de Inicio y Tareas apuntan a todas)
export function generateStaticParams() {
  return TAREAS.map((t) => ({ tarea: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tarea } = await params;
  const t = TAREAS.find((x) => x.id === tarea);
  return { title: t ? `Tarea · ${t.titulo}` : "Tarea" };
}

// Entrega (HANDOFF §3): el modo sale de los datos (D140): evaluada = entregada, abierta grupal =
// capitana, abierta individual = individual. «No capitán» solo se ve en /secciones/tareas (la
// persona de ejemplo es capitana); la fase 07 lo decide con la sesión. El capitán es el único que
// envía la tarea grupal (D012).
export default async function TareaPage({ params }: Props) {
  const { tarea } = await params;
  const t = TAREAS.find((x) => x.id === tarea);
  if (!t) notFound();
  const d = entregaDe(modoDe(t), t.id);
  return (
    <>
      <BackLink href="/tareas">Tareas</BackLink>
      <TaskHeader
        tipo={d.tipo}
        eyebrow={d.eyebrow}
        titulo={d.titulo}
        vence={d.vence}
        puntos={d.puntos}
        entregada={d.entregada !== undefined}
      />
      {d.premio ? <PrizeCard premio={d.premio} /> : null}
      {d.capitan && !d.entregada ? <CaptainNotice capitan={d.capitan} /> : null}
      {d.entregada ? (
        <>
          <TaskDelivered
            quien={d.entregada.quien}
            fecha={d.entregada.fecha}
            hora={d.entregada.hora}
            inicioHref="/"
          />
          {d.entregada.respuestas.length > 0 ? (
            <section
              aria-labelledby="respuestas"
              className="flex flex-col gap-3"
            >
              <h2 id="respuestas" className="text-h2 text-text">
                Respuestas enviadas
              </h2>
              <ol className="m-0 flex list-none flex-col gap-4 p-0">
                {d.preguntas.map((p, i) => {
                  const respuesta = d.entregada?.respuestas[i];
                  return respuesta ? (
                    <QuestionCardDetail
                      key={p.id}
                      numero={i + 1}
                      enunciado={p.enunciado}
                      valor={p.valor}
                      obtenido={null}
                      respuesta={respuesta}
                      level={3}
                    />
                  ) : null;
                })}
              </ol>
            </section>
          ) : null}
        </>
      ) : (
        <TaskAnswerForm
          tareaId={d.tareaId}
          preguntas={d.preguntas}
          inicial={d.inicial}
          bloqueadaPor={d.capitan?.corto}
          autor={d.autor}
          entregadaHref="/tareas"
        />
      )}
    </>
  );
}
