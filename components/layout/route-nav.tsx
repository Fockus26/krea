"use client";

import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SideNav } from "@/components/layout/side-nav";
import { TopBar } from "@/components/layout/top-bar";

/*
 * Envoltorios con la ruta real (D063): leen `usePathname()` y se la pasan a los componentes de
 * navegación, que por sí solos reciben `pathname` por prop (así /componentes muestra cada
 * estado activo sin navegar). Se enchufan en los slots de `AppShell` desde un layout:
 *   <AppShell role=… sidebar={<RouteSideNav …/>} topbar={<RouteTopBar …/>} bottomNav={<RouteBottomNav …/>}>
 */
export function RouteSideNav(
  props: Omit<ComponentProps<typeof SideNav>, "pathname">,
) {
  return <SideNav {...props} pathname={usePathname()} />;
}

export function RouteTopBar(
  props: Omit<ComponentProps<typeof TopBar>, "pathname">,
) {
  return <TopBar {...props} pathname={usePathname()} />;
}

export function RouteBottomNav(
  props: Omit<ComponentProps<typeof BottomNav>, "pathname">,
) {
  return <BottomNav {...props} pathname={usePathname()} />;
}
