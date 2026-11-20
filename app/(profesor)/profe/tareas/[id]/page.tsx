import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import { BackLink } from "@/components/sections/shared/back-link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { ReabrirTarea } from "@/components/sections/tareas-profe/reabrir-tarea";
import { TaskBuilder } from "@/components/sections/tareas-profe/task-builder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import tareaSeed from "@/data/seed/tarea-identidad-marca.json";
import {
  cerrarTarea,
  eliminarTarea,
  guardarTarea,
  reabrirTarea,
} from "@/lib/acciones/tareas";
import { verificarSesion } from "@/lib/dal";
import {
  entregasDeTarea,
  equiposTodos,
  tareaProfe,
  tieneEntregas,
  usuariosTodos,
} from "@/lib/datos/profesor";
import { catalogoSecciones } from "@/lib/datos/secciones";
import { estadoEfectivo } from "@/lib/estado-tarea";
import { diaDeInstante } from "@/lib/fecha";
import { titularesReabrir } from "@/lib/reabrir-tarea";
import { seccionesDe } from "@/lib/secciones";
import { TAREA_GRUPAL_SEED } from "@/lib/seed-firestore";
import { RUTA_TAREAS, rutaEntregasTarea } from "@/lib/tareas-profe";
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

// Constructor de una tarea de Firestore (HANDOFF §3; W6). El modo sale del estado efectivo en este
// instante (D451: vencida = cerrada) y de si ya hay entregas (D200). Cerrada (no importada):
// «Reabrir tarea» junto a «Ver notas» (D455). Una nota importada del Excel sin preguntas: aviso
// vacío en vez de inventarlas (D136, D152). Sin barra inferior; «Guardar borrador» en la topbar
// móvil (D130).
export default async function TareaProfePage({ params }: Props) {
  const { id } = await params;
  const t = await tareaProfe(id);
  if (!t) notFound();
  const [conEntregas, entregas, catalogo] = await Promise.all([
    tieneEntregas(id),
    entregasDeTarea(id),
    catalogoSecciones(),
  ]);
  // Después de los datos (nunca en el prerender, `cacheComponents`)
  const ahora = Date.now();
  const hoy = diaDeInstante(ahora);
  const modo = modoConstructor(t, conEntregas, ahora);
  const sinPreguntas = t.preguntas.length === 0;
  const reabrible =
    t.estado !== "borrador" &&
    !t.importada &&
    estadoEfectivo(t, ahora) === "cerrada";
  const [usuarios, equipos] = reabrible
    ? await Promise.all([usuariosTodos(), equiposTodos()])
    : [[], []];

  return (
    <>
      <div className="flex flex-col gap-2">
        <BackLink href={RUTA_TAREAS}>Tareas</BackLink>
        <PageHeader
          title={t.estado === "borrador" ? "Nueva tarea" : t.titulo}
          description={
            sinPreguntas || modo === "cerrada" ? undefined : DESCRIPCION
          }
          actions={
            t.estado === "borrador" ? undefined : (
              <>
                {reabrible ? (
                  <ReabrirTarea
                    tareaId={id}
                    tipo={t.tipo}
                    actualizadoEn={t.actualizadoEn}
                    hoy={hoy}
                    titulares={titularesReabrir({
                      tarea: t,
                      usuarios,
                      equipos,
                      entregas,
                      ahora,
                    })}
                    reabrir={reabrirTarea}
                  />
                ) : null}
                <Button asChild variant="secondary" size="sm">
                  <Link
                    href={rutaEntregasTarea(id)}
                    aria-label={`Ver notas de ${t.titulo}`}
                  >
                    Ver notas
                  </Link>
                </Button>
              </>
            )
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
          hoy={hoy}
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
