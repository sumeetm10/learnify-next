import Link from "next/link";
import Image from "next/image";
import { BookOpen, Brain, Trophy, Zap, Search, FileText, ClipboardCheck, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingShapes } from "@/components/home/FloatingShapes";
import { prisma } from "@/lib/prisma";

const features = [
  { icon: BookOpen, emoji: "\u{1F4D6}", title: "Direct Access to PDFs", description: "Access all your study materials in one place with easy PDF viewing" },
  { icon: Brain, emoji: "\u{1F9E0}", title: "Enhance Knowledge", description: "Interactive content designed to boost your understanding" },
  { icon: Trophy, emoji: "\u{1F3C6}", title: "Track Progress", description: "Monitor your learning journey with detailed progress tracking" },
  { icon: Zap, emoji: "\u26A1", title: "Quick & Fun Learning", description: "Engaging quizzes to test your knowledge instantly" },
];

const steps = [
  {
    step: 1,
    icon: Search,
    title: "Pick a Course",
    description: "Choose your course and browse through semesters, subjects, and chapters.",
  },
  {
    step: 2,
    icon: FileText,
    title: "Study the PDFs",
    description: "Read chapter materials uploaded by teachers directly in your browser.",
  },
  {
    step: 3,
    icon: ClipboardCheck,
    title: "Take the Quiz",
    description: "Test your understanding with MCQ quizzes and track your scores instantly.",
  },
];

export default async function HomePage() {
  const courses = await prisma.course.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <>
      {/* Hero Section with Animated Background */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-[#427da6] via-[#5a9cc5] to-[#3a6d8c] dark:from-[#1a3550] dark:via-[#254565] dark:to-[#152535] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <FloatingShapes />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto animate-[fadeIn_1s_ease-out]">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-[fadeInDown_0.8s_ease-out]">
            Unlock Your Learning Potential
          </h1>
          <blockquote className="text-lg md:text-xl text-white/80 italic mb-8">
            &ldquo;Education is not the learning of facts, but the training of the mind to think.&rdquo;
            <span className="block mt-2 text-sm not-italic text-white/60">&mdash; Albert Einstein</span>
          </blockquote>
          <p className="text-white/70 text-sm mb-4">Choose your course to get started</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {courses.map((course, i) => (
              <Link key={course.id} href={`/course/${course.slug}`}>
                <Button
                  size="lg"
                  className={
                    i === 0
                      ? "bg-white text-[#427da6] hover:bg-white/90 font-semibold px-8 rounded-full"
                      : "border-white text-white hover:bg-white/10 font-semibold px-8 rounded-full border bg-transparent"
                  }
                >
                  <span className="mr-2">{course.icon}</span>
                  {course.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Learnify?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center group"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <span className="text-4xl mb-4 block group-hover:animate-bounce">{feature.emoji}</span>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Course Selection Section */}
      <section id="courses" className="py-20 px-6 bg-white dark:bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Choose Your Course</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto">
            Select your program to access semesters, subjects, and study materials.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/course/${course.slug}`}
                className="group bg-gray-50 dark:bg-slate-900 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center border-2 border-transparent hover:border-[#427da6]/30"
              >
                <span className="text-5xl mb-4 block group-hover:scale-110 transition-transform">{course.icon}</span>
                <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{course.description}</p>
                <span className="inline-block mt-4 text-[#427da6] text-sm font-medium group-hover:underline">
                  View Semesters &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-white dark:bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-14 max-w-xl mx-auto">
            Get started in 3 simple steps and begin your learning journey today.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-[#427da6] via-[#5a9cc5] to-[#3a6d8c]" />

            {steps.map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center relative">
                {/* Icon circle */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#427da6] to-[#5a9cc5] flex items-center justify-center mb-6 shadow-lg relative z-10">
                  <item.icon size={48} className="text-white" />
                </div>
                {/* Step badge */}
                <span className="absolute top-0 right-1/2 translate-x-14 -translate-y-1 bg-white dark:bg-slate-900 text-[#427da6] border-2 border-[#427da6] text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center z-20">
                  {item.step}
                </span>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 px-6 max-w-6xl mx-auto space-y-20">
        {/* PDF Access */}
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold">Enhance Your Study Sessions</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Access comprehensive study materials organized by semester and subject. Our PDF viewer lets you read course materials directly in the browser.
            </p>
            <Link href="/#courses">
              <Button className="bg-[#427da6] hover:bg-[#356a8a] rounded-full">
                Browse Materials
              </Button>
            </Link>
          </div>
          <div className="flex-1">
            <Image
              src="/images/section.png"
              alt="Study materials"
              width={500}
              height={350}
              className="rounded-2xl shadow-lg"
            />
          </div>
        </div>

        {/* Quiz Section */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-10">
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold">Practice with Our Quizzes</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Test your understanding with interactive quizzes for every chapter. Get instant feedback and track your scores.
            </p>
            <Link href="/#courses">
              <Button className="bg-[#427da6] hover:bg-[#356a8a] rounded-full">
                Start Quizzing
              </Button>
            </Link>
          </div>
          <div className="flex-1">
            <Image
              src="/images/quiz.webp"
              alt="Interactive quizzes"
              width={500}
              height={350}
              className="rounded-2xl shadow-lg"
            />
          </div>
        </div>

        {/* Progress Section */}
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold">Track Your Progress</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Monitor your learning journey with detailed progress tracking across all subjects and chapters. See what you&apos;ve covered and what&apos;s next.
            </p>
            <Link href="/progress">
              <Button className="bg-[#427da6] hover:bg-[#356a8a] rounded-full">
                View Progress
              </Button>
            </Link>
          </div>
          <div className="flex-1">
            <Image
              src="/images/progress.webp"
              alt="Progress tracking"
              width={500}
              height={350}
              className="rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#427da6] via-[#5a9cc5] to-[#3a6d8c] dark:from-[#1a3550] dark:via-[#254565] dark:to-[#152535] py-16 px-6">
        {/* Decorative circles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10 max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Join hundreds of students already using Learnify to ace their exams. Create your free account and start studying today!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-[#427da6] hover:bg-white/90 font-semibold px-8 rounded-full gap-2">
                <UserPlus size={18} />
                Register Now
              </Button>
            </Link>
            <Link href="/#courses">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8 rounded-full gap-2">
                Browse Courses
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
