"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
// 組み込みの Image（measure() で使っている）と名前がぶつかるので別名にする
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import {
  IllustrationInputSchema,
  fieldErrors,
  type Illustration,
} from "@/lib/types";

// フラッシュメッセージを出しておく時間。ゲージの長さもこの値で決まる。
const TOAST_MS = 4000;

type AdminSort = "new" | "old" | "id";

// 表側の並び順の言い回しに合わせつつ、管理画面でしか要らない「登録順」を足す。
// 追加したばかりの作品を探すのに、制作日より登録の新しさのほうが役に立つ。
const SORTS: Array<[AdminSort, string]> = [
  ["new", "制作日が新しい順"],
  ["old", "制作日が古い順"],
  ["id", "登録が新しい順"],
];

/** 制作日で並べる。空の作品は末尾にまとめる（表側に出ないもの同士で固まる）。 */
function byDate(a: Illustration, b: Illustration, asc: boolean): number {
  const da = a.production_date ?? "";
  const db = b.production_date ?? "";
  if (da === db) return b.id - a.id;
  if (da === "") return 1;
  if (db === "") return -1;
  return asc ? da.localeCompare(db) : db.localeCompare(da);
}

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
  // 同じ文言が続いたときも出し直せるよう、id を持たせて key に使う
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(
    null,
  );
  const noticeSeq = useRef(0);

  // 検索と並び替え。127件ほどなので手元で絞る。サーバーに問い合わせない。
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<AdminSort>("new");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? works.filter(
          (w) =>
            w.title.toLowerCase().includes(q) ||
            (w.description ?? "").toLowerCase().includes(q) ||
            String(w.id).includes(q),
        )
      : works;

    const sorted = [...filtered];
    if (sort === "id") sorted.sort((a, b) => b.id - a.id);
    else sorted.sort((a, b) => byDate(a, b, sort === "old"));
    return sorted;
  }, [works, query, sort]);

  function showNotice(text: string) {
    noticeSeq.current += 1;
    setNotice({ id: noticeSeq.current, text });
  }

  // 消えるまでの時間はこのタイマーが持つ。ゲージの見た目は CSS 側だが、
  // 秒数は --toast-dur として同じ値を渡しているのでずれない。
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [notice]);

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
      showNotice(`「${target.title}」を削除しました`);
    } else {
      showNotice("削除に失敗しました");
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

      <div className="ad__filters">
        <label className="fg-field">
          <span aria-hidden="true">&#8981;</span>
          <span className="screen-reader-text">作品を検索</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトル / 説明 / NO."
            autoComplete="off"
          />
        </label>

        <label className="screen-reader-text" htmlFor="ad-sort">
          並び替え
        </label>
        <select
          className="fg-select"
          id="ad-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as AdminSort)}
        >
          {SORTS.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <span className="ad__filters__sp" />

        <div className="fg-gauge">
          <span>WORKS</span>
          <b>{visible.length}</b>
          {visible.length !== works.length && <span>/ {works.length}</span>}
        </div>
      </div>

      {notice && (
        <div
          // id を key にすることで、続けて出したときにも滑り込みと
          // ゲージが最初からやり直される
          key={notice.id}
          className="ad-toast"
          role="status"
          aria-live="polite"
          style={{ ["--toast-dur"]: `${TOAST_MS}ms` } as CSSProperties}
        >
          <div className="ad-toast__body">
            <span className="ad-toast__mark" aria-hidden="true">
              &#10003;
            </span>
            <p className="ad-toast__text">{notice.text}</p>
            <button
              type="button"
              className="ad-toast__close"
              onClick={() => setNotice(null)}
              aria-label="閉じる"
            >
              &#10005;
            </button>
          </div>
          <div className="ad-toast__gauge" aria-hidden="true">
            <i />
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="ad__empty">
          {works.length === 0
            ? "まだ作品がありません。"
            : `「${query}」に当てはまる作品がありません。`}
        </p>
      ) : (
        <div className="ad__list">
          {visible.map((work) => {
            const openEdit = () => {
              setEditing(work);
              setShowForm(true);
            };
            return (
              <div key={work.id} className="ad__card">
                {/* 画像そのものが編集への入口 */}
                <button
                  type="button"
                  className="ad__cardimg"
                  onClick={openEdit}
                  aria-label={`「${work.title}」を編集`}
                >
                  <span className="ad__no" aria-hidden="true">
                    NO.{String(work.id).padStart(3, "0")}
                  </span>
                  {!work.production_date && (
                    <span className="ad__nodate">NO DATE</span>
                  )}
                  {/*
                    R2にあるのは原寸（20MB超のものもある）。管理画面でも
                    そのまま出すと一覧を開くだけで大量に読み込むことになるので、
                    表側と同じく変換を通す。
                  */}
                  <NextImage
                    src={work.image_url}
                    alt=""
                    width={work.image_width ?? 1200}
                    height={work.image_height ?? 900}
                    sizes="(max-width: 767px) 45vw, 240px"
                  />
                </button>

                <div className="ad__cardbody">
                  <div className="ad__meta">
                    <p className="ad__title">{work.title}</p>
                    <p className="ad__sub">
                      {work.production_date
                        ? work.production_date.replace(/-/g, ".")
                        : "制作日なし（表側に出ません）"}
                    </p>
                  </div>

                  <div className="ad__rowbtns">
                    <button
                      type="button"
                      className="ad__mini"
                      onClick={openEdit}
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
              </div>
            );
          })}
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
            showNotice(`「${saved.title}」を保存しました`);
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

  // 画像を選ぶと即座にR2へ上がる。保存せずに閉じたり差し替えたりすると
  // 誰も使わないファイルが残るので、この画面で上げたぶんは控えておく。
  // 元から作品に付いていた画像は対象にしない。
  const uploadedHere = useRef<Set<string>>(new Set());

  // 使われないまま終わった画像を捨てる。掃除なので失敗しても黙って進む。
  async function discardUpload(url: string) {
    if (!url || !uploadedHere.current.has(url)) return;
    uploadedHere.current.delete(url);
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch {
      // R2に残るだけなので画面は止めない
    }
  }

  function handleClose() {
    // 上げたが保存しなかったものを片付けてから閉じる
    void discardUpload(imageUrl);
    onClose();
  }

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

    // 直前にこの画面で上げた画像があれば、もう使わないので捨てる
    const previous = imageUrl;
    uploadedHere.current.add(url);
    setImageUrl(url);
    setSize(await measure(file));
    if (previous && previous !== url) void discardUpload(previous);
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

    // 保存できたので、この画面で上げたものはもう掃除の対象にしない
    uploadedHere.current.clear();
    onSaved(await res.json());
  }

  return (
    <div
      className="ad-modal"
      role="dialog"
      aria-modal="true"
      aria-label={work ? "作品を編集" : "作品を追加"}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
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
              onClick={handleClose}
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
