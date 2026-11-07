import { ClipboardX, Users } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import { QuestionCardDetail } from "@/components/krea/question-card-detail";
import { BackLink } from "@/components/sections/shared/back-link";
import { CaptainNotice } from "@/components/sections/tareas/captain-notice";
import { PrizeCard } from "@/components/sections/tareas/prize-card";
import { TaskAnswerForm } from "@/components/sections/tareas/task-answer-form";
import { TaskDelivered } from "@/components/sections/tareas/task-delivered";
import { TaskHeader } from "@/components/sections/tareas/task-header";
import { Card } from "@/components/ui/card";
import tareaSeed from "@/data/seed/tarea-identidad-marca.json";
import { enviarEntrega, subirImagenRespuesta } from "@/lib/acciones/entregas";
import { verificarSesion } from "@/lib/dal";
import { datosAlumno, integrantesDe } from "@/lib/datos/estudiante";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import { answerImageAlt } from "@/lib/question";
import { TAREA_GRUPAL_SEED } from "@/lib/seed-firestore";
import { entregaVista, RESPUESTA_IMAGEN } from "@/lib/vistas-estudiante";

type Props = PageProps<"/tareas/[tarea]">;

// `cacheComponents` pide al menos un parámetro para validar el shell: las tareas del seed. Las
// demás se renderizan al pedirlas (como /notas/[tarea], D189).
export function generateStaticParams() {
  return [{ tarea: tareaSeed.id }, { tarea: TAREA_GRUPAL_SEED.id }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tarea } = await params;
  const s = await verificarSesion();
  if (s?.rol !== "estudiante") return { title: "Tarea" };
  const t = (await datosAlumno()).tareas.find((x) => x.id === tarea);
  return { title: t ? `Tarea · ${t.titulo}` : "Tarea" };
}

const ACCIONES = { subir: subirImagenRespuesta, enviar: enviarEntrega };

// Entrega (HANDOFF §3, W5): el modo sale de la sesión y de los datos (`entregaVista`). Responde
// quien puede enviar (individual, o el capitán en grupal, D012); el resto del equipo ve las
// preguntas bloqueadas. Ya enviada: «¡Tarea entregada!» con las respuestas; las imágenes se
// firman aquí, solo las que se pintan (D195).
export default async function TareaPage({ params }: Props) {
  const id = (await params).tarea;
  const datos = await datosAlumno();
  const companeros = datos.equipo ? await integrantesDe(datos.equipo.id) : [];
  const d = entregaVista(datos, id, companeros);
  if (d.estado === "no-existe") notFound();

  const urls =
    d.estado === "entregada"
      ? await urlsFirmadas(
          d.respuestas.flatMap((r) =>
            r?.tipo === "imagen" ? [r.imagenPath] : [],
          ),
        )
      : new Map<string, string>();

  return (
    <>
      <BackLink href="/tareas">Tareas</BackLink>
      <TaskHeader
        tipo={d.tipo}
        eyebrow={d.eyebrow}
        titulo={d.titulo}
        vence={d.vence}
        puntos={d.puntos}
        entregada={d.estado === "entregada"}
      />
      {d.premio ? <PrizeCard premio={d.premio} /> : null}
      {d.estado === "lector" && d.capitan ? (
        <CaptainNotice capitan={d.capitan} />
      ) : null}

      {d.estado === "entregada" ? (
        <>
          <TaskDelivered
            quien={d.quien}
            fecha={d.fecha}
            hora={d.hora}
            evaluada={d.evaluada}
            notaHref={d.notaHref}
            inicioHref="/"
          />
          {d.respuestas.some((r) => r !== null) ? (
            <section
              aria-labelledby="respuestas"
              className="flex flex-col gap-3"
            >
              <h2 id="respuestas" className="text-h2 text-text">
                Respuestas enviadas
              </h2>
              <ol className="m-0 flex list-none flex-col gap-4 p-0">
                {d.preguntas.map((p, i) => {
                  const r = d.respuestas[i];
                  if (!r) return null;
                  const src =
                    r.tipo === "imagen" ? urls.get(r.imagenPath) : null;
                  return (
                    <QuestionCardDetail
                      key={p.id}
                      numero={i + 1}
                      enunciado={p.enunciado}
                      valor={p.valor}
                      obtenido={null}
                      respuesta={
                        r.tipo === "texto"
                          ? r
                          : src
                            ? {
                                tipo: "imagen",
                                src,
                                alt: answerImageAlt(d.autor, i + 1),
                              }
                            : { tipo: "texto", texto: RESPUESTA_IMAGEN }
                      }
                      level={3}
                    />
                  );
                })}
              </ol>
            </section>
          ) : null}
        </>
      ) : d.estado === "sin-equipo" ? (
        <Card>
          {/* PLACEHOLDER de copy (CONTENT_CHECKLIST fila 129) */}
          <EmptyState
            icon={Users}
            headingLevel={2}
            title="Todavía no tienes equipo"
            description="Esta tarea es grupal. Cuando tu profe te asigne un equipo, su capitán podrá entregarla."
          />
        </Card>
      ) : d.estado === "cerrada" ? (
        <Card>
          {/* PLACEHOLDER de copy (CONTENT_CHECKLIST fila 129) */}
          <EmptyState
            icon={ClipboardX}
            headingLevel={2}
            title="Esta tarea ya cerró"
            description="Ya no recibe entregas. Si crees que es un error, habla con tu profe."
          />
        </Card>
      ) : (
        <TaskAnswerForm
          tareaId={id}
          preguntas={d.preguntas}
          bloqueadaPor={
            d.estado === "lector"
              ? (d.capitan?.corto ?? "el capitán")
              : undefined
          }
          autor={d.estado === "responder" ? d.autor : ""}
          titular={datos.usuario.cedula}
          acciones={ACCIONES}
          entregadaHref="/tareas"
        />
      )}
    </>
  );
}
