import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// /robots.txt を生成する。
// 管理画面とAPIはクロールさせない（公開する内容ではない）。
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
