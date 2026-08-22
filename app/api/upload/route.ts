import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { uploadToR2 } from "@/lib/r2";

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
