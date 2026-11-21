// Repro v2-01: el bloqueo por cuenta (5 fallos → 5 min) se salta.
// a) cuerpo application/x-www-form-urlencoded: la ruta no lee el email (solo JSON) y no cuenta fallos.
// b) ráfaga en paralelo: todos pasan el chequeo antes de que se registre el primer fallo.
// Uso: node .qa/repro/v2-01-bloqueo-login-saltable.mjs http://localhost:4392
import pg from "pg";
const BASE = (process.argv[2] ?? "http://localhost:4392").replace(/\/$/, "");
const pool = new pg.Pool({ connectionString: process.env.QA_DB_URL ?? "postgresql://qa_app:qa_app@127.0.0.1:54329/qa_4302" });
const [{ cedula }] = (await pool.query("select cedula from usuarios where rol='estudiante' and seccion='5C' order by cedula offset 3 limit 1")).rows;
const email = `${cedula}@alumnos.krea.app`;
const limpiar = () => pool.query("delete from rate_limit where key like $1 or key like '%sign-in%'", [`fallos|${email}`]);
await limpiar();
const ingreso = (body, ct) => fetch(`${BASE}/api/auth/sign-in/email`, { method: "POST", headers: { "content-type": ct, origin: BASE }, body });

// a) 12 fallos con form-urlencoded
const formA = [];
for (let i = 0; i < 12; i++) formA.push((await ingreso(new URLSearchParams({ email, password: `mala-${i}-xxxx` }).toString(), "application/x-www-form-urlencoded")).status);
const [filaA] = (await pool.query("select count from rate_limit where key=$1", [`fallos|${email}`])).rows;
// ¿Better Auth aceptó el form? Con la buena (contraseña del seed) debería entrar si lo parsea
const buena = (await ingreso(new URLSearchParams({ email, password: process.env.SEED_PASSWORD || "krea-demo-2026" }).toString(), "application/x-www-form-urlencoded")).status;
await limpiar();

// b) 30 fallos JSON en paralelo
const b = await Promise.all(Array.from({ length: 30 }, (_, i) => ingreso(JSON.stringify({ email, password: `mala-p${i}-xxxx` }), "application/json").then((r) => r.status)));
const procesadosB = b.filter((s) => s === 401).length;
await limpiar();
await pool.end();

const formProcesa = formA.every((s) => s === 401);
const saltaA = formProcesa && !filaA; // 401 = contraseña evaluada, sin contar fallo
const saltaB = procesadosB > 5;
console.log(JSON.stringify({ formA, filaFallosTrasForm: filaA?.count ?? 0, formConBuena: buena, rafagaParalela: { "401": procesadosB, "429": b.filter((s) => s === 429).length } }));
if (saltaA || saltaB) console.log(`FAIL form-urlencoded: ${formA.length} contraseñas probadas sin bloqueo=${saltaA}; ráfaga paralela: ${procesadosB}/30 contraseñas evaluadas (tope 5)`);
else console.log("PASS");
process.exitCode = saltaA || saltaB ? 1 : 0;
