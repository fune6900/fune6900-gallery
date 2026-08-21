import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { uploadToR2 } from "@/lib/r2";

// 画像を受け取ってR2にアップし、公開URLを返す
export async function POST(request: Request) {
  try {
    await requireUser();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "ファイルがありません" },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    // ファイル名をユニークにする（衝突防止）
    const ext = file.name.split(".").pop() || "png";
    const key = `works/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const url = await uploadToR2(key, bytes, file.type || "image/png");
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
