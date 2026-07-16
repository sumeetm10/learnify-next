"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, BookOpen, CheckCircle, Trophy } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { ProgressData } from "@/types";

interface ProgressChartProps {
  progress: ProgressData;
}

export default function ProgressChart({ progress }: ProgressChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Client-mount guard for the chart (avoids SSR/hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Transform data for the area chart - show chapter-level data for more variation
  const chartData: { name: string; progress: number }[] = [];

  Object.entries(progress.courses).forEach(([courseId, courseData]) => {
    Object.entries(courseData.semesters).forEach(([semId, semData]) => {
      Object.entries(semData.subjects).forEach(([subjectId, subjectData]) => {
        // Show each chapter as a data point for more variation
        Object.entries(subjectData.chapters).forEach(([chapterId, chapterData], index) => {
          // Calculate chapter progress: 30% for reading + 40% for quiz + 30% for score
          let chapterProgress = 0;
          if (chapterData.visited) chapterProgress += 30;
          if (chapterData.quizCompleted) {
            chapterProgress += 40;
            chapterProgress += Math.round((chapterData.quizScore / 100) * 30);
          }

          // Create meaningful labels
          const subjectShort = subjectId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()).substring(0, 8);
          const chapterShort = chapterId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()).substring(0, 6);

          chartData.push({
            name: `${subjectShort} ${index + 1}`,
            progress: chapterProgress,
          });
        });
      });
    });
  });

  // Calculate stats
  const totalChapters = Object.values(progress.courses).reduce((acc, course) => {
    return acc + Object.values(course.semesters).reduce((acc2, sem) => {
      return acc2 + Object.values(sem.subjects).reduce((acc3, sub) => {
        return acc3 + Object.keys(sub.chapters).length;
      }, 0);
    }, 0);
  }, 0);

  const completedChapters = Object.values(progress.courses).reduce((acc, course) => {
    return acc + Object.values(course.semesters).reduce((acc2, sem) => {
      return acc2 + Object.values(sem.subjects).reduce((acc3, sub) => {
        return acc3 + Object.values(sub.chapters).filter((ch) => ch.visited).length;
      }, 0);
    }, 0);
  }, 0);

  const completedQuizzes = Object.values(progress.courses).reduce((acc, course) => {
    return acc + Object.values(course.semesters).reduce((acc2, sem) => {
      return acc2 + Object.values(sem.subjects).reduce((acc3, sub) => {
        return acc3 + Object.values(sub.chapters).filter((ch) => ch.quizCompleted).length;
      }, 0);
    }, 0);
  }, 0);

  const totalQuizScore = Object.values(progress.courses).reduce((acc, course) => {
    return acc + Object.values(course.semesters).reduce((acc2, sem) => {
      return acc2 + Object.values(sem.subjects).reduce((acc3, sub) => {
        const quizChapters = Object.values(sub.chapters).filter((ch) => ch.quizCompleted);
        return acc3 + quizChapters.reduce((acc4, ch) => acc4 + ch.quizScore, 0);
      }, 0);
    }, 0);
  }, 0);

  const quizCount = Object.values(progress.courses).reduce((acc, course) => {
    return acc + Object.values(course.semesters).reduce((acc2, sem) => {
      return acc2 + Object.values(sem.subjects).reduce((acc3, sub) => {
        return acc3 + Object.values(sub.chapters).filter((ch) => ch.quizCompleted).length;
      }, 0);
    }, 0);
  }, 0);

  const avgQuiz = quizCount > 0 ? Math.round(totalQuizScore / quizCount) : 0;

  if (chartData.length === 0) {
    return null;
  }

  // Theme-aware colors
  const isDark = mounted && theme === "dark";

  return (
    <div className="space-y-6 mb-8">
      {/* Main Area Card */}
      <Card className={`
        ${isDark ? 'bg-[#1a1f2e] border-[#2d3548]' : 'bg-white border-gray-200'}
        border shadow-lg overflow-hidden
      `}>
        <CardContent className="p-0">
          {/* Header Section */}
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Learning Progress
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Track your academic journey
                  </p>
                </div>
              </div>
              <div className={`
                px-3 py-1 text-xs font-semibold rounded-full
                ${progress.totalProgress >= 50
                  ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                  : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                }
              `}>
                {progress.totalProgress >= 50 ? "ON TRACK" : "IN PROGRESS"}
              </div>
            </div>

            {/* Big Number */}
            <div className="mt-4 mb-6">
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {progress.totalProgress}%
                </span>
                <span className="text-green-500 text-sm font-medium flex items-center gap-1">
                  <TrendingUp size={14} />
                  Overall Progress
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[280px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#4ade80" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#2d3548" : "#e5e7eb"}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? "#6b7280" : "#9ca3af", fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? "#6b7280" : "#9ca3af", fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={`
                          rounded-xl p-3 shadow-xl border
                          ${isDark
                            ? 'bg-[#242938] border-[#3d4555]'
                            : 'bg-white border-gray-200'
                          }
                        `}>
                          <p className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {label}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              Progress: {payload[0].value}%
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="progress"
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  fill="url(#progressGradient)"
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: "#22c55e",
                    stroke: isDark ? "#1a1f2e" : "white",
                    strokeWidth: 3,
                  }}
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Row */}
          <div className={`grid grid-cols-3 gap-px ${isDark ? 'bg-[#2d3548]' : 'bg-gray-200'} mt-6`}>
            <div className={`${isDark ? 'bg-[#1a1f2e]' : 'bg-white'} p-4 text-center`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <BookOpen size={14} className="text-blue-500" />
                <span className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Chapters Read
                </span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {completedChapters}
                <span className={`text-lg ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/{totalChapters}</span>
              </p>
            </div>
            <div className={`${isDark ? 'bg-[#1a1f2e]' : 'bg-white'} p-4 text-center border-x ${isDark ? 'border-[#2d3548]' : 'border-gray-200'}`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle size={14} className="text-green-500" />
                <span className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Quizzes Done
                </span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {completedQuizzes}
                <span className={`text-lg ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/{totalChapters}</span>
              </p>
            </div>
            <div className={`${isDark ? 'bg-[#1a1f2e]' : 'bg-white'} p-4 text-center`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy size={14} className="text-amber-500" />
                <span className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Avg Quiz Score
                </span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {avgQuiz}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
