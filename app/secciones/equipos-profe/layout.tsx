import { Toaster } from "@/components/ui/sonner";

// Toaster local de la vista previa (D035: el global se monta en la fase 05). Va en el layout para
// que el aviso «pasó a …» sobreviva al cambio de sección 5A/5C (D105, D113).
export default function EquiposProfeLayout({
  children,
}: LayoutProps<"/secciones/equipos-profe">) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
