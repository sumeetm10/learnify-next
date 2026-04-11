import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

interface Props {
  params: Promise<{ courseSlug: string }>;
}

export default async function CoursePage({ params }: Props) {
  const { courseSlug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      semesters: {
        orderBy: { id: "asc" },
        include: {
          _count: { select: { subjects: true } },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#427da6] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Courses
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-5xl mb-4 block">{course.icon}</span>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{course.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{course.description}</p>
        </div>

        {/* Semester Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {course.semesters.map((semester) => (
            <Link
              key={semester.id}
              href={`/course/${course.slug}/semester/${semester.id}`}
              className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center border border-transparent hover:border-[#427da6]/30"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#427da6] to-[#5a9cc5] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <BookOpen size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{semester.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {semester._count.subjects} {semester._count.subjects === 1 ? "subject" : "subjects"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
