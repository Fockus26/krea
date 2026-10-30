import { cva, type VariantProps } from "class-variance-authority";
import { Avatar as AvatarPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Avatar — HANDOFF §2.5; medidas en design/canvas/krea.css:279-280.
 * Tamaños 32 · 36 · 40 · 48 · 56 · 64 · 80 · 96 (escala de Tailwind, 1 unidad = 4 px).
 * `ring` = anillo "tú/elegido": 2 px de superficie + 2 px de acento (sigue el acento del contexto).
 */
export const avatarCva = cva(
  "relative flex shrink-0 cq-size overflow-hidden rounded-pill bg-surface-2 select-none",
  {
    variants: {
      size: {
        32: "size-8",
        36: "size-9",
        40: "size-10",
        48: "size-12",
        56: "size-14",
        64: "size-16",
        80: "size-20",
        96: "size-24",
      },
      ring: { true: "shadow-avatar-ring", false: "" },
    },
    defaultVariants: { size: 40, ring: false },
  },
);

export type AvatarSize = NonNullable<VariantProps<typeof avatarCva>["size"]>;
export const AVATAR_SIZES: readonly AvatarSize[] = [
  32, 36, 40, 48, 56, 64, 80, 96,
];

function Avatar({
  className,
  size,
  ring,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarCva>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size ?? 40}
      className={cn(avatarCva({ size, ring }), className)}
      {...props}
    />
  );
}

/** `alt` lo pasa quien llama: vacío cuando el nombre está al lado. */
function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      loading="lazy"
      decoding="async"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

/** Respaldo con iniciales: Poppins 700 al 38 % del lado. */
function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center bg-accent-soft-2 font-heading font-bold text-cq-avatar text-text uppercase",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
