import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuestionHeader } from "@/components/krea/question-header";
import { BackLink } from "@/components/sections/shared/back-link";
import {
  AutorFila,
  IdealPorque,
  IdealRespuesta,
} from "@/components/sections/tareas/ideal-respuesta";
import { Card } from "@/components/ui/card";
import tareaSeed from "@/data/seed/tarea-identidad-marca.json";
import { verificarSesion } from "@/lib/dal";
import { idealAlumnoPagina } from "@/lib/datos/ideal";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import {
  AUTOR_PROFE_TEXTO,
  IDEAL_TITULO,
  NOTA_GENERAL_ALUMNO,
  NOTA_PREGUNTA_ALUMNO,
  RESPUESTA_IDEAL_ALUMNO,
  rutasVista,
  vistaIdeal,
} from "@/lib/ideal";
import { TAREA_GRUPAL_SEED } from "@/lib/seed-firestore";

type Props = PageProps<"/tareas/[tarea]/ideal">;

// Como /tareas/[tarea]: `cacheComponents` pide al menos un parámetro para validar el shell.
export function generateStaticParams() {
  return [{ tarea: tareaSeed.id }, { tarea: TAREA_GRUPAL_SEED.id }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tarea } = await params;
  const s = await verificarSesion();
  if (s?.rol !== "estudiante") return { title: IDEAL_TITULO };
  const d = await idealAlumnoPagina(tarea);
  return { title: d ? `${IDEAL_TITULO} · ${d.tarea.titulo}` : IDEAL_TITULO };
}

// Entrega ideal de una tarea (tanda 11-14 Z2, D430–D435). La autorización es del servidor
// (`idealAlumnoPagina`): tarea de su sección, ya cerrada, con una ideal vigente; si no, 404. Arriba el
// porqué general y el autor (avatar y nombre, el equipo, o los profes); por pregunta, enunciado,
// respuesta y su porqué. Nunca la nota, la base, el puntaje ni los comentarios del autor (D433).
// Las imágenes se firman aquí, después de autorizar y solo las que se pintan (D195).
export default async function IdealAlumnoPage({ params }: Props) {
  const id = (await params).tarea;
  const d = await idealAlumnoPagina(id);
  if (!d) notFound();
  const v = vistaIdeal({
    tarea: d.tarea,
    ideal: d.ideal,
    entrega: d.entrega,
    autor: d.autor,
  });
  const logo = v.autor.tipo === "equipo" ? v.autor.logoPath : null;
  const firmadas = await urlsFirmadas([
    ...rutasVista(v),
    ...(logo ? [logo] : []),
  ]);
  const urls = Object.fromEntries(firmadas);
  const nombre = v.autor.tipo === "profe" ? AUTOR_PROFE_TEXTO : v.autor.nombre;

  return (
    <>
      <BackLink href={`/tareas/${id}`}>{v.titulo}</BackLink>
      <header className="flex flex-col gap-1">
        <p className="text-eyebrow text-text-2">{IDEAL_TITULO}</p>
        <h1 className="text-h2 text-text">{v.titulo}</h1>
      </header>
      <Card className="flex flex-col gap-3">
        <AutorFila
          autor={v.autor}
          logoUrl={logo ? (firmadas.get(logo) ?? null) : null}
        />
        <IdealPorque titulo={NOTA_GENERAL_ALUMNO}>{v.nota}</IdealPorque>
      </Card>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {v.preguntas.map((p) => (
          <li key={p.id} className="list-none">
            <Card className="flex flex-col gap-3">
              <QuestionHeader
                numero={p.numero}
                enunciado={p.enunciado}
                valor={p.valor}
                variant="evaluar"
                level={2}
              />
              <div className="flex flex-col gap-1.5">
                <p className="text-eyebrow text-text-2">
                  {RESPUESTA_IDEAL_ALUMNO}
                </p>
                <IdealRespuesta
                  respuesta={p.respuesta}
                  urls={urls}
                  nombre={nombre}
                  numero={p.numero}
                />
              </div>
              {p.nota ? (
                <IdealPorque titulo={NOTA_PREGUNTA_ALUMNO}>
                  {p.nota}
                </IdealPorque>
              ) : null}
            </Card>
          </li>
        ))}
      </ol>
    </>
  );
}
