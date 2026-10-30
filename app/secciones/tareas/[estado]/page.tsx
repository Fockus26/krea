import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuestionCardDetail } from "@/components/krea/question-card-detail";
import { BackLink } from "@/components/sections/shared/back-link";
import { CaptainNotice } from "@/components/sections/tareas/captain-notice";
import { PrizeCard } from "@/components/sections/tareas/prize-card";
import { TaskAnswerForm } from "@/components/sections/tareas/task-answer-form";
import { TaskDelivered } from "@/components/sections/tareas/task-delivered";
import { TaskHeader } from "@/components/sections/tareas/task-header";
import { entregaDe, type ModoEntrega } from "@/lib/demo/entrega";
import { Estados } from "../../_vista/estados";
import { Vista } from "../../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Entrega",
  robots: { index: false, follow: false },
};

const BASE = "/secciones/tareas";
const ESTADOS = [
  ["capitan", "Grupal · capitana"],
  ["no-capitan", "Grupal · no capitán"],
  ["individual", "Individual"],
  ["entregada", "Entregada"],
] as const satisfies ReadonlyArray<readonly [ModoEntrega, string]>;

function estadoDe(valor: string): ModoEntrega | undefined {
  return ESTADOS.find(([k]) => k === valor)?.[0];
}

// Un estado por ruta estática (D072)
export function generateStaticParams() {
  return ESTADOS.map(([estado]) => ({ estado }));
}

// Ruta final (fase 05): /tareas/[tarea]. Datos: tareas de ejemplo (fila 53) con el equipo real
// 5A-G2 (capitana Yeilin Duarte; Wendoly Ponce como integrante).
export default async function EntregaVista({
  params,
}: PageProps<"/secciones/tareas/[estado]">) {
  const modo = estadoDe((await params).estado);
  if (!modo) notFound();
  const d = entregaDe(modo);
  return (
    <>
      <Estados base={BASE} actual={modo} estados={ESTADOS} />
      <Vista
        rol="estudiante"
        ruta="/tareas"
        width="lectura"
        title={d.tipo === "grupal" ? "Tarea grupal" : "Tarea individual"}
        volverHref={BASE}
      >
        <BackLink href={BASE}>Tareas</BackLink>
        <TaskHeader
          tipo={d.tipo}
          eyebrow={d.eyebrow}
          titulo={d.titulo}
          vence={d.vence}
          puntos={d.puntos}
          entregada={d.entregada !== undefined}
        />
        {d.premio ? <PrizeCard premio={d.premio} /> : null}
        {d.capitan && !d.entregada ? (
          <CaptainNotice capitan={d.capitan} />
        ) : null}
        {d.entregada ? (
          <>
            <TaskDelivered
              quien={d.entregada.quien}
              fecha={d.entregada.fecha}
              hora={d.entregada.hora}
              inicioHref="/secciones/inicio"
            />
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
          </>
        ) : (
          <TaskAnswerForm
            tareaId={d.tareaId}
            preguntas={d.preguntas}
            inicial={d.inicial}
            bloqueadaPor={d.capitan?.corto}
            autor={d.autor}
            entregadaHref={`${BASE}/entregada`}
          />
        )}
      </Vista>
    </>
  );
}
