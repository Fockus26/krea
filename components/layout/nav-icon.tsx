import {
  ClipboardCheck,
  Gift,
  GraduationCap,
  House,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  NotebookPen,
  School,
  SlidersHorizontal,
  Trophy,
  User,
  UserCog,
  Users,
} from "lucide-react";
import type { NavIconKey } from "@/lib/nav";

// Tabla de íconos de la navegación (D062). Trazo 2 por defecto de lucide.
const ICONS: Record<NavIconKey, LucideIcon> = {
  inicio: House,
  notas: NotebookPen,
  tareas: ListChecks,
  ranking: Trophy,
  equipo: Users,
  perfil: User,
  panel: LayoutDashboard,
  evaluar: ClipboardCheck,
  alumnos: GraduationCap,
  equipos: Users,
  puntos: SlidersHorizontal,
  premios: Gift,
  profesores: UserCog,
  secciones: School,
};

/** Ícono decorativo de un ítem: el texto del enlace es el nombre accesible. */
export function NavIcon({
  name,
  className,
}: {
  name: NavIconKey;
  className?: string;
}) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" className={className} />;
}
