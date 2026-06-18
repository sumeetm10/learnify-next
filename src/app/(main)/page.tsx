import Link from "next/link";
import Image from "next/image";
import { BookOpen, Brain, Trophy, Zap, Search, FileText, ClipboardCheck, ArrowRight, UserPlus, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingShapes } from "@/components/home/FloatingShapes";
import { Reveal } from "@/components/home/Reveal";
import { prisma } from "@/lib/prisma";

const features = [
  { icon: BookOpen, title: "Direct Access to PDFs", description: "Access all your study materials in one place with easy PDF viewing" },
  { icon: Brain, title: "Enhance Knowledge", description: "Interactive content designed to boost your understanding" },
  { icon: Trophy, title: "Track Progress", description: "Monitor your learning journey with detailed progress tracking" },
  { icon: Zap, title: "Quick & Fun Learning", description: "Engaging quizzes to test your knowledge instantly" },
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
      {/* Hero Section with Animated Gradient Background */}
      <section className="relative min-h-[92vh] flex items-center justify-center text-white overflow-hidden">
        {/* Animated gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2c5777] via-[#427da6] to-[#5a9cc5] dark:from-[#0f2236] dark:via-[#1a3550] dark:to-[#254565] animate-gradient" />

        {/* Soft glow blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#7fc3ec]/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-44 -right-24 w-[30rem] h-[30rem] bg-[#5a9cc5]/40 rounded-full blur-3xl animate-blob [animation-delay:5s]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-blob [animation-delay:9s]" />

        <FloatingShapes />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto animate-[fadeIn_1s_ease-out]">
          {/* Glass badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90 mb-8 shadow-lg animate-[fadeInDown_0.6s_ease-out]">
            <GraduationCap size={16} className="text-[#9fd3f5]" />
            Shubhashree College of Management — E-Learning Portal
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-[fadeInDown_0.8s_ease-out]">
            Unlock Your{" "}
            <span className="bg-gradient-to-r from-[#9fd3f5] via-white to-[#c7e6fa] bg-clip-text text-transparent">
              Learning Potential
            </span>
          </h1>

          <blockquote className="text-lg md:text-xl text-white/80 italic mb-10 max-w-2xl mx-auto">
            &ldquo;Education is not the learning of facts, but the training of the mind to think.&rdquo;
            <span className="block mt-2 text-sm not-italic text-white/60">&mdash; Albert Einstein</span>
          </blockquote>

          <p className="text-white/70 text-sm mb-5 flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-[#9fd3f5]" />
            Choose your course to get started
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            {courses.map((course, i) => (
              <Link key={course.id} href={`/course/${course.slug}`}>
                <Button
                  size="lg"
                  className={
                    i === 0
                      ? "bg-white text-[#2c5777] hover:bg-white/90 hover:scale-105 font-semibold px-8 rounded-full shadow-xl shadow-black/10 transition-all"
                      : "bg-white/10 backdrop-blur-md border border-white/25 text-white hover:bg-white/20 hover:scale-105 font-semibold px-8 rounded-full transition-all"
                  }
                >
                  <span className="mr-2">{course.icon}</span>
                  {course.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* Glass stat chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {[
              `${courses.length} Courses`,
              "8 Semesters Each",
              "Quizzes & Progress Tracking",
              "100% Free",
            ].map((stat) => (
              <span
                key={stat}
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-4 py-1.5 text-white/85"
              >
                {stat}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom fade into page background */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">Why Choose Learnify?</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-14 max-w-xl mx-auto">
            Everything you need to study smarter, all in one place.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 100}>
              <div className="h-full bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-gray-200/60 dark:border-white/10 rounded-3xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(66,125,166,0.18)] transition-all duration-300 hover:-translate-y-1.5 text-center group">
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#427da6] to-[#5a9cc5] flex items-center justify-center shadow-lg shadow-[#427da6]/25 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <feature.icon size={26} className="text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Course Selection Section */}
      <section id="courses" className="py-24 px-6 bg-gradient-to-b from-transparent via-[#427da6]/[0.04] to-transparent dark:via-[#427da6]/[0.06]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">Choose Your Course</h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">
              Select your program to access semesters, subjects, and study materials.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {courses.map((course, i) => (
              <Reveal key={course.id} delay={i * 120}>
                <Link
                  href={`/course/${course.slug}`}
                  className="block h-full group relative bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_50px_rgba(66,125,166,0.22)] transition-all duration-300 hover:-translate-y-1.5 text-center overflow-hidden"
                >
                  {/* Hover glow accent */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#427da6] via-[#5a9cc5] to-[#427da6] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-5xl mb-5 block group-hover:scale-110 transition-transform duration-300">{course.icon}</span>
                  <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{course.description}</p>
                  <span className="inline-flex items-center gap-1 mt-5 text-[#427da6] text-sm font-medium group-hover:gap-2 transition-all">
                    View Semesters <ArrowRight size={14} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">How It Works</h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-16 max-w-xl mx-auto">
              Get started in 3 simple steps and begin your learning journey today.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-[#427da6]/30 via-[#5a9cc5] to-[#427da6]/30" />

            {steps.map((item, i) => (
              <Reveal key={item.step} delay={i * 150}>
                <div className="flex flex-col items-center text-center relative">
                  {/* Icon circle with glass ring */}
                  <div className="relative mb-7 z-10">
                    <div className="absolute inset-0 rounded-full bg-[#427da6]/20 blur-xl scale-125" />
                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#427da6] to-[#5a9cc5] flex items-center justify-center shadow-xl shadow-[#427da6]/30 ring-4 ring-white/50 dark:ring-white/10">
                      <item.icon size={44} className="text-white" />
                    </div>
                    <span className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 text-[#427da6] border-2 border-[#427da6] text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center z-20 shadow-md">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs leading-relaxed">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 px-6 max-w-6xl mx-auto space-y-28">
        {/* PDF Access */}
        <div className="flex flex-col md:flex-row items-center gap-12">
          <Reveal className="flex-1 space-y-5">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">Enhance Your Study Sessions</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Access comprehensive study materials organized by semester and subject. Our PDF viewer lets you read course materials directly in the browser.
            </p>
            <Link href="/#courses">
              <Button className="bg-[#427da6] hover:bg-[#356a8a] rounded-full px-6 shadow-lg shadow-[#427da6]/25 hover:shadow-[#427da6]/40 transition-all hover:scale-105">
                Browse Materials
              </Button>
            </Link>
          </Reveal>
          <Reveal className="flex-1" delay={150}>
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-br from-[#427da6]/20 to-[#5a9cc5]/10 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
              <Image
                src="/images/section.png"
                alt="Study materials"
                width={500}
                height={350}
                className="relative rounded-3xl shadow-2xl shadow-[#427da6]/10 w-full h-auto"
              />
            </div>
          </Reveal>
        </div>

        {/* Quiz Section */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-12">
          <Reveal className="flex-1 space-y-5">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">Practice with Our Quizzes</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Test your understanding with interactive quizzes for every chapter. Get instant feedback and track your scores.
            </p>
            <Link href="/#courses">
              <Button className="bg-[#427da6] hover:bg-[#356a8a] rounded-full px-6 shadow-lg shadow-[#427da6]/25 hover:shadow-[#427da6]/40 transition-all hover:scale-105">
                Start Quizzing
              </Button>
            </Link>
          </Reveal>
          <Reveal className="flex-1" delay={150}>
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-br from-[#5a9cc5]/20 to-[#427da6]/10 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
              <Image
                src="/images/quiz.webp"
                alt="Interactive quizzes"
                width={500}
                height={350}
                className="relative rounded-3xl shadow-2xl shadow-[#427da6]/10 w-full h-auto"
              />
            </div>
          </Reveal>
        </div>

        {/* Progress Section */}
        <div className="flex flex-col md:flex-row items-center gap-12">
          <Reveal className="flex-1 space-y-5">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">Track Your Progress</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Monitor your learning journey with detailed progress tracking across all subjects and chapters. See what you&apos;ve covered and what&apos;s next.
            </p>
            <Link href="/progress">
              <Button className="bg-[#427da6] hover:bg-[#356a8a] rounded-full px-6 shadow-lg shadow-[#427da6]/25 hover:shadow-[#427da6]/40 transition-all hover:scale-105">
                View Progress
              </Button>
            </Link>
          </Reveal>
          <Reveal className="flex-1" delay={150}>
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-br from-[#427da6]/20 to-[#5a9cc5]/10 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
              <Image
                src="/images/progress.webp"
                alt="Progress tracking"
                width={500}
                height={350}
                className="relative rounded-3xl shadow-2xl shadow-[#427da6]/10 w-full h-auto"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden py-20 px-6 mt-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[#2c5777] via-[#427da6] to-[#5a9cc5] dark:from-[#0f2236] dark:via-[#1a3550] dark:to-[#254565] animate-gradient" />

        {/* Decorative blobs */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-white/10 rounded-full blur-2xl animate-blob" />
        <div className="absolute -bottom-20 -right-12 w-72 h-72 bg-white/10 rounded-full blur-2xl animate-blob [animation-delay:6s]" />

        <Reveal className="relative z-10 max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-white/80 text-lg mb-9 max-w-xl mx-auto">
            Join hundreds of students already using Learnify to ace their exams. Create your free account and start studying today!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-[#2c5777] hover:bg-white/90 hover:scale-105 font-semibold px-8 rounded-full gap-2 shadow-xl shadow-black/10 transition-all">
                <UserPlus size={18} />
                Register Now
              </Button>
            </Link>
            <Link href="/#courses">
              <Button size="lg" className="bg-white/10 backdrop-blur-md border border-white/25 text-white hover:bg-white/20 hover:scale-105 font-semibold px-8 rounded-full gap-2 transition-all">
                Browse Courses
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
