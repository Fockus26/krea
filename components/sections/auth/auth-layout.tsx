import type { ReactNode } from "react";
import { GradePill } from "@/components/krea/grade-pill";
import { Logo } from "@/components/krea/logo";

/**
 * Marco de Ingresar y Recuperar (HANDOFF §3; krea.css .auth). < 1024: tarjeta centrada máx. 440 (padding 24, desde 768 padding 40), radio 24,
 * `--shadow-2` en claro; en oscuro superficie `--surface-2` + borde `--divider`, sin sombra (D333, D334);
 * logo 140 arriba bajo 1024. ≥ 1024: formulario a la izquierda sin tarjeta y
 * panel de marca de 600 a la derecha. No pinta `<main>`: lo pone la página.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-auth">
      <div className="flex items-start justify-center px-4 py-8 md:items-center md:px-6 md:py-12 lg:px-12">
        <div className="flex w-full max-w-110 flex-col gap-6 rounded-lg bg-surface p-6 shadow-2 dark:border dark:border-divider dark:bg-surface-2 dark:shadow-none md:p-10 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:dark:border-0 lg:dark:bg-transparent">
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
      {/* Sin año ni secciones fijos: los crea el admin (D326). PROVISIONAL (CONTENT_CHECKLIST fila 170) */}
      <p className="text-small relative">Escuela Creativa del liceo</p>
    </aside>
  );
}
