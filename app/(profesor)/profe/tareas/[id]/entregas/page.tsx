import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/sections/shared/back-link";
import { PageHeader } from "@/components/sections/shared/page-header";
import { EstadoIdeal } from "@/components/sections/tareas-profe/estado-ideal";
import { ReabrirTarea } from "@/components/sections/tareas-profe/reabrir-tarea";
import { TaskSubmissions } from "@/components/sections/tareas-profe/task-submissions";
import tareaSeed from "@/data/seed/tarea-identidad-marca.json";
import {
  devolverAlAlumno,
  eliminarEntrega,
} from "@/lib/acciones/devolver-entrega";
import { quitarIdealTarea } from "@/lib/acciones/ideales";
import { reabrirTarea } from "@/lib/acciones/tareas";
import { verificarSesion } from "@/lib/dal";
import { idealProfe } from "@/lib/datos/ideal";
import {
  entregasTodas,
  equiposTodos,
  tareaProfe,
  usuariosTodos,
} from "@/lib/datos/profesor";
import { cerradaParaTodos, estadoEfectivo } from "@/lib/estado-tarea";
import { diaDeInstante } from "@/lib/fecha";
import { estadoIdealProfe } from "@/lib/ideal";
import { titularesReabrir } from "@/lib/reabrir-tarea";
import { TAREA_GRUPAL_SEED } from "@/lib/seed-firestore";
import { rutaTarea } from "@/lib/tareas-profe";
import {
  filasEntregasTarea,
  seccionElegida,
  seccionesDeFilas,
} from "@/lib/tareas-profe-entregas";

type Props = PageProps<"/profe/tareas/[id]/entregas">;

const ACCIONES = { devolver: devolverAlAlumno, eliminar: eliminarEntrega };

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
// y el camino a corregir la evaluación; «Devolver al alumno» y «Eliminar entrega» en el menú de
// cada fila (D411–D415). Arriba, el estado de la entrega ideal (D430–D435): las filas con 20 / 20
// suman «Marcar como entrega ideal» al menú. La sección viaja en `?seccion=`. Un borrador no tiene entregas: vuelve
// al constructor.
export default async function EntregasTareaPage({
  params,
  searchParams,
}: Props) {
  const [{ id }, consulta] = await Promise.all([params, searchParams]);
  const t = await tareaProfe(id);
  if (!t || t.estado === "borrador") notFound();
  const [entregas, usuarios, equipos, ideal] = await Promise.all([
    entregasTodas(),
    usuariosTodos(),
    equiposTodos(),
    idealProfe(id),
  ]);
  const estadoIdeal = estadoIdealProfe(
    ideal,
    entregas.find((e) => e.id === ideal?.entregaId) ?? null,
    new Map(usuarios.map((u) => [u.cedula, u])),
    new Map(equipos.map((e) => [e.id, e])),
  );
  // Después de los datos: vencida sin prórroga = cerrada para ese titular (D451, D452)
  const ahora = Date.now();
  const cerrada = estadoEfectivo(t, ahora) === "cerrada";
  const filas = filasEntregasTarea({
    tarea: { ...t, id },
    entregas,
    usuarios,
    equipos,
    ahora,
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
          actions={
            cerrada && !t.importada ? (
              <ReabrirTarea
                tareaId={id}
                tipo={t.tipo}
                actualizadoEn={t.actualizadoEn}
                hoy={diaDeInstante(ahora)}
                titulares={titularesReabrir({
                  tarea: t,
                  usuarios,
                  equipos,
                  entregas: entregas.filter((e) => e.tareaId === id),
                  ahora,
                })}
                reabrir={reabrirTarea}
              />
            ) : undefined
          }
        />
      </div>
      <EstadoIdeal
        tareaId={id}
        estado={estadoIdeal}
        tareaAbierta={!cerradaParaTodos(t, ahora)}
        quitar={quitarIdealTarea}
      />
      <TaskSubmissions
        titulo={t.titulo}
        filas={filas}
        secciones={secciones}
        seccionInicial={seccionElegida(pedida, secciones)}
        acciones={ACCIONES}
        tareaCerrada={cerrada}
        idealEntregaId={
          estadoIdeal.tipo === "vigente" ? estadoIdeal.entregaId : null
        }
      />
    </>
  );
}
