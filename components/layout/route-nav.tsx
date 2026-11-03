"use client";

import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SideNav } from "@/components/layout/side-nav";
import { TopBar } from "@/components/layout/top-bar";
import { TopBarAccionDestino } from "@/components/layout/top-bar-accion";
import { anchoDe, mainClass, type Rol } from "@/lib/layout";
import { type TitulosTopbar, topbarDe } from "@/lib/topbar";

/*
 * Envoltorios con la ruta real (D063): leen `usePathname()` y se la pasan a los componentes de
 * navegación, que por sí solos reciben `pathname` por prop (así /componentes muestra cada
 * estado activo sin navegar). Se enchufan en los slots de `AppShell` desde un layout:
 *   <AppShell role=… anchoPorRuta sidebar={<RouteSideNav …/>} topbar={<RouteTopBar …/>} bottomNav={<RouteBottomNav …/>}>
 * La variante de la topbar, la barra inferior y el ancho salen de `pathname` con funciones puras
 * (`topbarDe` en lib/topbar.ts, D128; `anchoDe` en lib/layout.ts, D129).
 */
export function RouteSideNav(
  props: Omit<ComponentProps<typeof SideNav>, "pathname">,
) {
  return <SideNav {...props} pathname={usePathname()} />;
}

type TopBarRutaProps = Omit<
  ComponentProps<typeof TopBar>,
  | "pathname"
  | "title"
  | "volverHref"
  | "volverLabel"
  | "volverIcono"
  | "enVivo"
  | "accion"
  | "soloAccion"
> & {
  /** Títulos que dependen de datos, por ruta (los arma el layout en el servidor). */
  titulos?: TitulosTopbar;
};

export function RouteTopBar({ titulos, ...props }: TopBarRutaProps) {
  const pathname = usePathname();
  const t = topbarDe(props.rol, pathname, titulos);
  return (
    <TopBar
      {...props}
      pathname={pathname}
      title={t.titulo}
      volverHref={t.volver?.href}
      volverLabel={t.volver?.label}
      volverIcono={t.variante === "evaluar" ? "cerrar" : "atras"}
      enVivo={t.enVivo}
      soloAccion={t.soloAccion}
      accion={<TopBarAccionDestino />}
    />
  );
}

/**
 * Barra inferior de la ruta. Sin barra (constructor) deja una marca vacía: `AppShell` esconde
 * su `<nav>` con `:has()` y el toast baja (D131), también en el HTML del servidor.
 */
export function RouteBottomNav(
  props: Omit<ComponentProps<typeof BottomNav>, "pathname">,
) {
  const pathname = usePathname();
  if (!topbarDe(props.rol, pathname).barraInferior) {
    return <span data-sin-barra-inferior="" hidden />;
  }
  return <BottomNav {...props} pathname={pathname} />;
}

/** `<main>` del shell con el ancho de la ruta (`AppShell` con `anchoPorRuta`). */
export function RouteMain({
  rol,
  children,
}: {
  rol: Rol;
  children: ReactNode;
}) {
  const ancho = anchoDe(rol, usePathname());
  return (
    <main id="contenido" tabIndex={-1} className={mainClass(rol, ancho)}>
      {children}
    </main>
  );
}
