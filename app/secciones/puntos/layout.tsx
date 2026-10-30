import { Toaster } from "@/components/ui/sonner";

// Toaster local de la vista previa (D035: el global se monta en la fase 05 en el AppShell; D105).
// «Aplicar ajuste» y «Anular ajuste» lo confirman con un toast que no repite la vista previa (D120).
export default function PuntosVistaLayout({
  children,
}: LayoutProps<"/secciones/puntos">) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
