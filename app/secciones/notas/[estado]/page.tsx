import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GradeSummary } from "@/components/sections/notas/grade-summary";
import { QuestionList } from "@/components/sections/notas/question-list";
import { BackLink } from "@/components/sections/shared/back-link";
import { CEDULA_DETALLE, CEDULA_RASPADO, detalleDe } from "@/lib/demo/notas";
import { Estados } from "../../_vista/estados";
import { Vista } from "../../_vista/vista";

export const metadata: Metadata = {
  title: "Secciones · Detalle de nota",
  robots: { index: false, follow: false },
};

const BASE = "/secciones/notas";
const ESTADOS = [
  ["detalle", "Detalle · base 20"],
  ["con-base", "Detalle · base 15"],
  ["raspado", "Detalle · raspado"],
] as const;
type Estado = (typeof ESTADOS)[number][0];

function estadoDe(valor: string): Estado | undefined {
  return ESTADOS.find(([k]) => k === valor)?.[0];
}

// Un estado por ruta estática (D072)
export function generateStaticParams() {
  return ESTADOS.map(([estado]) => ({ estado }));
}

/** PLACEHOLDER: la base 15 del lienzo es de ejemplo; en el seed todos tienen base 20. */
const BASE_EJEMPLO = 15;

// Ruta final (fase 05): /notas/[tarea]. Datos: "Identidad de marca" del seed (Elsa Soto;
// Alejandra Montero para el raspado).
export default async function DetalleNotaVista({
  params,
}: PageProps<"/secciones/notas/[estado]">) {
  const estado = estadoDe((await params).estado);
  if (!estado) notFound();
  const d =
    estado === "raspado"
      ? detalleDe(CEDULA_RASPADO)
      : detalleDe(
          CEDULA_DETALLE,
          estado === "con-base" ? BASE_EJEMPLO : undefined,
        );
  return (
    <>
      <Estados base={BASE} actual={estado} estados={ESTADOS} />
      <Vista
        rol="estudiante"
        ruta="/notas"
        width="lectura"
        title={d.titulo}
        volverHref={BASE}
      >
        <BackLink href={BASE}>Mis notas</BackLink>
        <GradeSummary
          tipo={d.tipo}
          eyebrow={d.eyebrow}
          titulo={d.titulo}
          puntaje={d.puntaje}
          base={d.base}
          final={d.final}
        />
        <QuestionList preguntas={d.preguntas} />
      </Vista>
    </>
  );
}
