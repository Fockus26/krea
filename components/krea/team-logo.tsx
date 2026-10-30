import { cva, type VariantProps } from "class-variance-authority";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { teamColorIndex, teamInitial } from "@/lib/identity";
import { cn } from "@/lib/utils";

/* TeamLogo — HANDOFF §2.5; medidas en design/canvas/krea.css:281-285 */
const teamLogoCva = cva(
  "relative flex shrink-0 cq-size overflow-hidden rounded-team bg-surface-2 select-none after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-team-edge after:content-['']",
  {
    variants: {
      size: {
        40: "size-10",
        56: "size-14",
        64: "size-16",
        72: "size-18",
        80: "size-20",
        96: "size-24",
        112: "size-28",
      },
    },
    defaultVariants: { size: 56 },
  },
);

export type TeamLogoSize = NonNullable<
  VariantProps<typeof teamLogoCva>["size"]
>;
export const TEAM_LOGO_SIZES: readonly TeamLogoSize[] = [
  40, 56, 64, 72, 80, 96, 112,
];

// Clases completas (Tailwind no ve nombres armados): bg-team-N ↔ --team-N en globals.css
const TEAM_BG = [
  "bg-team-1",
  "bg-team-2",
  "bg-team-3",
  "bg-team-4",
  "bg-team-5",
  "bg-team-6",
] as const;

export type TeamLogoProps = {
  /** Fija el color de respaldo: `hash(teamId) % 6`. */
  teamId: string;
  /** Tema del equipo (o su nombre si no hay tema): de ahí sale la inicial. */
  tema: string;
  /** Logo subido por el equipo; sin él (o si no carga) se muestra la inicial. */
  src?: string | null;
  size?: TeamLogoSize;
  /**
   * `false` (por defecto): el nombre del equipo está al lado y el logo es decorativo.
   * `true`: el logo es el único portador del nombre.
   */
  labelled?: boolean;
  className?: string;
};

/** Cuadrado de radio 28 % con el logo del equipo o, sin él, su inicial en blanco sobre uno de 6 colores fijos. */
export function TeamLogo({
  teamId,
  tema,
  src,
  size,
  labelled = false,
  className,
}: TeamLogoProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="team-logo"
      data-size={size ?? 56}
      className={cn(teamLogoCva({ size }), className)}
      {...(labelled
        ? { role: "img", "aria-label": `Logo del equipo ${tema}` }
        : { "aria-hidden": true })}
    >
      {src ? (
        <AvatarPrimitive.Image
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback
        delayMs={0}
        className={cn(
          "flex size-full items-center justify-center font-heading font-bold text-cq-team text-team-ink",
          TEAM_BG[teamColorIndex(teamId) - 1],
        )}
      >
        {teamInitial(tema)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
