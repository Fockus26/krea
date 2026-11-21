import { ChevronRight, ClipboardList, Users } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/krea/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardList,
  CardListItem,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Familia, Muestra } from "./familia";

// Nombres y equipos: data/seed (contenido real). Notas, textos de tareas y avisos: provisionales
// (CONTENT_CHECKLIST filas 35-37).
const ALUMNOS = [
  ["Mateo Guillermo Paredes Aranda", "5A", "Barbería", null],
  ["Ramón Alfonso Nieto Lucena", "5A", "Mascotas", null],
  ["Hernán Lucas Lucena Tapia", "5A", "Comida Rápida", "18,0"],
  ["Raquel Leticia Figueroa Montes", "5A", "Repostería", "18,5"],
  ["Elsa Elena Soto Ochoa", "5A", "Comida Rápida", "18,5"],
  ["Araceli Adriana Garrido Lozano", "5A", "Comida Rápida", null],
  ["Hugo Alberto Iglesias Escobar", "5A", "Sin equipo", null],
  ["Paola Natalia Padilla Tapia", "5A", "Repostería", "10,0"],
  ["Alba Regina Luna Bustos", "5A", "Comida Rápida", null],
] as const;

const TAREAS = [
  ["Identidad de marca", "Entrega el 12 de noviembre", "Por entregar"],
  ["Maqueta del empaque", "Evaluada el 28 de octubre", "17,5"],
  ["Presentación del equipo", "Evaluada el 14 de octubre", "19,0"],
] as const;

export function Contenedores() {
  return (
    <Familia
      id="contenedores"
      title="Tarjetas, avisos y carga"
      description="Card, Alert, Skeleton, Table, Separator y estado vacío. El hover y el foco de las filas enlace se ven al interactuar; en oscuro la tarjeta cambia la sombra por un borde."
    >
      <Muestra title="Tarjeta · normal, hero y flat">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle level={3}>Mis tareas</CardTitle>
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </CardHeader>
            <CardDescription>
              Radio 16, padding 16 (24 desde 768) y sombra 1.
            </CardDescription>
          </Card>
          <Card variant="hero">
            <CardHeader>
              <CardTitle level={3}>Tu equipo</CardTitle>
            </CardHeader>
            <CardDescription>
              Variante hero: radio 24, para las tarjetas destacadas.
            </CardDescription>
          </Card>
          <Card variant="flat">
            <CardHeader>
              <CardTitle level={3}>Resumen</CardTitle>
            </CardHeader>
            <CardDescription>
              Variante flat: borde de 1 px y sin sombra.
            </CardDescription>
          </Card>
        </div>
      </Muestra>

      <Muestra title="Tarjeta con lista interna · filas enlace y no enlace">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle level={3}>Tareas recientes</CardTitle>
              <CardDescription>Filas enlace</CardDescription>
            </CardHeader>
            <CardList>
              {TAREAS.map(([titulo, detalle, estado]) => (
                <CardListItem key={titulo} asChild>
                  <Link href="/componentes#contenedores">
                    <ClipboardList
                      aria-hidden="true"
                      className="size-5 shrink-0 text-accent-ink"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-body-strong">{titulo}</span>
                      <span className="text-small text-text-2">{detalle}</span>
                    </span>
                    <span className="text-small-b nums text-text-2">
                      {estado}
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="size-5 shrink-0 text-text-2"
                    />
                  </Link>
                </CardListItem>
              ))}
            </CardList>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle level={3}>Integrantes</CardTitle>
              <CardDescription>Filas que no son enlace</CardDescription>
            </CardHeader>
            <CardList>
              {ALUMNOS.slice(2, 5).map(([nombre, seccion, equipo]) => (
                <CardListItem key={nombre}>
                  <Users
                    aria-hidden="true"
                    className="size-5 shrink-0 text-text-2"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-body-strong">{nombre}</span>
                    <span className="text-small text-text-2">
                      {seccion} · {equipo}
                    </span>
                  </span>
                </CardListItem>
              ))}
            </CardList>
          </Card>
        </div>
      </Muestra>

      <Muestra title="Avisos · info, ok, warn y err">
        <div className="flex flex-col gap-3">
          <Alert variant="info">
            <AlertTitle>Tarea nueva</AlertTitle>
            <AlertDescription>
              El profesor publicó “Identidad de marca”. Entrégala antes del 12
              de noviembre.
            </AlertDescription>
          </Alert>
          <Alert variant="ok">
            <AlertTitle>Entrega enviada</AlertTitle>
            <AlertDescription>
              Tu equipo ya entregó la tarea. Te avisamos cuando esté evaluada.
            </AlertDescription>
          </Alert>
          <Alert variant="warn">
            <AlertTitle>Queda poco tiempo</AlertTitle>
            <AlertDescription>
              La entrega vence mañana a las 11:59 p. m.
            </AlertDescription>
          </Alert>
          <Alert variant="err">
            <AlertTitle>No se pudo guardar</AlertTitle>
            <AlertDescription>
              Revisa tu conexión e inténtalo de nuevo.
            </AlertDescription>
          </Alert>
        </div>
      </Muestra>

      <Muestra title="Skeleton · lista de notas cargando">
        <Card>
          <output
            aria-busy="true"
            aria-label="Cargando notas"
            className="flex flex-col gap-4"
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-pill" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-14 rounded-pill" />
              </div>
            ))}
          </output>
        </Card>
      </Muestra>

      <Muestra title="Tabla desplazable · encabezado fijo y región con nombre">
        <Table label="Alumnos de 5.º año, sección A">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Alumno</TableHead>
              <TableHead>Sección</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead numeric>Nota individual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ALUMNOS.map(([nombre, seccion, equipo, nota]) => (
              <TableRow key={nombre}>
                <TableCell className="font-bold">{nombre}</TableCell>
                <TableCell>{seccion}</TableCell>
                <TableCell>{equipo}</TableCell>
                <TableCell numeric>{nota ?? "Pendiente"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Muestra>

      <Muestra title="Estado vacío · con y sin acción">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="flat">
            <EmptyState
              icon={ClipboardList}
              title="Aún no hay notas"
              description="Cuando el profesor evalúe tu primera tarea, aparecerá aquí."
            />
          </Card>
          <Card variant="flat">
            <EmptyState
              icon={Users}
              title="Todavía no tienes equipo"
              description="Pídele a tu profesor que te asigne a uno."
              action={<Button variant="secondary">Ver equipos</Button>}
            />
          </Card>
        </div>
      </Muestra>

      <Muestra title="Separador">
        <Card>
          <p className="text-body">Parte de arriba</p>
          <Separator className="my-4" />
          <p className="text-body">Parte de abajo</p>
        </Card>
      </Muestra>
    </Familia>
  );
}
