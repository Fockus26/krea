import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import { BackLink } from "@/components/sections/shared/back-link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { TaskBuilder } from "@/components/sections/tareas-profe/task-builder";
import { Card } from "@/components/ui/card";
import tareaSeed from "@/data/seed/tarea-identidad-marca.json";
import {
  cerrarTarea,
  eliminarTarea,
  guardarTarea,
} from "@/lib/acciones/tareas";
import { verificarSesion } from "@/lib/dal";
import {
  entregasDeTarea,
  tareaProfe,
  tieneEntregas,
} from "@/lib/datos/profesor";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { diaDeInstante } from "@/lib/fecha";
import { seccionesDe } from "@/lib/secciones";
import { TAREA_GRUPAL_SEED } from "@/lib/seed-firestore";
import { RUTA_TAREAS } from "@/lib/tareas-profe";
import {
  datosBorradorDe,
  modoConstructor,
  perdidaAlEliminar,
} from "@/lib/tareas-profe-datos";

type Props = PageProps<"/profe/tareas/[id]">;

// `cacheComponents` pide al menos un parámetro para validar el shell: las tareas del seed. Las
// demás (y los borradores nuevos) se renderizan al pedirlas (como /tareas/[tarea], D197).
export function generateStaticParams() {
  return [{ id: tareaSeed.id }, { id: TAREA_GRUPAL_SEED.id }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const s = await verificarSesion();
  if (s?.rol !== "profesor") return { title: "Tarea" };
  const t = await tareaProfe(id);
  return { title: t ? `Constructor · ${t.titulo}` : "Tarea" };
}

const ACCIONES = {
  guardar: guardarTarea,
  cerrar: cerrarTarea,
  eliminar: eliminarTarea,
};

const DESCRIPCION =
  "Las preguntas tienen que sumar exactamente 20 puntos para publicar.";

// Constructor de una tarea de Firestore (HANDOFF §3; W6). El modo sale del estado y de si ya hay
// entregas (D200). Una nota importada del Excel sin preguntas: aviso vacío en vez de inventarlas
// (D136, D152). Sin barra inferior; «Guardar borrador» en la topbar móvil (D130).
export default async function TareaProfePage({ params }: Props) {
  const { id } = await params;
  const t = await tareaProfe(id);
  if (!t) notFound();
  const [conEntregas, entregas, catalogo] = await Promise.all([
    tieneEntregas(id),
    entregasDeTarea(id),
    catalogoSecciones(),
  ]);
  const modo = modoConstructor(t, conEntregas);
  const sinPreguntas = t.preguntas.length === 0;

  return (
    <>
      <div className="flex flex-col gap-2">
        <BackLink href={RUTA_TAREAS}>Tareas</BackLink>
        <PageHeader
          title={t.estado === "borrador" ? "Nueva tarea" : t.titulo}
          description={
            sinPreguntas || modo === "cerrada" ? undefined : DESCRIPCION
          }
        />
      </div>
      {sinPreguntas ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            headingLevel={2}
            title="Todavía no hay preguntas de esta tarea"
            description="Cuando estén cargadas, aquí podrás revisarlas y editarlas."
          />
        </Card>
      ) : (
        <TaskBuilder
          inicial={datosBorradorDe(t)}
          secciones={seccionesDe(catalogo)}
          hoy={diaDeInstante(Date.now())}
          listaHref={RUTA_TAREAS}
          guardarEnTopbar
          tareaId={id}
          modo={modo}
          fechaGuardada={t.estado === "borrador" ? null : t.fechaEntrega}
          horaGuardada={
            t.estado === "borrador" ? null : (t.horaEntrega ?? null)
          }
          acciones={ACCIONES}
          perdida={perdidaAlEliminar(entregas)}
        />
      )}
    </>
  );
}
