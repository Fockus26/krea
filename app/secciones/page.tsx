import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardList, CardListItem } from "@/components/ui/card";
import { Apariencia } from "./_vista/apariencia";

// Índice interno de las vistas previas de secciones (fase 04, D066). No se indexa.
// Cada unidad de la fase añade su pantalla a PANTALLAS (una línea).
export const metadata: Metadata = {
  title: "Secciones",
  robots: { index: false, follow: false },
};

const PANTALLAS: ReadonlyArray<{ href: string; titulo: string; ruta: string }> =
  [
    {
      href: "/secciones/ingresar/login",
      titulo: "Ingresar y recuperar",
      ruta: "/ingresar",
    },
    { href: "/secciones/inicio", titulo: "Inicio del estudiante", ruta: "/" },
    { href: "/secciones/notas", titulo: "Mis notas", ruta: "/notas" },
    {
      href: "/secciones/notas/detalle",
      titulo: "Detalle de nota",
      ruta: "/notas/[tarea]",
    },
    { href: "/secciones/tareas", titulo: "Tareas", ruta: "/tareas" },
    {
      href: "/secciones/tareas/capitan",
      titulo: "Entrega de tarea",
      ruta: "/tareas/[tarea]",
    },
    {
      href: "/secciones/ranking/estudiantes",
      titulo: "Ranking",
      ruta: "/ranking",
    },
    {
      href: "/secciones/equipo/con-equipo",
      titulo: "Mi equipo",
      ruta: "/equipo",
    },
    { href: "/secciones/perfil", titulo: "Perfil", ruta: "/perfil" },
    {
      href: "/secciones/profe/manana",
      titulo: "Panel del profesor",
      ruta: "/profe",
    },
    {
      href: "/secciones/evaluar/grupal",
      titulo: "Evaluar entrega",
      ruta: "/profe/evaluar/[entrega]",
    },
  ];

export default function SeccionesPage() {
  return (
    <main
      id="contenido"
      tabIndex={-1}
      className="container-reading page-pad page-stack"
    >
      <header className="flex flex-col gap-2">
        <p className="text-eyebrow text-text-2">Referencia interna · fase 04</p>
        <h1 className="text-h1 text-text">Secciones</h1>
        <p className="text-body text-text-2">
          Cada pantalla montada con sus secciones y datos de ejemplo del seed.
          Revisa los 4 acentos en claro y oscuro (D001); el cambio se guarda en
          este navegador.
        </p>
      </header>
      <Card>
        <Apariencia />
      </Card>
      <Card>
        <h2 className="text-h2 mb-3 text-text">Pantallas</h2>
        {PANTALLAS.length === 0 ? (
          <p className="text-body text-text-2">
            Todavía no hay pantallas montadas.
          </p>
        ) : (
          <CardList>
            {PANTALLAS.map((p) => (
              <CardListItem key={p.href} asChild>
                <Link href={p.href} className="justify-between">
                  <span className="text-h4">{p.titulo}</span>
                  <span className="text-small nums text-text-2">{p.ruta}</span>
                </Link>
              </CardListItem>
            ))}
          </CardList>
        )}
      </Card>
    </main>
  );
}
