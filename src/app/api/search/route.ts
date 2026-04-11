import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [subjects, chapters] = await Promise.all([
    prisma.subject.findMany({
      where: { title: { contains: query, mode: "insensitive" } },
      select: { id: true, title: true, semesterId: true },
    }),
    prisma.chapter.findMany({
      where: { title: { contains: query, mode: "insensitive" } },
      select: {
        id: true,
        title: true,
        subject: { select: { id: true, title: true, semesterId: true } },
      },
    }),
  ]);

  const results = [
    ...subjects.map((s) => ({
      type: "subject" as const,
      id: s.id,
      title: s.title,
      semesterId: s.semesterId,
    })),
    ...chapters.map((c) => ({
      type: "chapter" as const,
      id: c.id,
      title: c.title,
      semesterId: c.subject.semesterId,
      subjectId: c.subject.id,
      subjectTitle: c.subject.title,
    })),
  ];

  return NextResponse.json({ results });
}
