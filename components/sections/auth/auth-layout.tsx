import type { ReactNode } from "react";
import { GradePill } from "@/components/krea/grade-pill";
import { Logo } from "@/components/krea/logo";

/**
 * Marco de Ingresar y Recuperar (HANDOFF §3; krea.css .auth). < 768: una columna, padding 32 16 48,
 * sin tarjeta, logo 140 arriba. 768–1023: tarjeta centrada máx. 440, padding 40, radio 24,
 * `--shadow-2` (en oscuro borde sin sombra, §8). ≥ 1024: formulario a la izquierda sin tarjeta y
 * panel de marca de 600 a la derecha. No pinta `<main>`: lo pone la página.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-auth">
      <div className="flex items-start justify-center px-4 pt-8 pb-12 md:items-center md:px-6 md:py-12">
        <div className="flex w-full max-w-110 flex-col gap-6 md:rounded-lg md:bg-surface md:p-10 md:shadow-2 md:dark:border md:dark:border-divider md:dark:shadow-none lg:rounded-none lg:bg-transparent lg:p-0 lg:dark:border-0">
          <Logo size="login-movil" className="lg:hidden" />
          {children}
        </div>
      </div>
      <BrandPanel />
    </div>
  );
}

/** Panel de marca ≥ 1024: decorativo entero (`aria-hidden`), como en el lienzo. */
function BrandPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden flex-col justify-between gap-8 overflow-hidden bg-accent p-14 text-on-accent lg:flex"
    >
      <span className="absolute -right-35 -bottom-40 size-130 rounded-pill bg-splash opacity-22" />
      <span className="absolute top-30 right-30 size-10 rounded-pill bg-splash opacity-55" />
      <Logo size="login-panel" sobreAcento decorativo />
      <div className="relative flex max-w-130 flex-col gap-4">
        <p className="text-claim">Tus notas, tu equipo y el ranking en vivo.</p>
        <p className="text-body">
          Mira pregunta por pregunta cómo te evaluaron y cuánto le sumas a tu
          equipo.
        </p>
        <div className="mt-2 flex gap-2">
          <GradePill nota={18.5} size="lg" />
          <GradePill nota={15} size="lg" />
          <GradePill nota={10} size="lg" />
        </div>
      </div>
      <p className="text-small relative">
        Escuela Creativa del liceo · 5.º año, secciones A y C
      </p>
    </aside>
  );
}
