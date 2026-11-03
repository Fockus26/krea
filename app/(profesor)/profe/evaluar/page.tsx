import { ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/krea/empty-state";
import { PageHeader } from "@/components/sections/shared/page-header";
import { Card } from "@/components/ui/card";
import { COLA } from "@/lib/demo/evaluar";

export const metadata: Metadata = {
  title: "Evaluar",
  robots: { index: false },
};

// La cola de Evaluar entrega: lleva a la primera entrega (D148). Sin entregas, el estado vacío.
export default function EvaluarColaPage() {
  const primera = COLA[0];
  if (primera) redirect(`/profe/evaluar/${primera.id}`);

  return (
    <>
      <PageHeader title="Evaluar" />
      <Card>
        <EmptyState
          icon={ClipboardCheck}
          headingLevel={2}
          title="No hay entregas por evaluar"
          description="Cuando tus estudiantes entreguen una tarea, aparecerá aquí para evaluarla."
        />
      </Card>
    </>
  );
}
