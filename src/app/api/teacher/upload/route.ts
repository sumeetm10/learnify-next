import { NextResponse } from "next/server";
import { requireTeacherOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeKey, uploadToR2 } from "@/lib/r2";

export async function POST(request: Request) {
  const auth = await requireTeacherOrAdmin();
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const chapterId = formData.get("chapterId") as string;

  if (!file || !title || !chapterId) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = makeKey("teacher", file.name);
  const url = await uploadToR2(key, buffer, "application/pdf");

  const pdf = await prisma.teacherPdf.create({
    data: {
      title,
      filePath: url,
      chapterId,
      uploadedById: (auth.session!.user as { id: string }).id,
    },
  });

  return NextResponse.json({ success: true, pdf });
}
