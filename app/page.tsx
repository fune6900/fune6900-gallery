import Link from "next/link";
import Image from "next/image";
import { getAllIllustrations } from "@/lib/queries";

// このページはサーバーコンポーネント。ビルド時/リクエスト時にDBから直接取得する。
export const revalidate = 60; // 60秒ごとに再生成（新規追加が反映される）

export default async function HomePage() {
  const works = await getAllIllustrations();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Fune Gallery</h1>
        <p className="mt-2 text-sm text-neutral-400">
          イラスト作品 {works.length} 点
        </p>
      </header>

      {/* 作品グリッド */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {works.map((work) => (
          <Link
            key={work.id}
            href={`/works/${work.id}`}
            className="group block overflow-hidden rounded-lg bg-neutral-900"
          >
            <div className="relative aspect-square">
              <Image
                src={work.image_url}
                alt={work.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-3">
              <h2 className="truncate text-sm font-medium">{work.title}</h2>
              {work.production_date && (
                <p className="mt-1 text-xs text-neutral-500">
                  {work.production_date}
                </p>
              )}
            </div>
          </Link>
        ))}
      </section>

      {works.length === 0 && (
        <p className="text-neutral-500">まだ作品がありません。</p>
      )}
    </main>
  );
}
