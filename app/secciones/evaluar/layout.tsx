import { Toaster } from "@/components/ui/sonner";

// Toaster local de la vista previa (D035: el global se monta en la fase 05 en el AppShell). Va en
// el layout y no en la página: al guardar se navega a otra entrega (otra página del segmento
// [estado]) y el toast "Nota guardada" con "Deshacer" tiene que seguir a la vista (D105).
export default function EvaluarVistaLayout({
  children,
}: LayoutProps<"/secciones/evaluar">) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
