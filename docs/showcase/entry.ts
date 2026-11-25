import type { Project } from "@/content/types";

// Entrada de KREA para el portafolio (skill project-showcase). `order` lo fija el portafolio.
// Textos en inglés: traducción pendiente de revisión de César.
export const project: Project = {
  slug: "krea",
  order: 0,
  name: "KREA",
  kind: { es: "Portal de notas", en: "Grades portal" },
  sentence: {
    es: "Cada estudiante entiende su nota y sigue el ranking en vivo.",
    en: "Each student understands their grade and follows the live ranking.",
  },
  summary: {
    es: "Reemplaza la hoja de cálculo de notas de la escuela. Cada estudiante ve cómo se evaluó cada pregunta, su equipo y su puesto; los profesores crean las tareas, las evalúan y suman o restan puntos por conducta.",
    en: "It replaces the school's grades spreadsheet. Each student sees how every question was graded, their team and their place; teachers create the tasks, grade them and add or remove points for behaviour.",
  },
  role: { es: "Desarrollo completo.", en: "Full development." },
  stack: ["Next.js", "TypeScript", "Postgres", "Drizzle", "Tailwind"],
  links: [{ type: "live", url: "https://krea.fockus.dev" }],
  media: {
    format: "desktop",
    video: "/work/krea/loop",
    poster: "/work/krea/poster.jpg",
  },
  client: { name: "Escuela Creativa", named: true },
};
