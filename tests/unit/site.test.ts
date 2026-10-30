import { describe, expect, test } from "bun:test";
import { resolveSiteUrl } from "@/lib/site";

describe("resolveSiteUrl", () => {
  test("NEXT_PUBLIC_SITE_URL manda", () => {
    const url = resolveSiteUrl({
      NEXT_PUBLIC_SITE_URL: "https://krea.example",
      VERCEL_PROJECT_PRODUCTION_URL: "otro.vercel.app",
    });
    expect(url.origin).toBe("https://krea.example");
  });
  test("sin ella, el dominio de producción de Vercel con https", () => {
    const url = resolveSiteUrl({
      VERCEL_PROJECT_PRODUCTION_URL: "krea.vercel.app",
    });
    expect(url.origin).toBe("https://krea.vercel.app");
  });
  test("sin variables, localhost:3000", () => {
    expect(resolveSiteUrl({}).origin).toBe("http://localhost:3000");
  });
  test("valores vacíos o con espacios se ignoran", () => {
    const url = resolveSiteUrl({
      NEXT_PUBLIC_SITE_URL: "  ",
      VERCEL_PROJECT_PRODUCTION_URL: "",
    });
    expect(url.origin).toBe("http://localhost:3000");
  });
});
