"use client";

import { WifiOff } from "lucide-react";
import { useEnLinea } from "@/components/krea/use-en-linea";
import { Button, type ButtonProps } from "@/components/ui/button";

/*
 * Botón de una acción que NO se encola sin red (L41, D539): sin conexión queda `disabled` con el
 * rótulo «Sin conexión» (texto + ícono, no solo color). Lo que sí se encola (D292: «Entregar» del
 * alumno, guardar/publicar tarea del profe) usa `Button` a secas. Con red es `Button` tal cual.
 * `useEnLinea` vale `true` en servidor e hidratación: el marcado inicial no cambia.
 *
 * Las dos etiquetas comparten celda (como el spinner de `Button`): el ancho es el de la mayor y el
 * botón no salta cuando la red va y viene. Un botón solo-ícono (`icon`) no cabe con texto: muestra
 * `WifiOff`. En ambos casos, si el botón tenía `aria-label`, pasa a «Sin conexión: <nombre>» (el
 * rótulo visible va dentro del nombre accesible).
 */

// PROVISIONAL (CONTENT_CHECKLIST fila 296): copy pedido por César el 2026-11-07 («Sin conexión»).
export const ROTULO_SIN_CONEXION = "Sin conexión";

type Props = Extract<ButtonProps, { asChild?: false }>;

export function BotonEnLinea({ disabled, children, ...rest }: Props) {
  const enLinea = useEnLinea();
  // Un botón cargando conserva su estado (la acción ya salió); sin red solo se corta lo que no empezó.
  const sinRed = !enLinea && !rest.loading;
  if (!sinRed) {
    return (
      <Button {...rest} disabled={disabled}>
        {children}
      </Button>
    );
  }
  const nombre = rest["aria-label"];
  const aria = nombre ? `${ROTULO_SIN_CONEXION}: ${nombre}` : undefined;
  if (rest.icon) {
    return (
      <Button {...rest} disabled aria-label={aria ?? ROTULO_SIN_CONEXION}>
        <WifiOff aria-hidden="true" />
      </Button>
    );
  }
  return (
    <Button {...rest} disabled aria-label={aria}>
      <span className="grid">
        <span
          aria-hidden="true"
          className="icono-linea invisible col-start-1 row-start-1 inline-flex justify-center gap-2"
        >
          {children}
        </span>
        <span className="icono-linea col-start-1 row-start-1 inline-flex items-center justify-center gap-2">
          <WifiOff aria-hidden="true" />
          {ROTULO_SIN_CONEXION}
        </span>
      </span>
    </Button>
  );
}
