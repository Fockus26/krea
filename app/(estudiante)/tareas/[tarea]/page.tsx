import { ClipboardX, Users } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import { QuestionCardDetail } from "@/components/krea/question-card-detail";
import { BackLink } from "@/components/sections/shared/back-link";
import { CaptainNotice } from "@/components/sections/tareas/captain-notice";
import {
  BotonEditarEntrega,
  EntregaEditable,
} from "@/components/sections/tareas/editar-entrega";
import { IdealEnlace } from "@/components/sections/tareas/ideal-enlace";
import { PartesIntegrante } from "@/components/sections/tareas/partes-integrante";
import { PrizeCard } from "@/components/sections/tareas/prize-card";
import { RepartoEnVivo } from "@/components/sections/tareas/reparto-en-vivo";
import { RepartoPanel } from "@/components/sections/tareas/reparto-panel";
import { TaskAnswerForm } from "@/components/sections/tareas/task-answer-form";
import { TaskDelivered } from "@/components/sections/tareas/task-delivered";
import { TaskHeader } from "@/components/sections/tareas/task-header";
import { Card } from "@/components/ui/card";
import tareaSeed from "@/data/seed/tarea-identidad-marca.json";
import { enviarEntrega, subirImagenRespuesta } from "@/lib/acciones/entregas";
import {
  aceptarParte,
  asignarParte,
  devolverParte,
  entregarParte,
  tomarParte,
} from "@/lib/acciones/partes";
import { verificarSesion } from "@/lib/dal";
import {
  datosAlumno,
  integrantesDe,
  partesDelEquipo,
} from "@/lib/datos/estudiante";
import { idealAlumno } from "@/lib/datos/ideal";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import { inicialEdicion, puedeEditar } from "@/lib/entregas";
import { cerradaParaTodos } from "@/lib/estado-tarea";
import { rutaIdealAlumno } from "@/lib/ideal";
import { rutasImagen } from "@/lib/modelo";
import { huellaDePartes } from "@/lib/partes";
import { imagenesConAlt, respuestaFirmada } from "@/lib/question";
import { TAREA_GRUPAL_SEED } from "@/lib/seed-firestore";
import {
  bloqueosEdicion,
  entregaVista,
  RESPUESTA_IMAGEN,
  repartoVista,
  rutasReparto,
} from "@/lib/vistas-estudiante";

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
const ACCIONES_REPARTO = {
  asignar: asignarParte,
  aceptar: aceptarParte,
  devolver: devolverParte,
  tomar: tomarParte,
};
const ACCIONES_PARTE = { subir: subirImagenRespuesta, entregar: entregarParte };

// Entrega (HANDOFF §3, W5): el modo sale de la sesión y de los datos (`entregaVista`). Responde
// quien puede enviar (individual, o el capitán en grupal, D012); el resto del equipo ve las
// preguntas bloqueadas. Ya enviada: «¡Tarea entregada!» con las respuestas; las imágenes se
// firman aquí, solo las que se pintan (D195). Sin evaluar y con la tarea abierta, quien la envía
// (el alumno o el capitán) la puede editar: «Editar entrega» abre el formulario con lo enviado (D395).
export default async function TareaPage({ params }: Props) {
  const id = (await params).tarea;
  const datos = await datosAlumno();
  const companeros = datos.equipo ? await integrantesDe(datos.equipo.id) : [];
  // Después de los datos de la sesión: abierta o cerrada para él en este instante (D451)
  const ahora = Date.now();
  const d = entregaVista(datos, id, companeros, ahora);
  if (d.estado === "no-existe") notFound();

  // Grupal abierta sin enviar: el reparto del equipo (D422), que se actualiza solo (D465)
  const conReparto =
    d.tipo === "grupal" &&
    datos.equipo !== null &&
    (d.estado === "responder" || d.estado === "lector");
  const entradaReparto = {
    vista: d,
    usuario: datos.usuario,
    equipo: datos.equipo,
    companeros,
    partes:
      conReparto && datos.equipo
        ? await partesDelEquipo(id, datos.equipo.id)
        : [],
  };

  // Ya enviada y sin evaluar: quien la envía la puede editar (D395)
  const suEntrega = datos.entregas.find((e) => e.tareaId === id) ?? null;
  const editable =
    d.estado === "entregada" &&
    puedeEditar(
      datos.usuario,
      datos.tareas.find((t) => t.id === id) ?? null,
      id,
      datos.equipo,
      suEntrega,
      ahora,
    );
  // Grupal: al editar, las partes aceptadas de otros siguen en solo lectura (D508)
  const partesEdicion =
    editable && d.tipo === "grupal" && datos.equipo
      ? await partesDelEquipo(id, datos.equipo.id)
      : [];

  // Respuestas en imagen (ya enviada o del reparto) y la foto del premio (D265), en una pasada
  const urls = await urlsFirmadas([
    ...(d.estado === "entregada"
      ? d.respuestas.flatMap((r) => (r?.tipo === "imagen" ? r.imagenPaths : []))
      : []),
    ...rutasReparto(entradaReparto),
    ...partesEdicion.flatMap((p) =>
      p.estado === "aceptada" ? rutasImagen(p.respuesta) : [],
    ),
    ...(d.premioFoto ? [d.premioFoto] : []),
  ]);
  const reparto = repartoVista({ ...entradaReparto, urls });
  const bloqueosEditar =
    partesEdicion.length > 0 && d.estado === "entregada"
      ? bloqueosEdicion({
          preguntas: d.preguntas,
          partes: partesEdicion,
          integrantes: suEntrega?.integrantes ?? [],
          capitanId: datos.equipo?.capitanId ?? null,
          companeros,
          urls,
        })
      : undefined;

  // Entrega ideal (D433): con la tarea cerrada para todos (D453); `idealAlumno` vuelve a
  // comprobar sección, cierre y vigencia
  const tareaDoc = datos.tareas.find((t) => t.id === id);
  const hayIdeal =
    tareaDoc !== undefined && cerradaParaTodos(tareaDoc, ahora)
      ? (await idealAlumno(id)) !== null
      : false;

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
      {d.premio ? (
        <PrizeCard
          premio={d.premio}
          tipo={d.tipo}
          fotoUrl={d.premioFoto ? urls.get(d.premioFoto) : null}
        />
      ) : null}
      {hayIdeal ? <IdealEnlace href={rutaIdealAlumno(id)} /> : null}
      {d.estado === "lector" && d.capitan ? (
        <CaptainNotice capitan={d.capitan} />
      ) : null}
      {conReparto ? (
        <RepartoEnVivo
          tareaId={id}
          version={huellaDePartes(entradaReparto.partes)}
        />
      ) : null}

      {d.estado === "entregada" ? (
        <EntregaEditable
          editable={editable}
          formulario={{
            tareaId: id,
            titulo: d.titulo,
            preguntas: d.preguntas,
            inicial: inicialEdicion(d.preguntas, d.respuestas, urls),
            bloqueos: bloqueosEditar,
            autor: datos.usuario.nombres.trim().split(/\s+/)[0] ?? "",
            titular: datos.usuario.cedula,
            acciones: ACCIONES,
            entregadaHref: `/tareas/${id}`,
          }}
        >
          <TaskDelivered
            quien={d.quien}
            fecha={d.fecha}
            hora={d.hora}
            evaluada={d.evaluada}
            notaHref={d.notaHref}
            volverHref="/tareas"
            accion={<BotonEditarEntrega />}
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
                  const imagen =
                    r.tipo === "imagen"
                      ? respuestaFirmada(
                          imagenesConAlt(r.imagenPaths, d.autor, i + 1),
                          urls,
                        )
                      : null;
                  return (
                    <QuestionCardDetail
                      key={p.id}
                      numero={i + 1}
                      enunciado={p.enunciado}
                      valor={p.valor}
                      obtenido={null}
                      respuesta={
                        r.tipo === "texto" || r.tipo === "url"
                          ? r
                          : (imagen ?? {
                              tipo: "texto",
                              texto: RESPUESTA_IMAGEN,
                            })
                      }
                      level={3}
                    />
                  );
                })}
              </ol>
            </section>
          ) : null}
        </EntregaEditable>
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
      ) : reparto?.modo === "integrante" ? (
        <PartesIntegrante
          tareaId={id}
          preguntas={d.preguntas}
          partes={reparto.partes}
          capitan={reparto.capitan}
          autor={datos.usuario.nombres.trim().split(/\s+/)[0] ?? ""}
          titular={datos.usuario.cedula}
          acciones={ACCIONES_PARTE}
        />
      ) : (
        <>
          {reparto?.modo === "capitan" ? (
            <RepartoPanel
              tareaId={id}
              filas={reparto.filas}
              integrantes={reparto.integrantes}
              acciones={ACCIONES_REPARTO}
            />
          ) : null}
          <TaskAnswerForm
            // Sin `key` que cambie: un refresco (en vivo, D465) no pierde lo que está escribiendo
            tareaId={id}
            titulo={d.titulo}
            preguntas={d.preguntas}
            inicial={reparto?.modo === "capitan" ? reparto.inicial : undefined}
            bloqueos={
              reparto?.modo === "capitan" ? reparto.bloqueos : undefined
            }
            tomar={reparto?.modo === "capitan" ? tomarParte : undefined}
            avisoEnvio={reparto?.modo === "capitan" ? reparto.aviso : null}
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
        </>
      )}
    </>
  );
}
