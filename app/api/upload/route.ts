import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { countByImageUrl } from "@/lib/queries";
import { deleteByPublicUrl, keyFromPublicUrl, uploadToR2 } from "@/lib/r2";

// 受け付ける画像。ここに無い形式は R2 に置かせない。
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

const MAX_BYTES = 30 * 1024 * 1024; // 30MB

// 画像を受け取ってR2にアップし、公開URLを返す
export async function POST(request: Request) {
  try {
    await requireUser();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        {
          data: null,
          error: { message: "ファイルがありません", code: "VALIDATION_ERROR" },
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: `画像は ${MAX_BYTES / 1024 / 1024}MB までです`,
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 },
      );
    }

    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "対応していない形式です（PNG / JPEG / GIF / WebP）",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // 拡張子は申告された Content-Type から決める。
    // 元のファイル名をそのまま使うと、名前に含まれる文字がキーに混ざる。
    const key = `works/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const url = await uploadToR2(key, bytes, file.type);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[POST /api/upload]", e);
    const message = e instanceof Error ? e.message : "error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        },
        { status: 401 },
      );
    }
    return NextResponse.json(
      {
        data: null,
        error: { message: "Internal server error", code: "INTERNAL_ERROR" },
      },
      { status: 500 },
    );
  }
}

/**
 * アップロードしたが結局使わなかった画像を消す。
 *
 * フォームで画像を選ぶと即座にR2へ上がるので、保存せずに閉じたり
 * 別の画像に差し替えたりすると、誰も参照しないファイルが残る。
 *
 * どの作品からも参照されていないものだけを消す。この条件があるので、
 * 使用中の画像をこのエンドポイント経由で消すことはできない。
 */
export async function DELETE(request: Request) {
  try {
    await requireUser();

    const body: unknown = await request.json().catch(() => null);
    const url =
      body && typeof body === "object" && "url" in body
        ? String((body as { url: unknown }).url)
        : "";

    // 自分のバケットの works/ 配下でなければ触らない
    if (!keyFromPublicUrl(url)) {
      return NextResponse.json(
        {
          data: null,
          error: { message: "対象外のURLです", code: "VALIDATION_ERROR" },
        },
        { status: 400 },
      );
    }

    const used = await countByImageUrl(url);
    if (used > 0) {
      // 使われているなら消さない。エラーにはしない（呼び出し側は掃除のつもり）
      return NextResponse.json({ deleted: false, reason: "in_use" });
    }

    const deleted = await deleteByPublicUrl(url);
    return NextResponse.json({ deleted });
  } catch (e) {
    console.error("[DELETE /api/upload]", e);
    const message = e instanceof Error ? e.message : "error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          data: null,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        },
        { status: 401 },
      );
    }
    return NextResponse.json(
      {
        data: null,
        error: { message: "Internal server error", code: "INTERNAL_ERROR" },
      },
      { status: 500 },
    );
  }
}
