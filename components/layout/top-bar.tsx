import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/krea/logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import { MenuSheet } from "@/components/layout/menu-sheet";
import type { NavRoute, NavUsuario } from "@/components/layout/nav-types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Rol } from "@/lib/layout";
import { isActive, PERFIL_HREF } from "@/lib/nav";
import { tiposTransicion } from "@/lib/transicion";

/**
 * Contenido de la barra superior (< lg; HANDOFF §2.7). El `<header>` sticky, el alto 56/64 y el
 * borde los pone `AppShell` (slot `topbar`). Izquierda: logo 88 px, o botón volver 44 + título h4
 * en pantallas de detalle (`volverHref` + `title`; `volverIcono="cerrar"` pinta la X de Evaluar).
 * Derecha: la acción de la página (`accion`, D130) y avatar 36
 * que enlaza a Perfil (estudiante) o botón "Menú" con la hoja (profesor); `soloAccion` quita el
 * avatar/Menú (constructor). La variante por ruta la elige `topbarDe` (lib/topbar.ts, D128).
 */
export function TopBar({
  rol,
  pathname,
  usuario,
  title,
  volverHref,
  volverLabel = "Volver",
  volverIcono = "atras",
  accion,
  soloAccion = false,
  onSignOut,
  salirHref,
}: NavRoute & {
  rol: Rol;
  /** `null` mientras llega la sesión (D189): el avatar se pinta como skeleton. */
  usuario: NavUsuario | null;
  /** Título de la pantalla de detalle; solo se pinta junto a `volverHref`. */
  title?: string;
  volverHref?: string;
  /** Nombre accesible del botón de la izquierda. */
  volverLabel?: string;
  /** Flecha (detalle) o X (salir de Evaluar). */
  volverIcono?: "atras" | "cerrar";
  /** Destino de la acción de la página (`TopBarAccionDestino`, D130). */
  accion?: ReactNode;
  /** Sin avatar ni Menú: a la derecha solo `accion`. */
  soloAccion?: boolean;
  onSignOut?: () => void;
  /** Destino de "Cerrar sesión" (Menú del profe) mientras no hay sesión real (D135). */
  salirHref?: string;
}) {
  const inicio = rol === "profesor" ? "/profe" : "/";
  const Icono = volverIcono === "cerrar" ? X : ArrowLeft;
  return (
    <>
      {volverHref ? (
        <>
          <Button asChild variant="ghost" icon>
            <Link href={volverHref} aria-label={volverLabel}>
              <Icono aria-hidden="true" className="size-6" />
            </Link>
          </Button>
          {title ? (
            // Junto a una acción («Guardar borrador») a 320 px no cabe en una línea: pasa a dos
            // (44 px caben en los 56 de la barra) antes que quedar en «Nueva t…» (D-B1, D230)
            <p className="text-h4 min-w-0 flex-1 line-clamp-2 text-text">
              {title}
            </p>
          ) : (
            <span className="flex-1" />
          )}
        </>
      ) : (
        <>
          <Link
            href={inicio}
            transitionTypes={tiposTransicion(rol, pathname, inicio)}
            // Con texto del sistema grande no caben logo, chip y avatar/Menú: el logo cede (Inicio sigue en la barra inferior)
            className="rounded-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus @max-estrecho:hidden"
          >
            <Logo size="topbar" />
          </Link>
          <span className="flex-1" />
        </>
      )}
      {accion}
      {soloAccion ? null : rol === "profesor" ? (
        <MenuSheet
          pathname={pathname}
          onSignOut={onSignOut}
          salirHref={salirHref}
          admin={usuario?.admin}
        />
      ) : (
        <Link
          href={PERFIL_HREF}
          transitionTypes={tiposTransicion(rol, pathname, PERFIL_HREF)}
          aria-label="Tu perfil"
          // < lg Perfil no tiene pestaña (cedió el lugar a Tareas): el avatar anuncia y marca la página actual
          aria-current={
            isActive({ href: PERFIL_HREF, match: "prefix" }, pathname)
              ? "page"
              : undefined
          }
          className="grid size-11 shrink-0 place-items-center rounded-pill transition-colors duration-fast ease-krea hover:bg-accent-soft hover:ring-1 hover:ring-accent-ink active:bg-accent-soft-2 active:ring-1 active:ring-accent-ink aria-[current=page]:bg-accent-soft-2 aria-[current=page]:ring-1 aria-[current=page]:ring-accent-ink motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {usuario ? (
            <UserAvatar
              estilo={usuario.estilo}
              seed={usuario.seed}
              nombre={usuario.nombre}
              size={36}
            />
          ) : (
            <Skeleton className="size-9 rounded-pill" />
          )}
        </Link>
      )}
    </>
  );
}
