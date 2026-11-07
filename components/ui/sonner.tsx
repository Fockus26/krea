"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import type * as React from "react";
import { Toaster as Sonner, type ToasterProps, toast } from "sonner";

/*
 * Toaster — toast de HANDOFF §2.14 (lienzo: design/canvas/krea.css:366, `.toast`).
 * Propio, sin `next-themes` (D015): `unstyled` + clases de tokens, así sigue al tema y al
 * acento por CSS del contenedor donde se monta, no por el prop `theme`.
 * Sonner inyecta su CSS sin capa: gana a las utilidades de Tailwind (en @layer), por eso
 * las pocas que pisan reglas suyas (posición, transición, foco, z-index) llevan `!`.
 * Dónde se monta: D035 (no en app/layout.tsx): uno por layout de grupo, junto al AppShell (D131).
 */

/** 4 s (§2.14). */
const TOAST_DURATION = 4000;

/*
 * < lg: sobre la barra inferior (D021) y, si la página tiene barra de acción, sobre ella (D131):
 * `--toast-bnav` (72, o 0 en rutas sin barra inferior) + `--toast-action` (alto medido de la
 * `ActionBar`, o 0) + 16 del borde, más la zona segura; los dos los fija app/globals.css.
 * Desde lg no hay barras: 24 del borde (el valor por defecto de Sonner).
 */
const offsetClasses =
  "[--toast-bottom:calc(var(--toast-bnav)_+_var(--toast-action)_+_1rem_+_env(safe-area-inset-bottom))] lg:[--toast-bottom:1.5rem]";

/** Clases de cada parte del toast (exportadas para las pruebas). */
const toastClassNames = {
  toast: [
    // mín. 52 alto · padding 12 16 · radio 16 · máx. 420 · --shadow-3 · 600 15/20
    "flex w-full max-w-105 icono-linea gap-3 rounded-md px-4 py-[max(--spacing(3),calc((--spacing(13)-1lh)/2))]",
    "bg-toast-bg text-nav text-toast-text shadow-3",
    // §6: entra translateY(16 → 0) + opacidad 250; sale solo con opacidad 150.
    // Con reduced motion las duraciones valen 0 (D017): aparece y desaparece sin movimiento.
    "transition-[transform,opacity,height]! duration-normal! ease-krea!",
    "not-data-[mounted=true]:[--y:translateY(1rem)]!",
    "data-[removed=true]:duration-fast! data-[removed=true]:data-[front=true]:[--y:translateY(0)]!",
    // Apilados detrás del primero: sin contenido visible (lo que hace Sonner con su estilo)
    "data-[expanded=false]:data-[front=false]:*:opacity-0",
    "focus-visible:outline-2! focus-visible:outline-offset-2 focus-visible:outline-focus!",
  ].join(" "),
  content: "flex min-w-0 flex-1 flex-col gap-0.5",
  title: "min-w-0",
  description: "text-small",
  icon: "icono-linea-caja [&_svg]:size-5",
  // Botón fantasma sm con el color del toast (el lienzo pone `color: inherit`)
  actionButton: [
    "inline-flex h-9 shrink-0 cursor-pointer items-center self-center -my-3 rounded-nav px-3.5 text-button-sm text-current max-lg:h-11",
    "transition-colors duration-fast ease-krea hover:bg-current/10",
    "focus-visible:outline-2! focus-visible:outline-offset-2 focus-visible:outline-current!",
  ].join(" "),
} satisfies NonNullable<ToasterProps["toastOptions"]>["classNames"];

/* Íconos 20 en el color del texto: la forma distingue ok de error (no solo el color). */
const toastIcons = {
  success: <CircleCheck aria-hidden="true" strokeWidth={2} />,
  error: <CircleAlert aria-hidden="true" strokeWidth={2} />,
} satisfies ToasterProps["icons"];

/**
 * Región de avisos. Sonner ya pinta la región viva (`aria-live="polite"`): no envolverla
 * en otra. Con `id`, solo muestra los toasts lanzados con ese `toasterId`.
 */
function Toaster({ className, style, ...props }: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      duration={TOAST_DURATION}
      containerAriaLabel="Notificaciones"
      className={["z-toast!", offsetClasses, className]
        .filter(Boolean)
        .join(" ")}
      // 420 = máx. del handoff (26,25 rem); Sonner lo usa como ancho de la pila
      style={{ "--width": "26.25rem", ...style } as React.CSSProperties}
      offset={{ bottom: "var(--toast-bottom)", right: "1.5rem" }}
      mobileOffset={{
        bottom: "var(--toast-bottom)",
        left: "1rem",
        right: "1rem",
      }}
      icons={toastIcons}
      toastOptions={{
        unstyled: true,
        classNames: toastClassNames,
        closeButtonAriaLabel: "Cerrar aviso",
      }}
      {...props}
    />
  );
}

export { TOAST_DURATION, Toaster, toast, toastClassNames };
