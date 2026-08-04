import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const semester = searchParams.get("semester");

  const subjects = await prisma.subject.findMany({
    where: semester ? { semesterId: parseInt(semester) } : undefined,
    include: {
      chapters: {
        orderBy: { orderIndex: "asc" },
        include: {
          teacherPdfs: {
            select: { id: true, title: true, filePath: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: { title: "asc" },
  });

  return NextResponse.json({ subjects });
}
