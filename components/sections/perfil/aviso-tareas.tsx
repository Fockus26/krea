"use client";

import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { EstadoInstalacion } from "@/lib/instalar-pwa";
import {
  activarAviso,
  desactivarAviso,
  type EstadoAviso,
  estadoAviso,
} from "@/lib/push-cliente";
import { InstalarIOS } from "./instalar-ios";
import { useInstalarPwa } from "@/lib/use-instalar-pwa";

// PROVISIONAL (CONTENT_CHECKLIST fila 171): rótulo y descripciones del interruptor
const TITULO = "Avisos";
const ROTULO = "Avisarme cuando haya una tarea nueva";
const DESC_ACTIVADO =
  "Te llegará un aviso a este dispositivo cuando un profe publique una tarea para tu sección.";
const DESC_DESACTIVADO =
  "Solo en este dispositivo. Puedes desactivarlo cuando quieras.";
// PROVISIONAL (CONTENT_CHECKLIST fila 172): por qué no se puede activar
const NO_SOPORTADO =
  "Este navegador no puede recibir avisos. En iPhone (iOS 16.4 o más), agrega KREA a tu pantalla de inicio (Compartir › Agregar a inicio) y ábrela desde ahí.";
// PROVISIONAL (CONTENT_CHECKLIST filas 186–188): instalar KREA como app
const INSTALAR_DESC =
  "Ábrela desde tu pantalla de inicio, como cualquier app, y recibe los avisos más fácil.";
const INSTALAR_BOTON = "Instalar KREA";
const DENEGADO =
  "Bloqueaste los avisos de KREA en este navegador. Para activarlos, permite las notificaciones en la configuración del sitio (el ícono junto a la dirección) y vuelve a esta página.";
// PROVISIONAL (CONTENT_CHECKLIST fila 173): toasts
const TOAST_ACTIVADO = "Listo: te avisaremos de las tareas nuevas.";
const TOAST_DESACTIVADO = "Avisos desactivados en este dispositivo.";
const TOAST_CANCELADO =
  "Para recibir avisos, acepta el permiso de notificaciones.";
const TOAST_ERROR =
  "No se pudo cambiar el aviso. Revisa tu internet y vuelve a intentar.";

// PROVISIONAL (CONTENT_CHECKLIST fila 189): título de la tarjeta cuando no hay avisos (sin VAPID)
const TITULO_SOLO_INSTALAR = "KREA en tu pantalla de inicio";

/** Botón (Chrome/Edge) o diálogo con pasos (iPhone/iPad, D393) para instalar; nada en otro caso (D368–D370). */
function BloqueInstalar({
  estado,
  instalar,
}: {
  estado: EstadoInstalacion | null;
  instalar: () => Promise<void>;
}) {
  if (estado === "disponible") {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-small text-text-2">{INSTALAR_DESC}</p>
        <Button variant="secondary" onClick={() => void instalar()}>
          {INSTALAR_BOTON}
        </Button>
      </div>
    );
  }
  if (
    estado === "ios" ||
    estado === "ios-otro-navegador" ||
    estado === "ios-en-app"
  ) {
    return <InstalarIOS estado={estado} />;
  }
  return null;
}

/**
 * Sin avisos configurados (faltan las variables VAPID, D337) la tarjeta «Avisos» no se pinta, pero
 * instalar no depende de eso (D371): esta tarjeta solo aparece si hay algo que ofrecer.
 */
export function InstalarKrea() {
  const { estado, instalar } = useInstalarPwa();
  if (estado === null || estado === "instalada" || estado === "no-disponible")
    return null;
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-h3 text-text">{TITULO_SOLO_INSTALAR}</h2>
      <BloqueInstalar estado={estado} instalar={instalar} />
    </Card>
  );
}

/**
 * "Avisos" de Perfil (D335, D339, D340) — no está en el lienzo: un interruptor para recibir en ESTE
 * navegador el aviso de tarea nueva. El permiso del navegador se pide solo al encenderlo (gesto del
 * alumno). Sin soporte (iPhone sin instalar) o con el permiso bloqueado, el interruptor queda
 * deshabilitado y un aviso explica cómo resolverlo. `onSuscribir` / `onDesuscribir` llevan la
 * suscripción al servidor y devuelven si se guardó.
 */
export function AvisoTareas({
  clavePublica,
  onSuscribir,
  onDesuscribir,
}: {
  clavePublica: string;
  onSuscribir: (sub: PushSubscriptionJSON) => Promise<boolean>;
  onDesuscribir: (endpoint: string) => Promise<boolean>;
}) {
  const [estado, setEstado] = useState<EstadoAviso>("cargando");
  const [ocupado, setOcupado] = useState(false);
  const id = useId();
  const descId = useId();
  const { estado: instalacion, instalar } = useInstalarPwa();

  useEffect(() => {
    let vivo = true;
    void estadoAviso().then((e) => {
      if (vivo) setEstado(e);
    });
    return () => {
      vivo = false;
    };
  }, []);

  async function cambiar(encender: boolean) {
    // Ocupado no deshabilita el interruptor (perdería el foco): solo ignora otro toque
    if (ocupado) return;
    setOcupado(true);
    try {
      if (encender) {
        const r = await activarAviso(clavePublica, onSuscribir);
        if (r === "activado") {
          setEstado("activado");
          toast(TOAST_ACTIVADO);
        } else if (r === "denegado") setEstado("denegado");
        else toast(r === "cancelado" ? TOAST_CANCELADO : TOAST_ERROR);
      } else if (await desactivarAviso(onDesuscribir)) {
        setEstado("desactivado");
        toast(TOAST_DESACTIVADO);
      } else toast(TOAST_ERROR);
    } finally {
      setOcupado(false);
    }
  }

  const bloqueado = estado === "no-soportado" || estado === "denegado";
  const activado = estado === "activado";

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-h3 text-text">{TITULO}</h2>
      <BloqueInstalar estado={instalacion} instalar={instalar} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={id} className="text-label text-text">
            {ROTULO}
          </label>
          {bloqueado ? null : (
            <p id={descId} className="text-small text-text-2">
              {activado ? DESC_ACTIVADO : DESC_DESACTIVADO}
            </p>
          )}
        </div>
        <Switch
          id={id}
          checked={activado}
          disabled={bloqueado || estado === "cargando"}
          aria-busy={ocupado || estado === "cargando" || undefined}
          aria-describedby={bloqueado ? `${descId}-alerta` : descId}
          onCheckedChange={(v) => void cambiar(v)}
          className="mt-0.5"
        />
      </div>
      {bloqueado ? (
        <Alert variant="warn" id={`${descId}-alerta`}>
          <AlertDescription>
            {estado === "denegado" ? DENEGADO : NO_SOPORTADO}
          </AlertDescription>
        </Alert>
      ) : null}
    </Card>
  );
}
