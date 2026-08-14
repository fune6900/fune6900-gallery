import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getIllustration } from "@/lib/queries";

export const revalidate = 60;

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await getIllustration(Number(id));
  if (!work) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-neutral-400 hover:text-white"
      >
        ← 一覧に戻る
      </Link>

      <div className="overflow-hidden rounded-xl bg-neutral-900">
        <div className="relative aspect-square w-full sm:aspect-[4/3]">
          <Image
            src={work.image_url}
            alt={work.title}
            fill
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-bold">{work.title}</h1>
        {work.production_date && (
          <p className="mt-1 text-sm text-neutral-500">
            制作日: {work.production_date}
          </p>
        )}
        {work.description && (
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-neutral-300">
            {work.description}
          </p>
        )}
      </div>
    </main>
  );
}
