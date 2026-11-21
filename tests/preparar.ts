// Se carga antes de las pruebas (`bunfig.toml`). La carpeta de entrega (`lib/carpeta-entrega.ts`,
// D512) lee `BETTER_AUTH_SECRET`; en CI no hay ninguno y en local podría estar el real: las pruebas
// usan siempre este, de mentira.
process.env.BETTER_AUTH_SECRET = "secreto-de-prueba-carpetas-no-real";
