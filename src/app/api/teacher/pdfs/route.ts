import { NextResponse } from "next/server";
import { requireTeacherOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/r2";

export async function GET() {
  const auth = await requireTeacherOrAdmin();
  if (auth.error) return auth.error;

  const pdfs = await prisma.teacherPdf.findMany({
    include: {
      chapter: {
        include: {
          subject: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ pdfs });
}

export async function DELETE(request: Request) {
  const auth = await requireTeacherOrAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const pdf = await prisma.teacherPdf.findUnique({ where: { id } });
  if (!pdf) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ownership: a teacher can only delete their own PDFs; admins can delete any.
  const role = (auth.session!.user as { role?: string }).role;
  const userId = (auth.session!.user as { id: string }).id;
  if (role !== "ADMIN" && pdf.uploadedById !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Remove file from R2 (ignore failures so a missing object doesn't block delete)
  try {
    await deleteFromR2(pdf.filePath);
  } catch {
    // already gone or legacy local path — continue
  }

  await prisma.teacherPdf.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
