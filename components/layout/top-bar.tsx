import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/krea/logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import { MenuSheet } from "@/components/layout/menu-sheet";
import type { NavRoute, NavUsuario } from "@/components/layout/nav-types";
import { LiveChip } from "@/components/sections/ranking/ranking-header";
import { Button } from "@/components/ui/button";
import type { Rol } from "@/lib/layout";
import { PERFIL_HREF } from "@/lib/nav";

/**
 * Contenido de la barra superior (< lg; HANDOFF §2.7). El `<header>` sticky, el alto 56/64 y el
 * borde los pone `AppShell` (slot `topbar`). Izquierda: logo 88 px, o botón volver 44 + título h4
 * en pantallas de detalle (`volverHref` + `title`; `volverIcono="cerrar"` pinta la X de Evaluar).
 * Derecha: chip «En vivo» (`enVivo`, Ranking), la acción de la página (`accion`, D130) y avatar 36
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
  enVivo = false,
  accion,
  soloAccion = false,
  onSignOut,
}: NavRoute & {
  rol: Rol;
  usuario: NavUsuario;
  /** Título de la pantalla de detalle; solo se pinta junto a `volverHref`. */
  title?: string;
  volverHref?: string;
  /** Nombre accesible del botón de la izquierda. */
  volverLabel?: string;
  /** Flecha (detalle) o X (salir de Evaluar). */
  volverIcono?: "atras" | "cerrar";
  /** Chip «En vivo» (Ranking en < lg). */
  enVivo?: boolean;
  /** Destino de la acción de la página (`TopBarAccionDestino`, D130). */
  accion?: ReactNode;
  /** Sin avatar ni Menú: a la derecha solo `accion`. */
  soloAccion?: boolean;
  onSignOut?: () => void;
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
            <p className="text-h4 min-w-0 flex-1 truncate text-text">{title}</p>
          ) : (
            <span className="flex-1" />
          )}
        </>
      ) : (
        <>
          <Link
            href={inicio}
            className="rounded-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Logo size="topbar" />
          </Link>
          <span className="flex-1" />
        </>
      )}
      {enVivo ? <LiveChip className="shrink-0" /> : null}
      {accion}
      {soloAccion ? null : rol === "profesor" ? (
        // Con el chip, el Menú va solo con su ícono: a 320 no caben logo, chip y "Menú" (D128)
        <MenuSheet
          pathname={pathname}
          onSignOut={onSignOut}
          compacto={enVivo}
        />
      ) : (
        <Link
          href={PERFIL_HREF}
          aria-label="Tu perfil"
          className="grid size-11 shrink-0 place-items-center rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <UserAvatar
            estilo={usuario.estilo}
            seed={usuario.seed}
            nombre={usuario.nombre}
            size={36}
          />
        </Link>
      )}
    </>
  );
}
