import { Lock } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * "Tus datos" de Perfil (HANDOFF §3 Perfil §2): h2 (tamaño h3) + "Solo tu profe puede
 * cambiarlos" con candado; grilla de 2 columnas desde 768 con los 4 campos en solo lectura
 * (nombres y apellidos: solo lectura para el alumno, editables por el profe).
 */
export function ProfileData({
  campos,
}: {
  campos: ReadonlyArray<{ id: string; label: string; valor: string }>;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="mb-0">
        <h2 className="text-h3 text-text">Tus datos</h2>
        <p className="text-small flex items-center gap-1.5 text-text-2">
          <Lock aria-hidden="true" className="size-4 shrink-0" />
          Solo tu profe puede cambiarlos
        </p>
      </CardHeader>
      <div className="g2">
        {campos.map((c) => (
          <Field key={c.id} label={c.label} controlId={`perfil-${c.id}`}>
            <Input readOnly value={c.valor} />
          </Field>
        ))}
      </div>
    </Card>
  );
}
