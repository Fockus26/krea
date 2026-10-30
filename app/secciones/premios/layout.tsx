import { Toaster } from "@/components/ui/sonner";

// Toaster local de la vista previa (D035/D105): el aviso "Premio para …" al decidir un empate.
export default function PremiosVistaLayout({
  children,
}: LayoutProps<"/secciones/premios">) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
