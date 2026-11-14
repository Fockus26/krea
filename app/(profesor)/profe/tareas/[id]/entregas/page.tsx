import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/sections/shared/back-link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { TaskSubmissions } from "@/components/sections/tareas-profe/task-submissions";
import tareaSeed from "@/data/seed/tarea-identidad-marca.json";
import { verificarSesion } from "@/lib/dal";
import {
  entregasTodas,
  equiposTodos,
  tareaProfe,
  usuariosTodos,
} from "@/lib/datos/profesor";
import { TAREA_GRUPAL_SEED } from "@/lib/seed-firestore";
import { rutaTarea } from "@/lib/tareas-profe";
import {
  filasEntregasTarea,
  seccionElegida,
  seccionesDeFilas,
} from "@/lib/tareas-profe-entregas";

type Props = PageProps<"/profe/tareas/[id]/entregas">;

// Como el constructor: `cacheComponents` pide un parámetro de ejemplo para validar el shell.
export function generateStaticParams() {
  return [{ id: tareaSeed.id }, { id: TAREA_GRUPAL_SEED.id }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const s = await verificarSesion();
  if (s?.rol !== "profesor") return { title: "Entregas" };
  const t = await tareaProfe(id);
  return { title: t ? `Entregas · ${t.titulo}` : "Entregas" };
}

// Notas de una tarea (D398–D401): una fila por alumno o equipo con su estado, puntaje, base y nota,
// y el camino a corregir la evaluación. La sección viaja en `?seccion=`. Un borrador no tiene
// entregas: vuelve al constructor.
export default async function EntregasTareaPage({
  params,
  searchParams,
}: Props) {
  const [{ id }, consulta] = await Promise.all([params, searchParams]);
  const t = await tareaProfe(id);
  if (!t || t.estado === "borrador") notFound();
  const [entregas, usuarios, equipos] = await Promise.all([
    entregasTodas(),
    usuariosTodos(),
    equiposTodos(),
  ]);
  const filas = filasEntregasTarea({
    tarea: { id, tipo: t.tipo, secciones: t.secciones },
    entregas,
    usuarios,
    equipos,
  });
  const secciones = seccionesDeFilas(filas);
  const pedida = Array.isArray(consulta.seccion)
    ? consulta.seccion[0]
    : consulta.seccion;

  return (
    <>
      <div className="flex flex-col gap-2">
        <BackLink href={rutaTarea(id)}>{t.titulo}</BackLink>
        <PageHeader
          eyebrow={t.tipo === "grupal" ? "Tarea grupal" : "Tarea individual"}
          title={`Notas · ${t.titulo}`}
          description="Revisa el puntaje de cada entrega y corrige una evaluación si hace falta."
        />
      </div>
      <TaskSubmissions
        titulo={t.titulo}
        filas={filas}
        secciones={secciones}
        seccionInicial={seccionElegida(pedida, secciones)}
      />
    </>
  );
}
