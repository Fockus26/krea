import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Portal privado con sesión: solo /ingresar es indexable (D023, provisional).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/ingresar", disallow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
