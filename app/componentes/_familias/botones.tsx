import { ArrowRight, Check, Copy, LogOut, Trash2 } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Familia, Muestra } from "./familia";

// Etiquetas de la lámina de componentes (design/canvas/Componentes.dc.html, "Botones")
const VARIANTS = [
  {
    variant: "primary",
    title: "Primario",
    label: "Entrar",
    loading: "Entrando…",
  },
  {
    variant: "secondary",
    title: "Secundario",
    label: "Ver equipo",
    loading: "Cargando…",
  },
  {
    variant: "ghost",
    title: "Fantasma",
    label: "Ver todas",
    loading: "Cargando…",
  },
  {
    variant: "danger",
    title: "Peligro",
    label: "Cerrar sesión",
    loading: "Saliendo…",
    icon: <LogOut aria-hidden="true" />,
  },
] as const satisfies readonly {
  variant: "primary" | "secondary" | "ghost" | "danger";
  title: string;
  label: string;
  loading: string;
  icon?: React.ReactNode;
}[];

const SIZES = [
  ["sm", "Pequeño · 36"],
  ["md", "Mediano · 44"],
  ["lg", "Grande · 52"],
] as const;

export function Botones() {
  return (
    <Familia
      id="botones"
      title="Botones"
      description="Cada variante en sus tres tamaños: reposo, cargando y deshabilitado. Hover, foco (Tab) y activo se ven al interactuar."
    >
      {VARIANTS.map((v) => (
        <Muestra key={v.variant} title={v.title}>
          <div className="flex flex-col gap-3">
            {SIZES.map(([size, sizeLabel]) => (
              <div key={size} className="flex flex-wrap items-center gap-3">
                <span className="text-small-b w-full text-text-2 md:w-28">
                  {sizeLabel}
                </span>
                <Button variant={v.variant} size={size}>
                  {"icon" in v ? v.icon : null}
                  {v.label}
                </Button>
                <Button
                  variant={v.variant}
                  size={size}
                  loading
                  loadingLabel={v.loading}
                >
                  {"icon" in v ? v.icon : null}
                  {v.label}
                </Button>
                <Button variant={v.variant} size={size} disabled>
                  {"icon" in v ? v.icon : null}
                  {v.label}
                </Button>
              </div>
            ))}
          </div>
        </Muestra>
      ))}

      <Muestra title="Solo ícono">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            icon
            aria-label="Copiar código KR-500-7F3A9C"
          >
            <Copy aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" icon aria-label="Eliminar pregunta">
            <Trash2 aria-hidden="true" />
          </Button>
          <Button
            variant="primary"
            icon
            loading
            aria-label="Copiar código KR-500-7F3A9C"
          >
            <Copy aria-hidden="true" />
          </Button>
        </div>
      </Muestra>

      <Muestra title="Ancho completo (block)">
        <div className="w-full max-w-sm">
          <Button size="lg" block>
            <Check aria-hidden="true" />
            Guardar nota y seguir
          </Button>
        </div>
      </Muestra>

      <Muestra title="Deshabilitado con razón">
        <div className="flex flex-col items-start gap-2">
          <Button disabled aria-describedby="botones-razon">
            Guardar nota y seguir
          </Button>
          <p id="botones-razon" className="text-small text-text-2">
            Se activa al puntuar las 5.
          </p>
        </div>
      </Muestra>

      <Muestra title="Como enlace (asChild)">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary">
            <Link href="/tokens">Ver tokens</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="#ranking">
              Ver ranking
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Muestra>

      <Muestra title="Spinner suelto">
        <div className="flex items-center gap-3 text-accent-ink">
          <Spinner label="Cargando el ranking" />
          <span className="text-small text-text-2">
            Con <code>label</code> se anuncia como estado; dentro de un botón es
            decorativo.
          </span>
        </div>
      </Muestra>
    </Familia>
  );
}
