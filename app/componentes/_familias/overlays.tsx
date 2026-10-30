"use client";

import {
  ArrowRightLeft,
  CircleHelp,
  LogOut,
  Palette,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PortalScope } from "@/components/ui/portal-scope";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Toaster, toast } from "@/components/ui/sonner";
import { Familia, Muestra } from "./familia";

// Toaster propio de la demo: no recoge toasts del Toaster global cuando exista (D035)
const TOASTER_ID = "componentes";

// PROVISIONAL (CONTENT_CHECKLIST fila 29): textos de ejemplo de diálogos, hoja y menús
const TEAMS = [
  "5A-G1 Barbería",
  "5A-G3 Ropa",
  "5A-G4 Mascotas",
  "5A-G5 Celulares",
  "5A-G6 Comida Rápida",
] as const;

const ORDERS = [
  ["puesto", "Puesto en el ranking"],
  ["nombre", "Nombre"],
  ["nota", "Nota"],
] as const;

// Ítems de la hoja: 48 de alto, radio 12, gap 12, 600 (§2.13)
const sheetItem =
  "flex h-12 w-full cursor-pointer items-center gap-3 rounded-nav px-3 text-left text-body font-semibold text-text hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&_svg]:size-5 [&_svg]:shrink-0";

function Dialogos() {
  return (
    <Muestra title="Diálogo">
      <div className="flex flex-wrap gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Ver cómo se calcula</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Cómo se calcula tu nota?</DialogTitle>
              <DialogDescription>
                Tarea «Logo del emprendimiento»
              </DialogDescription>
            </DialogHeader>
            <p className="text-body">
              Cada pregunta vale una parte de los 20 puntos. Tu profe evalúa en
              pasos de 0,5 y la suma de todas las preguntas es tu nota.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Entendido</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button>Publicar tarea</Button>
          </DialogTrigger>
          <DialogContent className="max-w-140">
            <DialogHeader>
              <DialogTitle>¿Publicar la tarea?</DialogTitle>
              <DialogDescription>
                5.º año, sección A · vence el 14/11/2026
              </DialogDescription>
            </DialogHeader>
            <p className="text-body">
              Los estudiantes verán «Logo del emprendimiento» en su inicio desde
              hoy. Podrás editar las preguntas hasta la primera entrega.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancelar</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Publicar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="danger">Quitar del equipo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Quitar a Wendoly Ponce del equipo?</DialogTitle>
              <DialogDescription>5A-G2 Repostería</DialogDescription>
            </DialogHeader>
            <p className="text-body">
              Sus notas no cambian. El equipo deja de contar sus puntos en el
              ranking desde ahora.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancelar</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="danger">Quitar del equipo</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Muestra>
  );
}

function HojaInferior() {
  return (
    <Muestra title="Hoja inferior">
      <div className="flex flex-wrap gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">Abrir hoja</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Cuenta</SheetTitle>
              <SheetDescription className="sr-only">
                Opciones de tu cuenta
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-0.5">
              <SheetClose asChild>
                <button type="button" className={sheetItem}>
                  <UserRound aria-hidden="true" />
                  Mi perfil
                </button>
              </SheetClose>
              <SheetClose asChild>
                <button type="button" className={sheetItem}>
                  <Palette aria-hidden="true" />
                  Tema y acento
                </button>
              </SheetClose>
              <SheetClose asChild>
                <button type="button" className={sheetItem}>
                  <CircleHelp aria-hidden="true" />
                  Ayuda
                </button>
              </SheetClose>
              <hr className="my-2 h-px border-0 bg-divider" />
              <SheetClose asChild>
                <button
                  type="button"
                  className={`${sheetItem} font-bold text-error`}
                >
                  <LogOut aria-hidden="true" />
                  Cerrar sesión
                </button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Muestra>
  );
}

function Menus() {
  const [order, setOrder] = useState<string>("puesto");
  return (
    <Muestra title="Menú contextual">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-body-strong">Wendoly Ponce</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              icon
              aria-label="Mover a Wendoly Ponce a otro equipo"
            >
              <ArrowRightLeft aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent aria-label="Mover a" align="end">
            <DropdownMenuLabel>Mover a…</DropdownMenuLabel>
            {TEAMS.map((team) => (
              <DropdownMenuItem key={team}>{team}</DropdownMenuItem>
            ))}
            <DropdownMenuItem disabled>
              5A-G2 Repostería (actual)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              Quitar del equipo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              Ordenar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent aria-label="Ordenar por">
            <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={order} onValueChange={setOrder}>
              {ORDERS.map(([value, label]) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Muestra>
  );
}

function Toasts() {
  return (
    <Muestra title="Toast">
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() =>
            toast.success("Nota guardada · 18,5", { toasterId: TOASTER_ID })
          }
        >
          Toast de éxito
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.error("No se guardó la nota: sin conexión", {
              toasterId: TOASTER_ID,
            })
          }
        >
          Toast de error
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.success("Ajuste aplicado: −2 puntos a 5A-G3 Ropa", {
              toasterId: TOASTER_ID,
              action: {
                label: "Deshacer",
                onClick: () =>
                  toast("Ajuste deshecho", { toasterId: TOASTER_ID }),
              },
            })
          }
        >
          Toast con «Deshacer»
        </Button>
        {/* Dentro del escenario: hereda su tema y acento (D034, D035) */}
        <Toaster id={TOASTER_ID} />
      </div>
    </Muestra>
  );
}

// Dialog, Sheet (hoja inferior), DropdownMenu, Toaster (§2.13, §2.14, §6)
export function Overlays() {
  return (
    <Familia
      id="overlays"
      title="Diálogos, hojas y menús"
      description="Cada botón abre su overlay con el tema y el acento elegidos arriba. Esc cierra y devuelve el foco al botón."
    >
      <PortalScope>
        <Dialogos />
        <HojaInferior />
        <Menus />
        <Toasts />
      </PortalScope>
    </Familia>
  );
}
