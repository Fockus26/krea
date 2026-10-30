"use client";

import { Label as LabelPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/** Etiqueta de campo — HANDOFF §2.2: 14/20 700 en `--text`. */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn("text-label select-none text-text", className)}
      {...props}
    />
  );
}

export { Label };
