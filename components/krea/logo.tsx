import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * Logo e Isotipo — HANDOFF §5 y §8; design/canvas/krea.css:124-135.
 * Dos capas de public/brand (krea-logo-ink.svg / -splash.svg, D002) usadas como máscara:
 * el color sale de --accent / --splash del contexto, así que siguen al acento sin props ni hex.
 */
const logoCva = cva("relative block shrink-0 aspect-[1779/981]", {
  variants: {
    // Anchos de §5: 88 topbar · 132 lateral · 140 login móvil · 260 panel de login
    size: {
      topbar: "w-22",
      lateral: "w-33",
      "login-movil": "w-35",
      "login-panel": "w-65",
    },
  },
  defaultVariants: { size: "lateral" },
});

export type LogoSize = NonNullable<VariantProps<typeof logoCva>["size"]>;
export const LOGO_SIZES: readonly LogoSize[] = [
  "topbar",
  "lateral",
  "login-movil",
  "login-panel",
];

type Etiqueta = {
  /** `true` cuando el texto "KREA" está al lado: el dibujo es decorativo. */
  decorativo?: boolean;
  className?: string;
};

/** Palabra KREA: tinta = acento, gotas = `--splash`. Sobre un fondo de acento, `sobreAcento` usa `--on-accent`. */
export function Logo({
  size,
  sobreAcento = false,
  decorativo = false,
  className,
}: Etiqueta &
  VariantProps<typeof logoCva> & {
    /** Sobre `--accent` (login, correo): la tinta pasa a `--on-accent`. */
    sobreAcento?: boolean;
  }) {
  return (
    <span
      data-slot="logo"
      className={cn(logoCva({ size }), className)}
      {...(decorativo
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": "KREA Escuela Creativa" })}
    >
      <span
        className={cn(
          "absolute inset-0 krea-mask-ink",
          sobreAcento ? "bg-on-accent" : "bg-accent",
        )}
      />
      <span className="absolute inset-0 krea-mask-splash bg-splash" />
    </span>
  );
}

const isotipoCva = cva(
  "relative block shrink-0 overflow-hidden rounded-iso bg-accent",
  {
    variants: {
      size: {
        24: "size-6",
        32: "size-8",
        40: "size-10",
        48: "size-12",
        64: "size-16",
      },
    },
    defaultVariants: { size: 48 },
  },
);

export type IsotipoSize = NonNullable<VariantProps<typeof isotipoCva>["size"]>;
export const ISOTIPO_SIZES: readonly IsotipoSize[] = [24, 32, 40, 48, 64];

/** Baldosa con la "a" y sus gotas (corte recto a la izquierda, no se redibuja). Sigue el acento. */
export function Isotipo({
  size,
  decorativo = false,
  className,
}: Etiqueta & VariantProps<typeof isotipoCva>) {
  return (
    <span
      data-slot="isotipo"
      className={cn(isotipoCva({ size }), className)}
      {...(decorativo
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": "KREA" })}
    >
      <span className="absolute top-[10%] left-[12%] h-[80%] w-[76%]">
        <span className="absolute inset-0 krea-iso-ink bg-on-accent" />
        <span className="absolute inset-0 krea-iso-splash bg-splash" />
      </span>
    </span>
  );
}
