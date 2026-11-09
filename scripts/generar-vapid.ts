#!/usr/bin/env bun
/**
 * Genera un par de claves VAPID nuevo para el aviso de tarea nueva (Web Push, D337) y lo imprime.
 *
 *   bun scripts/generar-vapid.ts
 *
 * Córrelo en TU terminal (no en una sesión de agente: la clave privada quedaría en el registro).
 * Carga las tres variables en Vercel (Production y Preview) y redeploya:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  la pública (va al navegador)
 *   VAPID_PRIVATE_KEY             la privada, SECRETA (--sensitive)
 *   VAPID_SUBJECT                 mailto: de quien responde por el envío
 *
 * Cambiar el par invalida las suscripciones existentes: cada alumno tendría que volver a activar
 * el aviso en Perfil. Generarlo una vez y no rotarlo sin motivo.
 */
import { generateVAPIDKeys } from "web-push";

const { publicKey, privateKey } = generateVAPIDKeys();

console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log("VAPID_SUBJECT=mailto:<correo de contacto>");
