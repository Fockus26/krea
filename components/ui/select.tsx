"use client";

import { Check, ChevronDown, ChevronUp, CircleAlert, Lock } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import type * as React from "react";
import {
  controlClasses,
  controlState,
  isInvalid,
} from "@/components/ui/control";
import { joinIds, useFieldControl } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/*
 * Select — HANDOFF §2.2 (la caja es la de Input) y §6 (el popover entra con opacidad + escala .96
 * desde el disparador: `origin-trigger` + `animate-pop-in/out`, D027).
 */
function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  children,
  success,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  /** Éxito: borde `--success`. Dentro de un `Field` lo pone su prop `success`. */
  success?: boolean;
}) {
  const field = useFieldControl();
  const invalid = isInvalid(props["aria-invalid"] ?? field?.["aria-invalid"]);
  const state = controlState({
    invalid,
    success: success ?? field?.success,
    locked: Boolean(props.disabled),
  });

  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      {...props}
      id={props.id ?? field?.id}
      aria-invalid={props["aria-invalid"] ?? field?.["aria-invalid"]}
      aria-describedby={joinIds(
        props["aria-describedby"],
        field?.["aria-describedby"],
      )}
      className={controlClasses(
        state,
        "visible",
        cn(
          "cursor-pointer justify-between text-left select-none data-placeholder:text-text-2 *:data-[slot=select-value]:line-clamp-1",
          state === "locked" && "cursor-not-allowed",
          className,
        ),
      )}
    >
      {children}
      <span className="flex shrink-0 items-center gap-2">
        {state === "error" ? (
          <CircleAlert aria-hidden="true" className="size-5 text-error" />
        ) : null}
        {state === "locked" ? (
          <Lock aria-hidden="true" className="size-5 text-text-2" />
        ) : (
          <SelectPrimitive.Icon asChild>
            <ChevronDown
              aria-hidden="true"
              className="size-5 text-text-2 transition-transform duration-fast ease-krea in-data-[state=open]:rotate-180"
            />
          </SelectPrimitive.Icon>
        )}
      </span>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={sideOffset}
        className={cn(
          // z-popover (40): por encima de la barra inferior (z-action-bar 25) y la topbar (30)
          "relative z-popover max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) origin-trigger overflow-x-hidden overflow-y-auto rounded-md border border-divider bg-surface p-1.5 text-text shadow-3 dark:shadow-none",
          "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
          className,
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-eyebrow px-3 py-2 text-text-2", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "text-body relative flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-nav py-2 pr-10 pl-3 text-text outline-none select-none",
        // resaltado por teclado o puntero: fondo + contorno (el fondo solo no llega a 3:1)
        "data-[highlighted]:bg-accent-soft data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 data-[highlighted]:outline-focus",
        "data-[state=checked]:text-body-strong",
        "data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:text-text-dis",
        "[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="pointer-events-none absolute right-3 flex size-5 items-center justify-center text-accent-ink">
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden="true" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none my-1.5 h-px bg-divider", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center bg-surface py-1 text-text-2",
        className,
      )}
      {...props}
    >
      <ChevronUp aria-hidden="true" className="size-5" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center bg-surface py-1 text-text-2",
        className,
      )}
      {...props}
    >
      <ChevronDown aria-hidden="true" className="size-5" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
