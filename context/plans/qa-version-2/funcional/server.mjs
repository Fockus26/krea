// Servidor de QA v2 contra qa_4302. Lanza `next dev` sin shell para que el entorno llegue tal cual.
// Neutraliza lo externo real de .env.local (B2, Brevo, Anthropic, Firebase) con un espacio: el
// código hace trim() y lo toma como "sin configurar"; @next/env no pisa lo ya definido.
import { spawn } from "node:child_process";
const port = process.argv[2] ?? "4302";
const SITE = `http://localhost:${port}`;
const DB = "postgresql://qa_app:qa_app@127.0.0.1:54329/qa_4302";
const muerto = " ";
const env = {
  ...process.env,
  QA_LOCAL: "1",
  DATABASE_URL: DB,
  DIRECT_URL: DB,
  BETTER_AUTH_SECRET: "qa-local-secret-qa-local-secret-qa-local",
  BETTER_AUTH_URL: SITE,
  SITE_URL: SITE,
  NEXT_PUBLIC_SITE_URL: SITE,
  CRON_SECRET: "qa-local-cron",
  B2_KEY_ID: muerto, B2_APPLICATION_KEY: muerto, B2_BUCKET_NAME: muerto, B2_ENDPOINT: muerto, B2_REGION: muerto,
  BREVO_API_KEY: muerto, BREVO_SENDER_EMAIL: muerto,
  ANTHROPIC_API_KEY: process.env.QA_ANTHROPIC ?? muerto,
  FIREBASE_CLIENT_EMAIL: muerto, FIREBASE_PRIVATE_KEY: muerto,
  NEXT_PUBLIC_FIREBASE_API_KEY: muerto, NEXT_PUBLIC_FIREBASE_APP_ID: muerto,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: muerto, NEXT_PUBLIC_FIREBASE_PROJECT_ID: muerto,
  VERCEL_OIDC_TOKEN: muerto,
};
const modo = process.argv[3] ?? "dev";
const run = (args) => new Promise((ok) => { const c = spawn(process.execPath, ["node_modules/next/dist/bin/next", ...args], { env, stdio: "inherit" }); c.on("exit", ok); });
if (modo === "build") { const c = await run(["build"]); if (c !== 0) process.exit(c); }
const c = await run(modo === "dev" ? ["dev", "--port", port] : ["start", "--port", port]);
process.exit(c ?? 0);
