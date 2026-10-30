"use client";

import { useState } from "react";
import {
  ImageUpload,
  type ImageUploadFile,
  type ImageUploadStatus,
} from "@/components/krea/image-upload";
import { QuestionBar } from "@/components/krea/question-bar";
import { QuestionCardAnswer } from "@/components/krea/question-card-answer";
import { QuestionCardDetail } from "@/components/krea/question-card-detail";
import { QuestionCardReview } from "@/components/krea/question-card-review";
import { QuestionHeader } from "@/components/krea/question-header";
import { Card } from "@/components/ui/card";
import { PortalScope } from "@/components/ui/portal-scope";
import { answerImageAlt } from "@/lib/question";
import { Familia, Muestra } from "./familia";

// Textos de ejemplo PROVISIONALES (CONTENT_CHECKLIST filas 47-49): enunciados, respuestas,
// comentarios del profe, nombres y el placeholder del puntaje. Los datos salen del estilo del seed.

const ENUNCIADOS = [
  "Describe el público al que se dirige tu emprendimiento.",
  "¿Qué sentimiento quieres que tenga el cliente al ver tu logo?",
  "Sube el logo de tu emprendimiento.",
  "Sube la paleta con los códigos de cada color.",
] as const;

const RESPUESTA_TEXTO =
  "Nuestro público son jóvenes de 15 a 25 años que disfrutan de los postres artesanales y comparten fotos de lo que comen en sus redes.";

// Imagen de muestra generada (degradado cálido, como el lienzo): no hay fotos reales todavía.
const IMAGEN_MUESTRA = `data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='rgb(247,217,196)'/><stop offset='.55' stop-color='rgb(233,162,123)'/><stop offset='1' stop-color='rgb(181,106,74)'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/></svg>",
)}`;

const ARCHIVO_LISTO: ImageUploadFile = {
  name: "logo-reposteria.jpg",
  size: 1.2 * 1024 * 1024,
  src: IMAGEN_MUESTRA,
};
const ARCHIVO_SUBIENDO: ImageUploadFile = {
  name: "paleta-final.png",
  size: 2.4 * 1024 * 1024,
  src: IMAGEN_MUESTRA,
};

const NO_HACE_NADA = () => {};
const SIN_ACCIONES = {
  onSelect: NO_HACE_NADA,
  onReject: NO_HACE_NADA,
  onRemove: NO_HACE_NADA,
};

function Lista({ children }: { children: React.ReactNode }) {
  return <ol className="flex flex-col gap-4">{children}</ol>;
}

function PuntajePlaceholder() {
  return (
    <p className="text-small-b rounded-nav border-2 border-dashed border-input px-3.5 py-3 text-text-2">
      Puntaje (ScorePicker, W8)
    </p>
  );
}

/** Zona de subida con el flujo real: valida, comprime y muestra el resultado (sin subir). */
function SubidaInteractiva() {
  const [status, setStatus] = useState<ImageUploadStatus>("vacia");
  const [file, setFile] = useState<ImageUploadFile>();
  const [error, setError] = useState<string>();
  return (
    <ImageUpload
      status={status}
      file={file}
      error={error}
      onSelect={(blob, meta) => {
        setError(undefined);
        setFile({ name: meta.name, size: blob.size, src: blob });
        setStatus("lista");
      }}
      onReject={(message) => {
        setFile(undefined);
        setError(message);
        setStatus("error");
      }}
      onRemove={() => {
        setFile(undefined);
        setError(undefined);
        setStatus("vacia");
      }}
    />
  );
}

export function Preguntas() {
  const [texto, setTexto] = useState("");
  const [comentarioA, setComentarioA] = useState("");
  const [comentarioB, setComentarioB] = useState(
    "Bien explicado. Agrega qué quieren que sienta el cliente al ver la vitrina.",
  );

  return (
    <Familia
      id="preguntas"
      title="Preguntas y subida de imagen"
      description="Tres tarjetas con cuerpos separados (detalle, responder y evaluar) que solo comparten la cabecera. El visor «Ampliar» y la subida se prueban aquí con archivos reales."
    >
      <PortalScope>
        <Muestra title="Cabecera compartida (QuestionHeader)">
          <Card className="flex flex-col gap-4">
            <QuestionHeader
              numero={1}
              enunciado={ENUNCIADOS[0]}
              valor={4}
              variant="detalle"
              obtenido={3.5}
            />
            <QuestionHeader
              numero={2}
              enunciado={ENUNCIADOS[1]}
              valor={4}
              variant="detalle"
              obtenido={null}
            />
            <QuestionHeader
              numero={3}
              enunciado={ENUNCIADOS[2]}
              valor={6}
              variant="responder"
            />
            <QuestionHeader
              numero={10}
              enunciado={ENUNCIADOS[3]}
              valor={2.5}
              variant="evaluar"
            />
          </Card>
        </Muestra>

        <Muestra title="Barra por pregunta (QuestionBar)">
          <Card className="flex flex-col gap-3">
            {[4, 3.5, 2, 1, 0, null].map((obtenido) => (
              <QuestionBar
                key={obtenido ?? "pendiente"}
                obtenido={obtenido}
                valor={4}
              />
            ))}
          </Card>
        </Muestra>

        <Muestra title="Detalle (QuestionCardDetail)">
          <Lista>
            <QuestionCardDetail
              numero={1}
              enunciado={ENUNCIADOS[0]}
              valor={4}
              obtenido={4}
              respuesta={{ tipo: "texto", texto: RESPUESTA_TEXTO }}
            />
            <QuestionCardDetail
              numero={2}
              enunciado={ENUNCIADOS[1]}
              valor={4}
              obtenido={2.5}
              respuesta={{ tipo: "texto", texto: RESPUESTA_TEXTO }}
              comentario="Vas por buen camino. Piensa en una emoción concreta, como la ternura o la alegría."
            />
            <QuestionCardDetail
              numero={3}
              enunciado={ENUNCIADOS[2]}
              valor={6}
              obtenido={5}
              respuesta={{
                tipo: "imagen",
                src: IMAGEN_MUESTRA,
                alt: answerImageAlt("María", 3),
              }}
            />
            <QuestionCardDetail
              numero={4}
              enunciado={ENUNCIADOS[3]}
              valor={4}
              obtenido={null}
              respuesta={{ tipo: "texto", texto: RESPUESTA_TEXTO }}
            />
          </Lista>
        </Muestra>

        <Muestra title="Responder (QuestionCardAnswer)">
          <Lista>
            <QuestionCardAnswer
              numero={1}
              enunciado={ENUNCIADOS[0]}
              valor={4}
              formato="texto"
              value={texto}
              onValueChange={setTexto}
            />
            <QuestionCardAnswer
              numero={2}
              enunciado={ENUNCIADOS[2]}
              valor={6}
              formato="imagen"
              upload={{ status: "vacia", ...SIN_ACCIONES }}
            />
            <QuestionCardAnswer
              numero={3}
              enunciado={ENUNCIADOS[3]}
              valor={4}
              formato="imagen"
              upload={{
                status: "subiendo",
                progress: 45,
                file: ARCHIVO_SUBIENDO,
                ...SIN_ACCIONES,
              }}
            />
            <QuestionCardAnswer
              numero={4}
              enunciado={ENUNCIADOS[2]}
              valor={6}
              formato="imagen"
              upload={{ status: "lista", file: ARCHIVO_LISTO, ...SIN_ACCIONES }}
            />
            <QuestionCardAnswer
              numero={5}
              enunciado={ENUNCIADOS[2]}
              valor={6}
              formato="imagen"
              upload={{
                status: "error",
                error: "La imagen pesa 7,3 MB. El máximo es 5 MB.",
                ...SIN_ACCIONES,
              }}
            />
            <QuestionCardAnswer
              numero={6}
              enunciado={ENUNCIADOS[1]}
              valor={4}
              formato="texto"
              value=""
              onValueChange={NO_HACE_NADA}
              bloqueadaPor="Jorge Quintero"
            />
          </Lista>
        </Muestra>

        <Muestra title="Evaluar (QuestionCardReview)">
          <Lista>
            <QuestionCardReview
              numero={1}
              enunciado={ENUNCIADOS[0]}
              valor={4}
              respuesta={{ tipo: "texto", texto: RESPUESTA_TEXTO }}
              score={<PuntajePlaceholder />}
              comentario={comentarioA}
              onComentarioChange={setComentarioA}
            />
            <QuestionCardReview
              numero={2}
              enunciado={ENUNCIADOS[2]}
              valor={6}
              respuesta={{
                tipo: "imagen",
                src: IMAGEN_MUESTRA,
                alt: answerImageAlt("Equipo 5A-G2 Repostería", 2),
              }}
              score={<PuntajePlaceholder />}
              comentario={comentarioB}
              onComentarioChange={setComentarioB}
            />
          </Lista>
        </Muestra>

        <Muestra title="Subida de imagen con archivos reales (ImageUpload)">
          <Card className="flex flex-col gap-3">
            <p className="text-small text-text-2">
              Elige un JPG o PNG: se valida, se comprime a 1600 px (JPEG 0,8) y
              queda la vista previa. Prueba también con un archivo de otro tipo
              o de más de 5 MB para ver el error. No se sube nada.
            </p>
            <SubidaInteractiva />
          </Card>
        </Muestra>
      </PortalScope>
    </Familia>
  );
}
