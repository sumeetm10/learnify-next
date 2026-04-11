import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  // If not logged in, return empty progress (page still loads, just empty)
  if (!session?.user) {
    return NextResponse.json({
      semesters: {},
      totalProgress: 0,
      lastVisited: null,
    });
  }

  const userId = (session.user as unknown as { id: string }).id;

  const progress = await prisma.progress.findMany({
    where: { userId },
    include: {
      chapter: {
        include: {
          subject: true,
        },
      },
    },
  });

  // Build structured progress data grouped by course → semester → subject
  const subjects = await prisma.subject.findMany({
    include: {
      chapters: true,
      semester: { include: { course: true } },
    },
  });

  type ChapterProg = { visited: boolean; quizCompleted: boolean; quizScore: number };
  type SubjectProg = { progress: number; chapters: Record<string, ChapterProg> };
  type SemesterProg = { progress: number; name: string; subjects: Record<string, SubjectProg> };
  type CourseProg = { progress: number; name: string; icon: string; slug: string; semesters: Record<number, SemesterProg> };

  const courses: Record<string, CourseProg> = {};

  for (const subject of subjects) {
    const course = subject.semester.course;
    const semId = subject.semesterId;

    if (!courses[course.id]) {
      courses[course.id] = { progress: 0, name: course.name, icon: course.icon, slug: course.slug, semesters: {} };
    }
    if (!courses[course.id].semesters[semId]) {
      courses[course.id].semesters[semId] = { progress: 0, name: subject.semester.name, subjects: {} };
    }

    const chapters: Record<string, ChapterProg> = {};
    let subjectCompleted = 0;
    let subjectTotal = 0;

    for (const chapter of subject.chapters) {
      const prog = progress.find((p) => p.chapterId === chapter.id);
      chapters[chapter.id] = {
        visited: prog?.visited ?? false,
        quizCompleted: prog?.quizCompleted ?? false,
        quizScore: prog?.quizScore ?? 0,
      };
      subjectTotal += 2;
      if (prog?.visited) subjectCompleted++;
      if (prog?.quizCompleted) subjectCompleted++;
    }

    courses[course.id].semesters[semId].subjects[subject.id] = {
      progress: subjectTotal > 0 ? Math.round((subjectCompleted / subjectTotal) * 100) : 0,
      chapters,
    };
  }

  // Calculate semester, course, and total progress
  let totalCompleted = 0;
  let totalItems = 0;

  for (const courseId of Object.keys(courses)) {
    let courseCompleted = 0;
    let courseTotal = 0;
    const courseData = courses[courseId];

    for (const semId of Object.keys(courseData.semesters)) {
      let semCompleted = 0;
      let semTotal = 0;
      const sem = courseData.semesters[parseInt(semId)];

      for (const subjectId of Object.keys(sem.subjects)) {
        const sub = sem.subjects[subjectId];
        for (const chId of Object.keys(sub.chapters)) {
          const ch = sub.chapters[chId];
          semTotal += 2;
          if (ch.visited) semCompleted++;
          if (ch.quizCompleted) semCompleted++;
        }
      }

      sem.progress = semTotal > 0 ? Math.round((semCompleted / semTotal) * 100) : 0;
      courseCompleted += semCompleted;
      courseTotal += semTotal;
    }

    courseData.progress = courseTotal > 0 ? Math.round((courseCompleted / courseTotal) * 100) : 0;
    totalCompleted += courseCompleted;
    totalItems += courseTotal;
  }

  const lastProgress = progress
    .filter((p) => p.lastVisitedAt)
    .sort((a, b) => (b.lastVisitedAt?.getTime() ?? 0) - (a.lastVisitedAt?.getTime() ?? 0))[0];

  return NextResponse.json({
    courses,
    totalProgress: totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0,
    lastVisited: lastProgress
      ? { chapterId: lastProgress.chapterId, timestamp: lastProgress.lastVisitedAt?.toISOString() }
      : null,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // POST requires authentication — we need to know WHO completed the chapter
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const userId = (session.user as unknown as { id: string }).id;
  const body = await request.json();
  const { chapterId, action, score, totalQuestions } = body;

  if (!chapterId || !action) {
    return NextResponse.json({ error: "chapterId and action required" }, { status: 400 });
  }

  if (action === "visit") {
    await prisma.progress.upsert({
      where: { userId_chapterId: { userId, chapterId } },
      update: { visited: true, lastVisitedAt: new Date() },
      create: { userId, chapterId, visited: true, lastVisitedAt: new Date() },
    });
  } else if (action === "quiz") {
    const quizScore = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    await prisma.progress.upsert({
      where: { userId_chapterId: { userId, chapterId } },
      update: { quizCompleted: true, quizScore, lastVisitedAt: new Date() },
      create: { userId, chapterId, quizCompleted: true, quizScore, lastVisitedAt: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}
