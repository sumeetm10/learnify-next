import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SemesterClient } from "@/components/semester/SemesterClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ courseSlug: string; semesterId: string }>;
}

export default async function CourseSemesterPage({ params }: Props) {
  const { courseSlug, semesterId } = await params;
  const semNum = parseInt(semesterId);

  if (isNaN(semNum)) {
    notFound();
  }

  // Verify course exists and semester belongs to it
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
  });

  if (!course) {
    notFound();
  }

  const semester = await prisma.semester.findFirst({
    where: { id: semNum, courseId: course.id },
  });

  if (!semester) {
    notFound();
  }

  const subjects = await prisma.subject.findMany({
    where: { semesterId: semNum },
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

  return (
    <div className="pt-24 pb-16 min-h-screen">
      {/* Back link */}
      <div className="max-w-5xl mx-auto px-6">
        <Link
          href={`/course/${courseSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#427da6] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to {course.name} Semesters
        </Link>
      </div>

      <div className="text-center mb-12 px-6">
        <p className="text-sm text-[#427da6] font-medium mb-2">{course.name}</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          {semester.name} Subjects
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Select a subject to begin learning</p>
      </div>
      <SemesterClient subjects={JSON.parse(JSON.stringify(subjects))} />
    </div>
  );
}
