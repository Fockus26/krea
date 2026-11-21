# feat/profes-admin (W1, tanda 2026-11-06)

- Profesor admin: `usuarios.admin` + claim `admin`, `exigirAdmin()` (D231).
- Cuentas nuevas con contraseña temporal (12 símbolos sin ambiguos, una vez) y «Crea tu contraseña» obligatoria en `/crear-contrasena`, con proxy + DAL (D232).
- `/profe/profesores` solo admin: crear, editar, eliminar; «Profesores» en lateral y Menú (D233). `lib/cuentas.ts` genérico por rol para W12.
- Ningún profe edita a otro: Perfil usa la sesión; `editarAlumno` rechaza profesores; Perfil del profe con datos, avatar, apariencia y contraseña conectados (D234, reemplaza a D158).
- `scripts/admin-profesor.ts` (D235). Acción manual de César: `--hacer-admin 45001237` (y `--crear-profesor` antes si no existe) y crear 45004948.
- Filas de checklist: 137 (copy de Profesores, nav y Perfil del profe), 138 (copy de «Crea tu contraseña»).
