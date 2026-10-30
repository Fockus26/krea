import {
  Gift,
  LayoutGrid,
  Moon,
  Palette,
  Sun,
  Trophy,
  Users,
} from "lucide-react";
import { GradePill } from "@/components/krea/grade-pill";
import {
  CaptainBadge,
  StatusBadge,
  SUBMISSION_STATUSES,
  TASK_STATUSES,
} from "@/components/krea/status-badge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { GradePillSize } from "@/lib/grade-pill";
import { Familia, Muestra } from "./familia";

// Textos de ejemplo provisionales (CONTENT_CHECKLIST filas 32-34)
const NOTAS = [4, 9.5, 10, 14.5, 18.5, 20, null] as const;
const SIZES = [
  ["sm", "Pequeña · 26"],
  ["md", "Mediana · 32"],
  ["lg", "Grande · 44"],
  ["total", "Total en vivo · 88 × 64"],
  ["xl", "Extra grande · 104"],
] as const satisfies readonly (readonly [GradePillSize, string])[];

const ESTILOS = [
  ["aventurero", "Aventurero"],
  ["emoji", "Emoji"],
  ["robot", "Robot"],
  ["notion", "Notion"],
  ["extra", "Más estilos"],
  ["otro", "Otro estilo"],
] as const;

export function Chips() {
  return (
    <Familia
      id="chips"
      title="Píldora de nota, chips y pestañas"
      description="Hover y foco (Tab, flechas) se ven al interactuar. La píldora usa gradeColor(n) de fondo y el número siempre en tinta oscura."
    >
      <Muestra title="Píldora de nota (GradePill)">
        <div className="flex flex-col gap-4">
          {SIZES.map(([size, label]) => (
            <div key={size} className="flex flex-col gap-2">
              <span className="text-small-b text-text-2">{label}</span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                {NOTAS.map((nota) => (
                  <GradePill
                    key={nota ?? "pendiente"}
                    nota={nota}
                    size={size}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Muestra>

      <Muestra title="Base distinta de 20 (chip Base)">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <GradePill nota={13.9} size="md" base={15} />
          <GradePill nota={8.5} size="lg" base={15} />
          <GradePill nota={null} size="md" base={15} />
          <GradePill nota={18.5} size="md" base={20} />
        </div>
      </Muestra>

      <Muestra title="Modo tabla (Raspado solo con ícono)">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <GradePill nota={4} size="sm" table />
          <GradePill nota={9.5} size="sm" table />
          <GradePill nota={14.5} size="sm" table />
          <GradePill nota={null} size="sm" table />
        </div>
      </Muestra>

      <Muestra title="Sin aviso de Raspado (raspado «ninguno»: el contexto ya lo dice)">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <GradePill nota={9} size="total" raspado="ninguno" />
          <GradePill nota={4.5} size="md" raspado="ninguno" />
          <GradePill nota={null} size="total" raspado="ninguno" />
        </div>
      </Muestra>

      <Muestra title="Chips">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Sin equipo</Badge>
          <Badge variant="base">Base 15</Badge>
          <CaptainBadge />
          <CaptainBadge femenino />
          <Badge variant="acc">
            <Users aria-hidden="true" />
            Grupal
          </Badge>
          <Badge variant="ok">Aprobada</Badge>
          <Badge variant="warn">En revisión</Badge>
          <Badge variant="err">Raspado</Badge>
          <Badge variant="prize">
            <Gift aria-hidden="true" />
            Premio
          </Badge>
          <Badge variant="tu">tú</Badge>
        </div>
      </Muestra>

      <Muestra title="Estados de tarea">
        <div className="flex flex-wrap items-center gap-3">
          {TASK_STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Muestra>

      <Muestra title="Estados de entrega">
        <div className="flex flex-wrap items-center gap-3">
          {SUBMISSION_STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Muestra>

      <Muestra title="Pestañas de línea">
        <Tabs defaultValue="aventurero" className="max-w-xl">
          <TabsList aria-label="Estilo del avatar">
            {ESTILOS.slice(0, 4).map(([value, label]) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {ESTILOS.slice(0, 4).map(([value, label]) => (
            <TabsContent key={value} value={value}>
              <p className="text-body text-text-2">
                Panel «{label}»: entra con opacidad.
              </p>
            </TabsContent>
          ))}
        </Tabs>
      </Muestra>

      <Muestra title="Pestañas de línea que no caben (scroll propio)">
        <Tabs defaultValue="aventurero" className="max-w-64">
          <TabsList aria-label="Más estilos de avatar">
            {ESTILOS.map(([value, label]) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Muestra>

      <Muestra title="Segmentado como pestañas (tablist)">
        <Tabs defaultValue="estudiantes" className="max-w-xl">
          <TabsList variant="segmented" aria-label="Ver ranking de">
            <TabsTrigger value="estudiantes">
              <Users aria-hidden="true" />
              Estudiantes
            </TabsTrigger>
            <TabsTrigger value="equipos">
              <Trophy aria-hidden="true" />
              Equipos
            </TabsTrigger>
            <TabsTrigger value="otros" disabled>
              Deshabilitado
            </TabsTrigger>
          </TabsList>
          <TabsContent value="estudiantes">
            <p className="text-body text-text-2">Ranking de estudiantes.</p>
          </TabsContent>
          <TabsContent value="equipos">
            <p className="text-body text-text-2">Ranking de equipos.</p>
          </TabsContent>
        </Tabs>
      </Muestra>

      <Muestra title="Segmentado para elegir un valor (radiogroup)">
        <div className="flex flex-col items-start gap-4">
          <ToggleGroup defaultValue="5A" aria-label="Sección">
            <ToggleGroupItem value="5A">5.º A</ToggleGroupItem>
            <ToggleGroupItem value="5C">5.º C</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup defaultValue="claro" aria-label="Tema">
            <ToggleGroupItem value="claro">
              <Sun aria-hidden="true" />
              Claro
            </ToggleGroupItem>
            <ToggleGroupItem value="oscuro">
              <Moon aria-hidden="true" />
              Oscuro
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </Muestra>

      <Muestra title="Segmentado de ancho completo (seg-block)">
        <p className="text-small text-text-2">
          Por debajo de 400 px de ancho se ocultan los íconos y queda el texto.
        </p>
        <div className="flex max-w-lg flex-col gap-4">
          <ToggleGroup block defaultValue="claro" aria-label="Tema de la app">
            <ToggleGroupItem value="claro">
              <Sun aria-hidden="true" />
              Claro
            </ToggleGroupItem>
            <ToggleGroupItem value="oscuro">
              <Moon aria-hidden="true" />
              Oscuro
            </ToggleGroupItem>
            <ToggleGroupItem value="sistema">
              <LayoutGrid aria-hidden="true" />
              Sistema
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="w-72">
            <ToggleGroup block defaultValue="texto" aria-label="Tipo de tarea">
              <ToggleGroupItem value="texto">
                <Palette aria-hidden="true" />
                Texto
              </ToggleGroupItem>
              <ToggleGroupItem value="imagen">
                <Gift aria-hidden="true" />
                Imagen
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </Muestra>
    </Familia>
  );
}
