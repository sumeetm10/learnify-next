import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chapterId = searchParams.get("chapterId");

  if (!chapterId) {
    return NextResponse.json({ error: "chapterId required" }, { status: 400 });
  }

  const questions = await prisma.question.findMany({
    where: { chapterId },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ questions });
}
