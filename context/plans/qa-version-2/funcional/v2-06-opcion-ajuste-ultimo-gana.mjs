// Repro v2-06: dos profes editan la misma opción de ajuste a la vez (o uno con la lista vieja abierta):
// los dos reciben ok y queda la del último, sin aviso de `cambio` (lib/data/motivos.ts: sin versión).
// Uso: node --env-file=.env.test.local .qa/repro/v2-06-opcion-ajuste-ultimo-gana.mjs http://localhost:4392
import { login, act, q, cerrarDb, ponerPassword } from "../v2/lib.mjs";
const e = process.env;
const pro = await login(e.PROFESOR_EMAIL_TEST, e.PROFESOR_PASSWORD_TEST);
let pro2;
try { pro2 = await login("10000002", "qa-local-Clave-2026"); } catch {
  await act("crearProfesor", [{ cedula: "10000002", nombres: "Profa QA", apellidos: "Segunda", email: "" }], pro, { ruta: "/profe/profesores" });
  await ponerPassword("10000002", "qa-local-Clave-2026"); pro2 = await login("10000002", "qa-local-Clave-2026");
}
// Tras R6 (D509): los dos leyeron la misma versión de la lista (actualizadoEn, 0 si no existe)
const fila = (await q("select datos from config where id='motivos'"))[0];
const version = Number(fila?.datos?.actualizadoEn ?? 0);
const a = await act("editarMotivo", [{ id: "extra", etiqueta: "Trabajo extra (profe 1)", valor: 2, version }], pro, { ruta: "/profe/puntos" });
// El profe 2 tenía abierta la lista de antes y guarda su cambio
const b = await act("editarMotivo", [{ id: "extra", etiqueta: "Trabajo extra (profe 2)", valor: 5, version }], pro2, { ruta: "/profe/puntos" });
const [{ datos }] = await q("select datos from config where id='motivos'");
const final = datos.motivos.find((m) => m.id === "extra");
await cerrarDb();
const pisado = !(a.ok && !b.ok && b.error === "cambio" && final?.etiqueta.includes("profe 1"));
console.log(JSON.stringify({ a: a.ok ?? a, b: b.ok ? "ok" : b.error, final: final?.etiqueta }));
console.log(pisado ? "FAIL" : "PASS");
process.exitCode = pisado ? 1 : 0;
