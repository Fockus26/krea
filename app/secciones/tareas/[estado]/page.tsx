import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuestionCardDetail } from "@/components/krea/question-card-detail";
import { BackLink } from "@/components/sections/shared/back-link";
import { CaptainNotice } from "@/components/sections/tareas/captain-notice";
import { PartesIntegrante } from "@/components/sections/tareas/partes-integrante";
import { PrizeCard } from "@/components/sections/tareas/prize-card";
import { RepartoPanel } from "@/components/sections/tareas/reparto-panel";
import { TaskAnswerForm } from "@/components/sections/tareas/task-answer-form";
import { TaskDelivered } from "@/components/sections/tareas/task-delivered";
import { TaskHeader } from "@/components/sections/tareas/task-header";
import {
  entregaDe,
  type ModoEntrega,
  type ModoReparto,
  repartoDe,
} from "@/lib/demo/entrega";
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
  // Reparto (D422, D529): una pregunta por estado; sin acciones, los controles no hacen nada
  ["reparto-capitan", "Reparto · capitana"],
  ["reparto-integrante", "Reparto · integrante"],
] as const satisfies ReadonlyArray<
  readonly [ModoEntrega | ModoReparto, string]
>;

type Modo = (typeof ESTADOS)[number][0];

function estadoDe(valor: string): Modo | undefined {
  return ESTADOS.find(([k]) => k === valor)?.[0];
}

// Un estado por ruta estática (D072)
export function generateStaticParams() {
  return ESTADOS.map(([estado]) => ({ estado }));
}

// Ruta final (fase 05): /tareas/[tarea]. Datos: tareas de ejemplo (fila 53) con el equipo real
// 5A-G2 (capitana Raquel Figueroa; Paola Padilla como integrante).
export default async function EntregaVista({
  params,
}: PageProps<"/secciones/tareas/[estado]">) {
  const modo = estadoDe((await params).estado);
  if (!modo) notFound();
  const reparto =
    modo === "reparto-capitan" || modo === "reparto-integrante"
      ? repartoDe(modo)
      : null;
  const d = entregaDe(
    modo === "reparto-capitan"
      ? "capitan"
      : modo === "reparto-integrante"
        ? "no-capitan"
        : modo,
  );
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
        {d.premio ? <PrizeCard premio={d.premio} tipo={d.tipo} /> : null}
        {d.capitan && !d.entregada ? (
          <CaptainNotice capitan={d.capitan} />
        ) : null}
        {d.entregada ? (
          <>
            <TaskDelivered
              quien={d.entregada.quien}
              fecha={d.entregada.fecha}
              hora={d.entregada.hora}
              volverHref="/secciones/tareas"
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
        ) : reparto?.modo === "reparto-integrante" ? (
          <PartesIntegrante
            tareaId={reparto.tareaId}
            preguntas={reparto.preguntas}
            partes={reparto.partes}
            capitan={reparto.capitan}
            autor={reparto.autor}
            titular={reparto.titular}
          />
        ) : reparto?.modo === "reparto-capitan" ? (
          <>
            <RepartoPanel
              tareaId={reparto.tareaId}
              filas={reparto.filas}
              integrantes={reparto.integrantes}
            />
            <TaskAnswerForm
              tareaId={reparto.tareaId}
              preguntas={reparto.preguntas}
              bloqueos={reparto.bloqueos}
              autor={reparto.autor}
              entregadaHref={`${BASE}/entregada`}
            />
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
