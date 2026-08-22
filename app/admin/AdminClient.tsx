"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import {
  IllustrationInputSchema,
  fieldErrors,
  type Illustration,
} from "@/lib/types";

export default function AdminClient({
  initialWorks,
}: {
  initialWorks: Illustration[];
}) {
  const router = useRouter();
  const [works, setWorks] = useState(initialWorks);
  const [editing, setEditing] = useState<Illustration | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<Illustration | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleLogout() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    const res = await fetch(`/api/works/${target.id}`, { method: "DELETE" });
    if (res.ok) {
      setWorks((w) => w.filter((x) => x.id !== target.id));
      setNotice(`「${target.title}」を削除しました`);
    } else {
      setNotice("削除に失敗しました");
    }
  }

  return (
    <main className="ad fg-wrap">
      <div className="ad__head">
        <div className="fg-shead fg-shead--sm" style={{ margin: 0 }}>
          <div className="fg-shead__block">
            <p className="fg-shead__jp">作品管理</p>
            <p className="fg-shead__en">ADMIN</p>
          </div>
        </div>

        <div className="ad__actions">
          <button
            type="button"
            className="fg-btn fg-btn--lime"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            ＋ 新規追加
          </button>
          <a className="fg-btn fg-btn--outline" href="/">
            サイトを見る
          </a>
          <button
            type="button"
            className="fg-btn fg-btn--outline"
            onClick={handleLogout}
          >
            ログアウト
          </button>
        </div>
      </div>

      <div className="fg-gauge" style={{ marginBottom: 18 }}>
        <span>WORKS</span>
        <b>{works.length}</b>
      </div>

      {notice && (
        <p className="fg-sticker fg-sticker--lime" style={{ marginBottom: 16 }}>
          {notice}
        </p>
      )}

      {works.length === 0 ? (
        <p className="ad__empty">まだ作品がありません。</p>
      ) : (
        <div className="ad__list">
          {works.map((work) => (
            <div key={work.id} className="ad__row">
              <span className="ad__thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={work.image_url} alt="" loading="lazy" />
              </span>

              <div className="ad__meta">
                <p className="ad__title">{work.title}</p>
                <p className="ad__sub">
                  NO.{String(work.id).padStart(3, "0")}
                  {" / "}
                  {work.production_date
                    ? work.production_date.replace(/-/g, ".")
                    : "日付なし"}
                </p>
              </div>

              <div className="ad__rowbtns">
                <button
                  type="button"
                  className="ad__mini"
                  onClick={() => {
                    setEditing(work);
                    setShowForm(true);
                  }}
                >
                  編集
                </button>
                <button
                  type="button"
                  className="ad__mini ad__mini--danger"
                  onClick={() => setDeleting(work)}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
            setNotice(`「${saved.title}」を保存しました`);
          }}
        />
      )}

      {deleting && (
        <DeleteConfirm
          work={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------
 *  削除の確認
 *
 *  素の confirm() だと見た目がサイトから浮くうえ、何を消すのかが
 *  文字だけになる。対象のサムネとタイトルを見せてから確かめる。
 * ----------------------------------------------------------- */
function DeleteConfirm({
  work,
  onCancel,
  onConfirm,
}: {
  work: Illustration;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="ad-modal"
      role="dialog"
      aria-modal="true"
      aria-label="削除の確認"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="ad-modal__box ad-modal__box--sm">
        <h2 className="ad-modal__title">この作品を削除しますか？</h2>
        <p className="ad-modal__lead">DELETE</p>

        <div className="ad-confirm__target">
          <span className="ad__thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={work.image_url} alt="" />
          </span>
          <div className="ad__meta">
            <p className="ad__title">{work.title}</p>
            <p className="ad__sub">NO.{String(work.id).padStart(3, "0")}</p>
          </div>
        </div>

        <p className="ad-confirm__warn">
          削除すると元に戻せません。画像はR2に残ります。
        </p>

        <div className="ad-modal__foot">
          <button
            type="button"
            className="fg-btn fg-btn--outline"
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button type="button" className="fg-btn" onClick={onConfirm}>
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 *  追加 / 編集フォーム
 * ----------------------------------------------------------- */
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dateRef = useRef<HTMLInputElement>(null);

  function openCalendar() {
    const el = dateRef.current;
    if (!el) return;
    // showPicker() が無いブラウザではフォーカスだけ当てる
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        // ユーザー操作起因でないと弾かれることがある。その場合は下へ
      }
    }
    el.focus();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrors((prev) => ({ ...prev, image_url: "" }));

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setErrors((prev) => ({
        ...prev,
        image_url: body?.error?.message ?? "画像アップロードに失敗しました",
      }));
      return;
    }

    const { url } = await res.json();
    setImageUrl(url);
    setSize(await measure(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      title,
      description: description === "" ? null : description,
      image_url: imageUrl,
      production_date: productionDate === "" ? null : productionDate,
      image_width: size?.w ?? null,
      image_height: size?.h ?? null,
    };

    // 送る前に同じスキーマで確かめる。APIでも同じものを通すので、
    // ここを抜けられても保存はされない。
    const parsed = IllustrationInputSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setSaving(true);
    setErrors({});

    const res = work
      ? await fetch(`/api/works/${work.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        })
      : await fetch("/api/works", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setErrors(
        body?.error?.fields ?? {
          _: body?.error?.message ?? "保存に失敗しました",
        },
      );
      return;
    }

    onSaved(await res.json());
  }

  return (
    <div
      className="ad-modal"
      role="dialog"
      aria-modal="true"
      aria-label={work ? "作品を編集" : "作品を追加"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ad-modal__box">
        <h2 className="ad-modal__title">
          {work ? "作品を編集" : "作品を追加"}
        </h2>
        <p className="ad-modal__lead">
          {work ? `NO.${String(work.id).padStart(3, "0")}` : "NEW WORK"}
        </p>

        <form className="ad-form" onSubmit={handleSubmit} noValidate>
          {/* タイトル */}
          <div>
            <label className="ad-field__label" htmlFor="ad-title">
              タイトル<span className="ad-field__req">REQUIRED</span>
            </label>
            <input
              id="ad-title"
              className={`ad-input ${errors.title ? "ad-input--bad" : ""}`}
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
            />
            {errors.title ? (
              <p className="ad-field__error">{errors.title}</p>
            ) : (
              <p className="ad-field__hint">{title.trim().length} / 120</p>
            )}
          </div>

          {/* 画像 */}
          <div>
            <label className="ad-field__label" htmlFor="ad-file">
              画像<span className="ad-field__req">REQUIRED</span>
            </label>
            <div className="ad-image">
              <span className="ad-image__preview">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="選択中の画像" />
                ) : (
                  <span>NO IMAGE</span>
                )}
              </span>
              <div className="ad-image__side">
                <input
                  id="ad-file"
                  className="ad-file"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handleFileChange}
                />
                {uploading && (
                  <p className="ad-field__hint">アップロード中...</p>
                )}
                {!uploading && size && (
                  <p className="ad-field__hint">
                    {size.w} × {size.h}
                  </p>
                )}
                {errors.image_url && (
                  <p className="ad-field__error">{errors.image_url}</p>
                )}
              </div>
            </div>
          </div>

          {/* 制作日 */}
          <div>
            <label className="ad-field__label" htmlFor="ad-date">
              制作日
            </label>
            <div className="ad-date">
              <input
                id="ad-date"
                ref={dateRef}
                className={`ad-input ${errors.production_date ? "ad-input--bad" : ""}`}
                type="date"
                value={productionDate}
                min="1970-01-01"
                max="2999-12-31"
                onChange={(e) => setProductionDate(e.target.value)}
                aria-invalid={!!errors.production_date}
              />
              <button
                type="button"
                className="ad-date__btn"
                onClick={openCalendar}
                aria-label="カレンダーから選ぶ"
                title="カレンダーから選ぶ"
              >
                &#128197;
              </button>
            </div>
            {errors.production_date ? (
              <p className="ad-field__error">{errors.production_date}</p>
            ) : (
              <p className="ad-field__hint">空にすると表側の一覧には出ません</p>
            )}
          </div>

          {/* 説明 */}
          <div>
            <label className="ad-field__label" htmlFor="ad-desc">
              説明
            </label>
            <textarea
              id="ad-desc"
              className={`ad-textarea ${errors.description ? "ad-textarea--bad" : ""}`}
              value={description ?? ""}
              maxLength={2000}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={!!errors.description}
            />
            {errors.description ? (
              <p className="ad-field__error">{errors.description}</p>
            ) : (
              <p className="ad-field__hint">
                {(description ?? "").length} / 2000
              </p>
            )}
          </div>

          {errors._ && <p className="ad-field__error">{errors._}</p>}

          <div className="ad-modal__foot">
            <button
              type="button"
              className="fg-btn fg-btn--outline"
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="fg-btn fg-btn--lime"
              disabled={saving || uploading}
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
