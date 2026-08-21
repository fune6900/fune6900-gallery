"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { Illustration } from "@/lib/types";

export default function AdminClient({
  initialWorks,
}: {
  initialWorks: Illustration[];
}) {
  const router = useRouter();
  const [works, setWorks] = useState(initialWorks);
  const [editing, setEditing] = useState<Illustration | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleLogout() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("この作品を削除しますか？")) return;
    const res = await fetch(`/api/works/${id}`, { method: "DELETE" });
    if (res.ok) {
      setWorks((w) => w.filter((x) => x.id !== id));
    } else {
      alert("削除に失敗しました");
    }
  }

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(work: Illustration) {
    setEditing(work);
    setShowForm(true);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">作品管理</h1>
        <div className="flex gap-3">
          <button
            onClick={openNew}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-black"
          >
            ＋ 新規追加
          </button>
          <button
            onClick={handleLogout}
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm"
          >
            ログアウト
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-neutral-400">{works.length} 点</p>

      {/* 作品リスト */}
      <div className="space-y-2">
        {works.map((work) => (
          <div
            key={work.id}
            className="flex items-center gap-4 rounded-lg bg-neutral-900 p-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={work.image_url}
              alt={work.title}
              className="h-16 w-16 rounded object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{work.title}</p>
              <p className="text-xs text-neutral-500">
                {work.production_date ?? "日付なし"}
              </p>
            </div>
            <button
              onClick={() => openEdit(work)}
              className="rounded border border-neutral-700 px-3 py-1 text-sm"
            >
              編集
            </button>
            <button
              onClick={() => handleDelete(work.id)}
              className="rounded border border-red-800 px-3 py-1 text-sm text-red-400"
            >
              削除
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <WorkForm
          work={editing}
          onClose={() => setShowForm(false)}
          onSaved={(saved) => {
            setWorks((w) => {
              const exists = w.find((x) => x.id === saved.id);
              return exists
                ? w.map((x) => (x.id === saved.id ? saved : x))
                : [saved, ...w];
            });
            setShowForm(false);
          }}
        />
      )}
    </main>
  );
}

// ---- 追加/編集フォーム ----
function WorkForm({
  work,
  onClose,
  onSaved,
}: {
  work: Illustration | null;
  onClose: () => void;
  onSaved: (w: Illustration) => void;
}) {
  const [title, setTitle] = useState(work?.title ?? "");
  const [description, setDescription] = useState(work?.description ?? "");
  const [productionDate, setProductionDate] = useState(
    work?.production_date ?? "",
  );
  const [imageUrl, setImageUrl] = useState(work?.image_url ?? "");
  // 表側のグリッドはこの比からカードの行数を決めるので、
  // アップロード時にブラウザで実寸を測って一緒に保存する。
  const [size, setSize] = useState<{ w: number; h: number } | null>(
    work?.image_width && work?.image_height
      ? { w: work.image_width, h: work.image_height }
      : null,
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      setError("画像アップロードに失敗しました");
      return;
    }
    const { url } = await res.json();
    setImageUrl(url);
    setSize(await measure(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl) {
      setError("画像をアップロードしてください");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title,
      description,
      image_url: imageUrl,
      production_date: productionDate || null,
      image_width: size?.w ?? null,
      image_height: size?.h ?? null,
    };
    const res = work
      ? await fetch(`/api/works/${work.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/works", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (!res.ok) {
      setError("保存に失敗しました");
      return;
    }
    const saved = await res.json();
    onSaved(saved);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-neutral-900 p-6">
        <h2 className="mb-4 text-lg font-bold">
          {work ? "作品を編集" : "作品を追加"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-400">
              タイトル
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-400">画像</label>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="preview"
                className="mb-2 h-32 w-32 rounded object-cover"
              />
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {uploading && (
              <p className="mt-1 text-xs text-neutral-500">アップロード中...</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-400">
              制作日
            </label>
            <input
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-400">説明</label>
            <textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 選んだ画像の実寸を読む。読めなければ null（表側は 4:3 として扱う）。
function measure(file: File): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
