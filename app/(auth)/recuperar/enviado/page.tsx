import { redirect } from "next/navigation";

/**
 * «Revisa tu correo» ya no es una ruta (D186): se muestra en /recuperar tras pedir el enlace,
 * que es quien conoce la cédula para «Reenviar enlace». La pantalla sigue en
 * /secciones/ingresar/enviado.
 */
export default function RecuperarEnviadoPage() {
  redirect("/recuperar");
}
