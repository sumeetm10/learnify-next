"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { CheckCircle, Circle, BookOpen, Trophy, LogIn, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProgressData } from "@/types";

const subjectNames: Record<string, string> = {
  mathematics: "Mathematics I",
  english: "English",
  "internet-technology": "Internet Technology I",
  "computer-fundamentals": "Fundamental of Computer System",
  "programming-language": "Programming Language",
  dsa: "DSA",
  java: "Java",
  "mathematics-2": "Mathematics II",
  "business-communication": "Business Communication",
  "digital-system": "Digital System",
};

export default function ProgressPage() {
  const { data: session, status } = useSession();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetch("/api/progress")
        .then((r) => r.json())
        .then((data) => {
          setProgress(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || (session && loading)) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header skeleton */}
          <div className="text-center mb-10">
            <Skeleton className="h-9 w-72 mx-auto mb-3" />
            <Skeleton className="h-5 w-56 mx-auto" />
          </div>

          {/* Overall progress skeleton */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-7 w-14" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </CardContent>
          </Card>

          {/* Semester skeleton */}
          {[1, 2].map((sem) => (
            <div key={sem} className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-10" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((subj) => (
                  <Card key={subj}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-44" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                      <Skeleton className="h-2 w-full mt-2 rounded-full" />
                    </CardHeader>
                    <CardContent className="pt-2 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map((ch) => (
                          <Skeleton key={ch} className="h-10 w-full rounded-lg" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-6">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Sign in to Track Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                Create an account or sign in to track your learning progress across all chapters.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-[#427da6] hover:bg-[#356a8f] text-white font-medium px-6 py-2.5 rounded-full transition-colors"
                >
                  <LogIn size={16} />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 border border-[#427da6] text-[#427da6] hover:bg-[#427da6]/10 font-medium px-6 py-2.5 rounded-full transition-colors"
                >
                  <UserPlus size={16} />
                  Register
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Unable to load progress data.</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">My Learning Progress</h1>
          <p className="text-gray-600 dark:text-gray-300">Track your progress across all chapters</p>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">Overall Progress</h2>
              <span className="text-2xl font-bold text-[#427da6]">{progress.totalProgress}%</span>
            </div>
            <ProgressBar value={progress.totalProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Course → Semester → Subject Sections */}
        {Object.entries(progress.courses).map(([courseId, courseData]) => (
          <div key={courseId} className="mb-12">
            {/* Course Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                <span className="mr-2">{courseData.icon}</span>
                {courseData.name}
              </h2>
              <span className="text-sm font-medium text-[#427da6]">{courseData.progress}%</span>
            </div>

            {/* Semester Sections within Course */}
            {Object.entries(courseData.semesters).map(([semId, semData]) => {
              const hasSubjects = Object.keys(semData.subjects).length > 0;
              if (!hasSubjects) return null;

              return (
                <div key={semId} className="mb-8 ml-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{semData.name}</h3>
                    <span className="text-sm font-medium text-[#427da6]">{semData.progress}%</span>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(semData.subjects).map(([subjectId, subjectData]) => (
                      <Card key={subjectId}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{subjectNames[subjectId] || subjectId}</CardTitle>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{subjectData.progress}%</span>
                          </div>
                          <ProgressBar value={subjectData.progress} className="h-2 mt-2" />
                        </CardHeader>
                        <CardContent className="pt-2 pb-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(subjectData.chapters).map(([chapterId, chapterData]) => (
                              <div
                                key={chapterId}
                                className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 text-sm"
                              >
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  {chapterData.visited ? (
                                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                  ) : (
                                    <Circle size={16} className="text-gray-300 dark:text-gray-500 flex-shrink-0" />
                                  )}
                                  <span className="truncate font-medium">
                                    {chapterId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {chapterData.visited && (
                                    <span className="flex items-center gap-0.5 text-xs text-green-600">
                                      <BookOpen size={12} /> Read
                                    </span>
                                  )}
                                  {chapterData.quizCompleted && (
                                    <span className="flex items-center gap-0.5 text-xs text-[#427da6]">
                                      <Trophy size={12} /> {chapterData.quizScore}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      </div>
    </div>
  );
}
