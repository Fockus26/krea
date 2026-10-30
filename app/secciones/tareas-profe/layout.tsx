import { Toaster } from "@/components/ui/sonner";

// Toaster local de la vista previa (D035: el global se monta en la fase 05 en el AppShell; D105).
// Va en el layout: "Tarea publicada" se ve al volver a la lista, que es otra página del segmento.
export default function TareasProfeVistaLayout({
  children,
}: LayoutProps<"/secciones/tareas-profe">) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
