import { notFound } from "next/navigation";
import { galeriaVisible } from "@/lib/galerias";

// Galería interna: solo en desarrollo y en las vistas previas; en producción, 404 (D162, D344).
export default function GaleriaLayout({ children }: LayoutProps<"/correos">) {
  if (!galeriaVisible(process.env)) notFound();
  return children;
}
