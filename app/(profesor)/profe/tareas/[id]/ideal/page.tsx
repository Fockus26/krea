import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ErrorEnPantalla } from "@/components/estados/errores";
import { BackLink } from "@/components/sections/shared/back-link";
import { PageHeader } from "@/components/sections/shared/page-header";
import {
  type FormaIdeal,
  IdealForm,
} from "@/components/sections/tareas-profe/ideal-form";
import tareaSeed from "@/data/seed/tarea-identidad-marca.json";
import { guardarIdeal } from "@/lib/acciones/ideales";
import { verificarSesion } from "@/lib/dal";
import { idealProfePagina } from "@/lib/datos/ideal";
import { urlsFirmadas } from "@/lib/datos/imagenes";
import {
  entregaProfe,
  equiposTodos,
  tareaProfe,
  usuariosTodos,
} from "@/lib/datos/profesor";
import {
  autorDe,
  ESCRIBIR_IDEAL_TEXTO,
  errorIdealTexto,
  esElegible,
  respuestasDeEntrega,
  rutaIdealProfe,
} from "@/lib/ideal";
import { rutasImagen } from "@/lib/modelo";
import { TAREA_GRUPAL_SEED } from "@/lib/seed-firestore";
import { rutaEntregasTarea } from "@/lib/tareas-profe";

type Props = PageProps<"/profe/tareas/[id]/ideal">;

// Como Entregas: `cacheComponents` pide un parámetro de ejemplo para validar el shell.
export function generateStaticParams() {
  return [{ id: tareaSeed.id }, { id: TAREA_GRUPAL_SEED.id }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const s = await verificarSesion();
  if (s?.rol !== "profesor") return { title: "Entrega ideal" };
  const t = await tareaProfe(id);
  return { title: t ? `Entrega ideal · ${t.titulo}` : "Entrega ideal" };
}

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Entrega ideal de una tarea (tanda 11-14 Z2, D430–D435). `?entrega=` = parte de esa entrega (la
// fila de la lista); `?forma=profe` = el profe escribe la suya; sin nada, edita la guardada. Se
// puede preparar con la tarea abierta: los alumnos no la ven hasta que cierre (D433).
export default async function IdealTareaPage({ params, searchParams }: Props) {
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const t = await tareaProfe(id);
  if (!t || t.estado === "borrador") notFound();
  const ideal = await idealProfePagina(id);
  const volverHref = rutaEntregasTarea(id);

  const deProfe = uno(q.forma) === "profe";
  const entregaId = deProfe
    ? null
    : (uno(q.entrega) ?? ideal?.entregaId ?? null);
  const entrega = entregaId ? await entregaProfe(entregaId) : null;
  const elegible = entrega !== null && esElegible(entrega, id);

  const cabecera = (
    <div className="flex flex-col gap-2">
      <BackLink href={volverHref}>{`Notas · ${t.titulo}`}</BackLink>
      <PageHeader
        eyebrow="Entrega ideal"
        title={t.titulo}
        description="Los alumnos de la tarea la verán cuando cierre, con el porqué que escribas."
      />
    </div>
  );

  if (entregaId && !elegible) {
    return (
      <>
        {cabecera}
        <ErrorEnPantalla
          variant="warn"
          titulo="Esa entrega no se puede elegir"
          enlace={{
            href: rutaIdealProfe(id, { forma: "profe" }),
            label: ESCRIBIR_IDEAL_TEXTO,
          }}
        >
          {errorIdealTexto("no-elegible")}
        </ErrorEnPantalla>
      </>
    );
  }

  let forma: FormaIdeal = { tipo: "profe" };
  let urls: Record<string, string> = {};
  let logoUrl: string | null = null;
  const respuestas =
    entrega && elegible ? respuestasDeEntrega(t.preguntas, entrega) : null;
  if (entrega && elegible) {
    const [usuarios, equipos] = await Promise.all([
      usuariosTodos(),
      equiposTodos(),
    ]);
    const autor = autorDe(
      { entregaId: entrega.id },
      entrega,
      new Map(usuarios.map((u) => [u.cedula, u])),
      new Map(equipos.map((e) => [e.id, e])),
    );
    forma = { tipo: "entrega", entregaId: entrega.id, autor };
    const logo = autor.tipo === "equipo" ? autor.logoPath : null;
    const firmadas = await urlsFirmadas([
      ...Object.values(entrega.respuestas).flatMap(rutasImagen),
      ...(logo ? [logo] : []),
    ]);
    urls = Object.fromEntries(firmadas);
    logoUrl = logo ? (firmadas.get(logo) ?? null) : null;
  }

  // Lo guardado solo precarga la misma forma (la misma entrega, o la del profe)
  const misma =
    ideal !== null &&
    (forma.tipo === "entrega"
      ? ideal.entregaId === forma.entregaId
      : ideal.respuestas !== null);

  return (
    <>
      {cabecera}
      <IdealForm
        tareaId={id}
        forma={forma}
        preguntas={t.preguntas.map((p, i) => ({
          id: p.id,
          numero: i + 1,
          enunciado: p.enunciado,
          valor: p.valor,
          formato: p.formato,
          respuesta: respuestas?.[i] ?? null,
        }))}
        inicial={{
          nota: misma ? ideal.nota : "",
          notas: misma ? ideal.notas : {},
          respuestas: misma ? (ideal.respuestas ?? {}) : {},
        }}
        urls={urls}
        logoUrl={logoUrl}
        guardar={guardarIdeal}
        volverHref={volverHref}
      />
    </>
  );
}
