import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/sections/evaluar/review-form";
import { ReviewHeader } from "@/components/sections/evaluar/review-header";
import { COLA, evaluarVista } from "@/lib/demo/evaluar";
import { vecinos } from "@/lib/evaluar";
import { Estados } from "../../_vista/estados";
import { Vista } from "../../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Evaluar entrega",
  robots: { index: false, follow: false },
};

const BASE = "/secciones/evaluar";
/*
 * Un estado por entrega de la cola (D072), en su orden: así "Guardar" lleva al estado
 * siguiente como en la app. `grupal` = 1.ª (5 preguntas, 2 puntuadas), `individual` = 2.ª
 * (8 preguntas: ya con índice), `extremo` = 7.ª (10 preguntas, una de 7 → stepper).
 */
const ESTADOS = [
  ["grupal", "Grupal (1 de 7)"],
  ["individual", "Individual (2 de 7)"],
  ["stepper", "Valores > 6 (3 de 7)"],
  ["grupal-5c", "Grupal 5C (4 de 7)"],
  ["individual-5a", "Individual 5A (5 de 7)"],
  ["grupal-5a", "Grupal 5A (6 de 7)"],
  ["extremo", "Contenido extremo (7 de 7)"],
] as const satisfies readonly (readonly [string, string])[];

// Fin de la cola: en la app, la lista /profe/evaluar; aquí, el índice de vistas
const FIN_HREF = "/secciones";
const TITULO_ID = "entrega-titulo";

const hrefDe = (i: number) => `${BASE}/${ESTADOS[i]?.[0] ?? ""}`;

export function generateStaticParams() {
  return ESTADOS.map(([estado]) => ({ estado }));
}

// Ruta final (fase 05): /profe/evaluar/[entrega]. Datos: lib/demo/evaluar.ts (cola de 7, D104).
export default async function EvaluarVista({
  params,
}: PageProps<"/secciones/evaluar/[estado]">) {
  const { estado } = await params;
  const indice = ESTADOS.findIndex(([k]) => k === estado);
  if (indice < 0 || indice >= COLA.length) notFound();
  const v = evaluarVista(indice);
  const { anterior, siguiente } = vecinos(indice, v.total);

  return (
    <>
      <Estados base={BASE} actual={estado} estados={ESTADOS} />
      <Vista
        rol="profesor"
        ruta="/profe/evaluar"
        title={v.tituloTopbar}
        volverHref="/profe/evaluar"
      >
        <ReviewHeader
          eyebrow={v.eyebrow}
          titulo={v.titulo}
          tituloId={TITULO_ID}
          identidad={v.identidad}
          linea={v.linea}
          chips={v.chips}
          anteriorHref={anterior === null ? null : hrefDe(anterior)}
          saltarHref={siguiente === null ? null : hrefDe(siguiente)}
        />
        <ReviewForm
          key={v.entrega.id}
          entregaId={v.entrega.id}
          tituloId={TITULO_ID}
          tipo={v.entrega.tipo}
          preguntas={v.entrega.preguntas}
          inicial={{
            puntajes: v.entrega.preguntas.map((p) => p.puntaje ?? null),
            comentarios: v.entrega.preguntas.map((p) => p.comentario ?? ""),
            bases: v.bases,
          }}
          base={v.base}
          siguiente={v.siguiente}
          guardarHref={siguiente === null ? FIN_HREF : hrefDe(siguiente)}
          actualHref={hrefDe(indice)}
          integrantes={v.integrantes}
        />
      </Vista>
    </>
  );
}
