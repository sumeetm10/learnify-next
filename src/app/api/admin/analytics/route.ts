import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const [
    totalUsers,
    totalSubjects,
    totalChapters,
    totalQuestions,
    unreadMessages,
    recentUsers,
    quizScores,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subject.count(),
    prisma.chapter.count(),
    prisma.question.count(),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.progress.aggregate({
      _avg: { quizScore: true },
      where: { quizCompleted: true },
    }),
    prisma.progress.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
        chapter: {
          select: {
            title: true,
            subject: { select: { title: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalSubjects,
    totalChapters,
    totalQuestions,
    unreadMessages,
    averageQuizScore: Math.round(quizScores._avg.quizScore ?? 0),
    recentUsers,
    recentActivity,
  });
}
