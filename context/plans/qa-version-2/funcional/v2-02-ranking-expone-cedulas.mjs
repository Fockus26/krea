// Repro v2-02: /api/ranking/<sección> le entrega a cualquier alumno la cédula de todos sus compañeros
// (las claves de `alumnos` son cédulas). La cédula es el usuario de ingreso y un dato personal de menores.
// Uso: node --env-file=.env.test.local .qa/repro/v2-02-ranking-expone-cedulas.mjs http://localhost:4392
const BASE = (process.argv[2] ?? "http://localhost:4392").replace(/\/$/, "");
const e = process.env;
const r = await fetch(`${BASE}/api/auth/sign-in/email`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email: `${e.ESTUDIANTE_EMAIL_TEST}@alumnos.krea.app`, password: e.ESTUDIANTE_PASSWORD_TEST }) });
const ck = r.headers.getSetCookie().find((c) => c.startsWith("krea.session_token=")).split(";")[0];
const sec = await fetch(`${BASE}/api/ranking/5A`, { headers: { cookie: ck } });
const j = await sec.json();
const cedulas = Object.keys(j.alumnos ?? {}).filter((k) => /^\d{7,9}$/.test(k) && k !== e.ESTUDIANTE_EMAIL_TEST);
// También en el HTML de /ranking
const html = await (await fetch(`${BASE}/ranking`, { headers: { cookie: ck } })).text();
const enHtml = cedulas.filter((c) => html.includes(c)).length;
if (cedulas.length > 0) console.log(`FAIL ${cedulas.length} cédulas ajenas en /api/ranking/5A (y ${enHtml} en el HTML de /ranking)`);
else console.log("PASS");
process.exitCode = cedulas.length > 0 ? 1 : 0;
