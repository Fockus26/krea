"use client";
// Cliente de Better Auth en el navegador (D327): solo entrar y salir. Todo lo demás va por Server
// Actions. Misma origen: no necesita baseURL.
import { createAuthClient } from "better-auth/react";

export const authCliente = createAuthClient();
