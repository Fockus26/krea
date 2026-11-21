# Deploy

Una sola rama: **`main`**. Dos lugares la publican mientras dure la transición (D580):

| Dónde | Qué publica | Cómo se dispara |
|---|---|---|
| **kit-deploy** (VPS de César) | `main` → `https://krea.fockus.dev`; cada PR → `https://krea-pr-<n>.preview.fockus.dev` (detrás del login de César) | `.github/workflows/deploy-vps.yml`, solo con la variable del repo `KIT_DEPLOY_ENABLED=true` |
| Vercel (respaldo, una semana) | `main` y sus previews | Merge a `main` → Vercel lo publica solo |

Archivos de cada lado:

- kit-deploy: `Dockerfile`, `.dockerignore`, `.github/workflows/deploy-vps.yml`, `app/api/health/route.ts`
  (plantillas de `kit-deploy/templates/`; el Dockerfile agrega `NEXT_OUTPUT=standalone`).
- Vercel: `vercel.json` y los `VERCEL_*` de `lib/site.ts` y `lib/galerias.ts`. Se van cuando César apague Vercel.

---

## Pasar KREA a kit-deploy (una sola vez, César)

Todo desde PowerShell, por `ssh kit-vps`. Ningún secreto pasa por el chat ni por un archivo.

1. **Registrar el proyecto** (como root también fija el repositorio de sus imágenes):
   ```powershell
   ssh kit-vps kit-deploy project add krea Fockus26/krea --memory 512
   ```
2. **Adoptar las bases que ya existen** (`krea`, `krea_preview`, de D327):
   ```powershell
   ssh kit-vps kit-deploy db adopt krea
   ```
   Si la lista es la de KREA (sin `krea_dev`, que es de desarrollo):
   ```powershell
   ssh kit-vps kit-deploy db adopt krea --yes
   ```
   Desde ahí kit-deploy pone `DATABASE_URL` en producción y previews. No se copia a mano. Las migraciones
   siguen corriendo con el rol de la app (D436).
3. **Token del workflow** (nunca en pantalla):
   ```powershell
   ssh kit-vps kit-deploy token create krea | gh secret set KIT_DEPLOY_TOKEN -R Fockus26/krea
   ```
   Y sumar `Fockus26/krea` al token de estados de GitHub de kit-deploy (Repository access).
4. **Variables**, entorno por entorno. Cada valor se escribe en la terminal (stdin); son secretas salvo `--plain`:
   ```powershell
   ssh -t kit-vps kit-deploy env set krea production BETTER_AUTH_SECRET
   ```
   ```powershell
   ssh -t kit-vps kit-deploy env set krea production NEXT_PUBLIC_SITE_URL --plain
   ```
   - **production:** `NEXT_PUBLIC_SITE_URL` y `BETTER_AUTH_URL` = `https://krea.fockus.dev`;
     `BETTER_AUTH_SECRET` (**el mismo de Vercel**: uno nuevo cierra todas las sesiones abiertas; si no lo
     tienes a mano, uno nuevo con `openssl rand -base64 32` y todos vuelven a entrar);
     `FIREBASE_HASH_*` (4); `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`; `B2_KEY_ID`, `B2_APPLICATION_KEY`,
     `B2_BUCKET_NAME`, `B2_ENDPOINT`, `B2_REGION` (bucket de producción); `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
     (`--plain`), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (**el mismo par** de Vercel: otro obliga a cada
     alumno a reactivar el aviso); `ANTHROPIC_API_KEY`. **Sin** `DATABASE_URL` ni `DIRECT_URL`.
   - **preview:** lo mismo con el bucket B2 de preview, **sin** `BETTER_AUTH_URL` ni `NEXT_PUBLIC_SITE_URL`
     (la sesión usa `KIT_DEPLOY_PREVIEW_URL`, que pone kit-deploy) y con `NEXT_PUBLIC_GALERIAS=1` (`--plain`;
     las galerías internas solo en previews).
   - Comparar nombres con `.env.example`:
     ```powershell
     ssh kit-vps kit-deploy env ls krea production
     ```
     ```powershell
     ssh kit-vps kit-deploy env ls krea preview
     ```
5. **DNS:** `krea.fockus.dev` ya lo cubre el comodín `*.fockus.dev`. Nada que hacer en Cloudflare.
6. **Encender:**
   ```powershell
   gh variable set KIT_DEPLOY_ENABLED --body true -R Fockus26/krea
   ```
   ```powershell
   gh workflow run deploy-vps.yml -R Fockus26/krea --ref main
   ```
7. **Comprobar** en `https://krea.fockus.dev`:
   - `/api/health` → `{"ok":true,"sha":…}`.
   - Entrar como profe y como alumno; el ranking se mueve en vivo (sondeo).
   - Subir una respuesta en imagen (B2) y abrirla.
   - «Olvidé mi contraseña» llega por correo, y el enlace abre `krea.fockus.dev`.
   - Publicar una tarea: llega el aviso push a un alumno suscrito.
   - En el preview de un PR: entrar y ver `/componentes`.
8. **Avisar el enlace nuevo** a profes y alumnos (la PWA instalada apunta a la URL vieja: hay que
   reinstalarla desde `krea.fockus.dev`).

## Después de una semana

Si todo va bien, César apaga el proyecto en Vercel. Entonces, en un PR: se van `vercel.json`, los
`VERCEL_*` de `lib/site.ts` y `lib/galerias.ts`, y las menciones de Vercel en `.env.example`, `CLAUDE.md`
y `context/PROJECT_CONTEXT.md`.

## Operación

```powershell
ssh kit-vps kit-deploy status krea
```
```powershell
ssh kit-vps kit-deploy logs krea -f
```
```powershell
ssh kit-vps kit-deploy rollback krea
```

- `logs … --pr <n>` para un preview. `rollback` vuelve a la imagen anterior, sin build.
- Cambiar una variable de servidor: `env set` y `ssh kit-vps kit-deploy redeploy krea` (misma imagen).
- Cambiar una `NEXT_PUBLIC_*`: queda dentro de la imagen, hace falta `ssh kit-vps kit-deploy rebuild krea`.
- Variables locales: `ssh kit-vps kit-deploy env pull krea > .env.local` (set Development); lo de esta
  máquina sigue en `.env.development.local`.
- Apagar kit-deploy sin tocar el código: `gh variable set KIT_DEPLOY_ENABLED --body false -R Fockus26/krea`.
