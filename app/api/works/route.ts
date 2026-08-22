import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createIllustration } from "@/lib/queries";
import { IllustrationInputSchema, fieldErrors } from "@/lib/types";

// 作品を新規作成（管理画面から呼ばれる）
export async function POST(request: Request) {
  try {
    await requireUser(); // ログイン必須

    const body: unknown = await request.json();
    const parsed = IllustrationInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            message: "入力内容を確認してください",
            code: "VALIDATION_ERROR",
            fields: fieldErrors(parsed.error),
          },
        },
        { status: 400 },
      );
    }

    const created = await createIllustration(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    // 詳細はログにだけ出す。レスポンスには載せない（api-design.md）
    console.error("[POST /api/works]", e);
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
