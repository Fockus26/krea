import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/sections/evaluar/review-form";
import { ReviewHeader } from "@/components/sections/evaluar/review-header";
import { COLA, evaluarVista } from "@/lib/demo/evaluar";
import { vecinos } from "@/lib/evaluar";

type Props = PageProps<"/profe/evaluar/[entrega]">;

const BASE = "/profe/evaluar";
const TITULO_ID = "entrega-titulo";

const hrefDe = (i: number) => `${BASE}/${COLA[i]?.id ?? ""}`;

// Una página por entrega de la cola (el Panel y Anterior/Saltar enlazan a todas)
export function generateStaticParams() {
  return COLA.map((e) => ({ entrega: e.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { entrega } = await params;
  const i = COLA.findIndex((e) => e.id === entrega);
  return {
    title: i < 0 ? "Evaluar" : `Evaluar · ${evaluarVista(i).titulo}`,
    robots: { index: false },
  };
}

// Evaluar entrega (HANDOFF §3): las mismas secciones que /secciones/evaluar, con la cola real.
// La topbar móvil (X y «Entrega n de m») sale de lib/topbar.ts; el Toaster es el global (D131).
export default async function EvaluarEntregaPage({ params }: Props) {
  const { entrega } = await params;
  const indice = COLA.findIndex((e) => e.id === entrega);
  if (indice < 0) notFound();
  const v = evaluarVista(indice);
  const { anterior, siguiente } = vecinos(indice, v.total);

  return (
    <>
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
        }}
        base={v.base}
        siguiente={v.siguiente}
        guardarHref={siguiente === null ? BASE : hrefDe(siguiente)}
        actualHref={hrefDe(indice)}
      />
    </>
  );
}
