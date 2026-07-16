import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  // Get date range for last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    totalSubjects,
    totalChapters,
    totalQuestions,
    unreadMessages,
    recentUsers,
    quizScores,
    recentActivity,
    dailyRegistrations,
    dailyActivity,
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
    // Daily user registrations for last 7 days - fetch all and process manually
    prisma.user.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    }),
    // Daily activity (progress updates) for last 7 days - fetch all and process manually
    prisma.progress.findMany({
      where: {
        updatedAt: { gte: sevenDaysAgo },
      },
      select: { updatedAt: true },
    }),
  ]);

  // Process daily registrations into chart format
  const registrationChart = processDailyData(dailyRegistrations.map(u => u.createdAt), 7);

  // Process daily activity into chart format
  const activityChart = processDailyData(dailyActivity.map(p => p.updatedAt), 7);

  return NextResponse.json({
    totalUsers,
    totalSubjects,
    totalChapters,
    totalQuestions,
    unreadMessages,
    averageQuizScore: Math.round(quizScores._avg.quizScore ?? 0),
    recentUsers,
    recentActivity,
    registrationChart,
    activityChart,
  });
}

// Helper function to process daily data for charts
function processDailyData(dates: Date[], days: number) {
  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = date.toISOString().split("T")[0];

    // Count items for this day
    const count = dates.filter((d) => {
      const itemDate = new Date(d);
      return itemDate.toISOString().split("T")[0] === dateStr;
    }).length;

    result.push({
      day: dayName,
      date: dateStr,
      count,
    });
  }

  return result;
}
