import type { Metadata } from "next";

// Página de referencia interna de los tokens (fase 01). No se indexa.
export const metadata: Metadata = {
  title: "Tokens · KREA",
  robots: { index: false, follow: false },
};

const ACCENTS = ["azul", "rojo", "verde", "morado"] as const;
const THEMES = ["light", "dark"] as const;

const NEUTRALS = [
  "bg",
  "surface",
  "surface-2",
  "surface-3",
  "text",
  "text-2",
  "text-dis",
  "divider",
  "input",
  "success",
  "warning",
  "error",
  "secondary",
  "on-secondary",
  "grade-ink",
  "grade-ink-on-dark",
  "sel-text",
  "scroll-thumb",
  "scroll-track",
  "toast-bg",
  "toast-text",
] as const;

const ACCENT_TOKENS = [
  "accent",
  "on-accent",
  "accent-ink",
  "accent-soft",
  "accent-soft-2",
  "accent-hover",
  "sel-bg",
  "splash",
] as const;

const TINTS = [
  "chip-ok-bg",
  "chip-warn-bg",
  "chip-err-bg",
  "chip-prize-bg",
  "alert-err-bg",
  "alert-warn-bg",
  "alert-ok-bg",
] as const;

const TYPE_ROLES = [
  ["text-display", "Display 18,5"],
  ["text-h1", "Título h1"],
  ["text-h2", "Título h2"],
  ["text-h3", "Título h3"],
  ["text-h4", "Título de fila h4"],
  ["text-body", "Texto de cuerpo en Nunito Sans"],
  ["text-body-strong", "Cuerpo en negrita"],
  ["text-label", "Etiqueta"],
  ["text-small", "Texto pequeño y metadatos"],
  ["text-small-b", "Texto pequeño en negrita"],
  ["text-eyebrow", "Sobretítulo"],
  ["text-button", "Botón md"],
  ["text-button-sm", "Botón sm"],
  ["text-button-lg", "Botón lg"],
  ["text-grade-sm", "14,5"],
  ["text-grade-md", "16,5"],
  ["text-grade-lg", "18,5"],
  ["text-grade-xl", "19,5"],
] as const;

const RADII = [
  ["rounded-sm", "--r-sm · 10 px"],
  ["rounded-nav", "--r-nav · 12 px"],
  ["rounded-md", "--r-md · 16 px"],
  ["rounded-lg", "--r-lg · 24 px"],
  ["rounded-pill", "--r-full · 999 px"],
] as const;

const SHADOWS = ["shadow-1", "shadow-2", "shadow-3"] as const;

const DURATIONS = [
  ["--d-fast", "150 ms"],
  ["--d-normal", "250 ms"],
  ["--d-rank", "600 ms"],
  ["--d-celebrate", "1200 ms"],
] as const;

const EASES = [
  ["--ease", "cubic-bezier(.2,.8,.2,1)"],
  ["--bounce", "cubic-bezier(.34,1.56,.64,1)"],
] as const;

const Z_INDEX = [
  ["--z-content", "0"],
  ["--z-table-head", "1"],
  ["--z-rank-moving", "2"],
  ["--z-sticky", "20"],
  ["--z-action-bar", "25"],
  ["--z-topbar", "30"],
  ["--z-popover", "40"],
  ["--z-offline", "40"],
  ["--z-overlay", "50"],
  ["--z-toast", "60"],
] as const;

const SPACING = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20] as const;

function Swatch({ token }: { token: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="h-8 w-12 shrink-0 rounded-sm border border-divider"
        style={{ background: `var(--${token})` }}
      />
      <code className="text-small nums text-text">--{token}</code>
    </li>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">{title}</h2>
      {children}
    </section>
  );
}

export default function TokensPage() {
  return (
    <main
      id="contenido"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 md:px-8"
    >
      <header className="flex flex-col gap-2">
        <p className="text-eyebrow text-text-2">Referencia interna</p>
        <h1 className="text-h1">Tokens de KREA</h1>
        <p className="text-body text-text-2">
          Todos los valores de HANDOFF §1 en el tema y acento activos. Cambia el
          tema del sistema o <code>krea-theme</code> / <code>krea-accent</code>{" "}
          en localStorage para verlos en otro modo.
        </p>
      </header>

      <Section title="Neutros y estados">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NEUTRALS.map((t) => (
            <Swatch key={t} token={t} />
          ))}
        </ul>
      </Section>

      <Section title="Acento activo">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACCENT_TOKENS.map((t) => (
            <Swatch key={t} token={t} />
          ))}
        </ul>
        <p className="text-small text-text-2">
          Texto normal sobre accent-soft-2 va en <code>--text</code>; el acento
          como texto solo en íconos o texto de 19 px en negrita o más
          (COLORS.md).
        </p>
      </Section>

      <Section title="Tintes de chips y avisos">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TINTS.map((t) => (
            <Swatch key={t} token={t} />
          ))}
        </ul>
      </Section>

      <Section title="Acentos × claro / oscuro">
        <div className="grid gap-4 md:grid-cols-2">
          {THEMES.flatMap((theme) =>
            ACCENTS.map((accent) => (
              <div
                key={`${theme}-${accent}`}
                data-theme={theme}
                data-accent={accent}
                className="flex flex-col gap-3 rounded-md border border-divider bg-bg p-4 text-text"
              >
                <p className="text-label">
                  {theme === "light" ? "Claro" : "Oscuro"} · {accent}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-accent px-4 py-2 text-button text-on-accent">
                    accent / on-accent
                  </span>
                  <span className="rounded-md bg-accent-soft px-4 py-2 text-button text-text">
                    <span className="text-accent-ink">●</span> soft
                  </span>
                  <span className="rounded-md bg-accent-soft-2 px-4 py-2 text-button text-text">
                    <span className="text-accent-ink">●</span> soft-2
                  </span>
                  <span className="rounded-md bg-surface px-4 py-2 text-button text-accent-ink">
                    accent-ink
                  </span>
                  <span className="rounded-md bg-accent-hover px-4 py-2 text-button text-on-accent">
                    hover
                  </span>
                  <span
                    aria-hidden="true"
                    className="size-8 rounded-pill bg-splash"
                  />
                </div>
              </div>
            )),
          )}
        </div>
      </Section>

      <Section title="Tipografía por rol">
        <ul className="flex flex-col divide-y divide-divider rounded-md border border-divider bg-surface">
          {TYPE_ROLES.map(([cls, sample]) => (
            <li
              key={cls}
              className="flex flex-col gap-1 p-4 md:flex-row md:items-baseline md:gap-6"
            >
              <code className="text-small w-44 shrink-0 text-text-2">
                {cls}
              </code>
              <span className={`${cls} nums`}>{sample}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Espaciado (base 4 px: clases de Tailwind 1 … 20)">
        <ul className="flex flex-col gap-2">
          {SPACING.map((n) => (
            <li key={n} className="flex items-center gap-3">
              <code className="text-small nums w-24 shrink-0">
                {n} · {n * 4} px
              </code>
              <span
                aria-hidden="true"
                className="h-3 rounded-sm bg-accent"
                style={{ width: `calc(var(--spacing) * ${n})` }}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Radios">
        <ul className="flex flex-wrap gap-4">
          {RADII.map(([cls, label]) => (
            <li key={cls} className="flex flex-col items-center gap-2">
              <span
                aria-hidden="true"
                className={`size-20 border-2 border-accent-ink bg-accent-soft ${cls}`}
              />
              <code className="text-small">{cls}</code>
              <span className="text-small text-text-2">{label}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Sombras">
        <ul className="flex flex-wrap gap-6">
          {SHADOWS.map((cls) => (
            <li key={cls} className="flex flex-col items-center gap-3">
              <span
                aria-hidden="true"
                className={`size-24 rounded-md bg-surface ${cls}`}
              />
              <code className="text-small">{cls}</code>
            </li>
          ))}
        </ul>
        <p className="text-small text-text-2">
          En oscuro la tarjeta en reposo se separa con borde 1 px{" "}
          <code>--divider</code> (lo aplica el componente Card).
        </p>
      </Section>

      <Section title="Movimiento">
        <ul className="grid gap-2 sm:grid-cols-2">
          {DURATIONS.map(([name, value]) => (
            <li key={name} className="flex gap-3">
              <code className="text-small w-36 shrink-0">{name}</code>
              <span className="text-small nums text-text-2">{value}</span>
            </li>
          ))}
          {EASES.map(([name, value]) => (
            <li key={name} className="flex gap-3">
              <code className="text-small w-36 shrink-0">{name}</code>
              <span className="text-small nums text-text-2">{value}</span>
            </li>
          ))}
        </ul>
        <p className="text-small text-text-2">
          Con movimiento reducido las duraciones pasan a 0 ms.
        </p>
      </Section>

      <Section title="Capas (z-index)">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Z_INDEX.map(([name, value]) => (
            <li key={name} className="flex gap-3">
              <code className="text-small w-40 shrink-0">{name}</code>
              <span className="text-small nums text-text-2">{value}</span>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
