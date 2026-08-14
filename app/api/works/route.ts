import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createIllustration } from "@/lib/queries";

// 作品を新規作成（管理画面から呼ばれる）
export async function POST(request: Request) {
  try {
    await requireUser(); // ログイン必須
    const body = await request.json();
    const { title, description, image_url, production_date } = body;

    if (!title || !image_url) {
      return NextResponse.json(
        { error: "タイトルと画像は必須です" },
        { status: 400 }
      );
    }

    const created = await createIllustration({
      title,
      description: description ?? null,
      image_url,
      production_date: production_date || null,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
