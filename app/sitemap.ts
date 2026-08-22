import type { MetadataRoute } from "next";
import { getAllDatedWorks } from "@/lib/gallery";
import { siteUrl } from "@/lib/site";

// 一覧と作品ページを sitemap.xml に出す。
// 一覧は60秒ごとに作り直しているので、こちらも同じ間隔で追従させる。
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const works = await getAllDatedWorks();

  const newest = works[0]?.updated_at;

  return [
    {
      url: new URL("/", base).toString(),
      lastModified: newest ? new Date(newest) : new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...works.map((w) => ({
      url: new URL(`/works/${w.id}`, base).toString(),
      lastModified: w.updated_at ? new Date(w.updated_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
