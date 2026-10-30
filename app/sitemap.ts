import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Solo /ingresar (D023, provisional). Sin lastModified: no hay contenido con fecha real.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: new URL("/ingresar", SITE_URL).toString() }];
}
