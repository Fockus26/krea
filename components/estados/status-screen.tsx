import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/krea/logo";
import { UserAvatar } from "@/components/krea/user-avatar";
import type { NavUsuario } from "@/components/layout/nav-types";
import { Button } from "@/components/ui/button";
import { inicioDe, type SesionEstado } from "@/lib/estados";
import { perfilHref } from "@/lib/nav";

/*
 * StatusScreen — familia de pantallas de estado (HANDOFF §5b; lienzos Estados.dc.html y
 * Estados-movil.dc.html; krea.css:455-461). Cabecera mínima 64 (56 móvil) con logo 88 (80) y, a
 * la derecha, avatar 32 (con sesión) o «Iniciar sesión» ghost sm (sin sesión). Cuerpo: columna
 * alineada a la izquierda, máx. 640, centrada en vertical, padding 40 24 (32 20 móvil), gap 16:
 * código grande (`aria-hidden`) o burbuja de ícono 72 · eyebrow · h1 · línea · extra · acciones.
 * Sin barras de navegación. Pone su propio `<main id="contenido">` (no vive dentro del shell).
 * El usuario de la cabecera es el de la sesión real (D213); sin él (perfil ilegible o aún sin
 * leer), el avatar genérico del rol.
 */
/** Avatar genérico mientras no hay usuario (mismo estilo para todos: no identifica a nadie). */
const SIN_USUARIO: NavUsuario = {
  nombre: "Tu perfil",
  estilo: "bottts-neutral",
  seed: "krea",
};

export function StatusScreen({
  sesion,
  usuario: usuarioSesion,
  codigo,
  icono: Icono,
  eyebrow,
  titulo,
  linea,
  extra,
  acciones,
  enShell = false,
}: {
  sesion: SesionEstado;
  /** Usuario de la cabecera (con sesión). */
  usuario?: NavUsuario | null;
  /** «404» / «500»: número grande decorativo. Sin él, `icono` en burbuja. */
  codigo?: string;
  icono?: LucideIcon;
  eyebrow: string;
  titulo: string;
  linea: string;
  extra?: ReactNode;
  /** Botones ya armados con `accionesEstadoClases` (fila; en móvil apilados `lg block`). */
  acciones: ReactNode;
  /**
   * Dentro del shell de la app (404 de una ruta dinámica con sesión, D504): el shell ya trae
   * cabecera, navegación y `<main id="contenido">`, así que solo se pinta el cuerpo.
   */
  enShell?: boolean;
}) {
  const usuario = usuarioSesion ?? SIN_USUARIO;
  if (enShell)
    return (
      <div
        data-slot="status-screen"
        className="flex w-full max-w-status flex-col items-start gap-4 py-6"
      >
        <CuerpoEstado
          codigo={codigo}
          icono={Icono}
          eyebrow={eyebrow}
          titulo={titulo}
          linea={linea}
          extra={extra}
          acciones={acciones}
        />
      </div>
    );
  return (
    <div
      data-slot="status-screen"
      // Sin barra inferior: el toast («Código copiado») baja a 16 del borde (D131)
      data-sin-barra-inferior=""
      className="flex min-h-dvh flex-1 flex-col bg-bg text-text"
    >
      <header className="flex h-topbar shrink-0 items-center border-b border-divider px-5 md:px-6">
        <Link
          href={inicioDe(sesion)}
          className="rounded-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Logo size="topbar" className="max-md:w-20" />
        </Link>
        <span className="flex-1" />
        {sesion ? (
          <Link
            href={perfilHref(sesion)}
            aria-label="Tu perfil"
            className="rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <UserAvatar
              estilo={usuario.estilo}
              seed={usuario.seed}
              nombre={usuario.nombre}
              size={32}
            />
          </Link>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link href="/ingresar">Iniciar sesión</Link>
          </Button>
        )}
      </header>
      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-status flex-1 flex-col items-start justify-center gap-4 px-5 py-8 md:px-6 md:py-10"
      >
        <CuerpoEstado
          codigo={codigo}
          icono={Icono}
          eyebrow={eyebrow}
          titulo={titulo}
          linea={linea}
          extra={extra}
          acciones={acciones}
        />
      </main>
    </div>
  );
}

/** Contenido de la pantalla (código o ícono, textos y acciones), igual con o sin shell. */
function CuerpoEstado({
  codigo,
  icono: Icono,
  eyebrow,
  titulo,
  linea,
  extra,
  acciones,
}: {
  codigo?: string;
  icono?: LucideIcon;
  eyebrow: string;
  titulo: string;
  linea: string;
  extra?: ReactNode;
  acciones: ReactNode;
}) {
  return (
    <>
      {codigo ? (
        <p aria-hidden="true" className="text-status-code text-accent-ink">
          {codigo}
        </p>
      ) : Icono ? (
        <span className="grid size-18 place-items-center rounded-lg bg-accent-soft text-accent-ink">
          <Icono aria-hidden="true" className="size-8" />
        </span>
      ) : null}
      <p className="text-eyebrow text-text-2">{eyebrow}</p>
      <h1 className="text-h1">{titulo}</h1>
      <p className="max-w-130 text-body text-text-2">{linea}</p>
      {extra}
      <div className="mt-2 flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap">
        {acciones}
      </div>
    </>
  );
}

/** Botón de acción de la pantalla: en móvil `lg block` (apilados), desde md el tamaño md en fila. */
export const accionEstadoClases =
  "max-md:h-13 max-md:w-full max-md:px-6 max-md:text-button-lg";
