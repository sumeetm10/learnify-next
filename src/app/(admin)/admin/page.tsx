"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  Trophy,
  MessageSquare,
  Activity,
  UserPlus,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import { CountUp } from "@/components/admin/CountUp";
import { InitialsAvatar } from "@/components/admin/InitialsAvatar";
import type { AnalyticsData } from "@/types";

const ITEMS_PER_PAGE = 5;

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const [registrationsPage, setRegistrationsPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const isDark = theme === "dark";

  // Pagination calculations
  const registrationsPagination = useMemo(() => {
    if (!data) return { totalPages: 1, currentItems: [] };
    const totalPages = Math.ceil(data.recentUsers.length / ITEMS_PER_PAGE);
    const startIndex = (registrationsPage - 1) * ITEMS_PER_PAGE;
    const currentItems = data.recentUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    return { totalPages, currentItems };
  }, [data, registrationsPage]);

  const activityPagination = useMemo(() => {
    if (!data) return { totalPages: 1, currentItems: [] };
    const totalPages = Math.ceil(data.recentActivity.length / ITEMS_PER_PAGE);
    const startIndex = (activityPage - 1) * ITEMS_PER_PAGE;
    const currentItems = data.recentActivity.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    return { totalPages, currentItems };
  }, [data, activityPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-500">Failed to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stat Cards — bento layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Users — tall feature card with sparkline */}
        <Card
          className="dash-reveal lg:row-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 overflow-hidden transition-shadow duration-300 hover:shadow-lg hover:shadow-black/30"
          style={{ animationDelay: "0ms" }}
        >
          <CardContent className="px-3 py-2.5 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
              <span className="bg-blue-50 dark:bg-blue-950 p-1.5 rounded-md">
                <Users size={25} className="text-blue-600 dark:text-blue-400" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white tabular-nums leading-none">
                <CountUp value={data.totalUsers} />
              </span>
              <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={14} />
                +12%
              </span>
            </div>

            <div className="my-auto">
              <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.registrationChart} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usersSpark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" hide />
                    <YAxis hide domain={[0, "dataMax"]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#111827" : "white",
                        border: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      fill="url(#usersSpark)"
                      dot={false}
                      activeDot={{ r: 3, stroke: "#3b82f6", strokeWidth: 2, fill: "white" }}
                      name="New Users"
                      isAnimationActive
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>7 days ago</span>
                <span>today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Subjects */}
        <MiniStat
          title="Total Subjects"
          value={data.totalSubjects}
          subtitle={`${data.totalChapters} chapters`}
          icon={BookOpen}
          accent="emerald"
          delay={80}
        />

        {/* Unread Messages */}
        <MiniStat
          title="Unread Messages"
          value={data.unreadMessages}
          icon={MessageSquare}
          accent="rose"
          delay={160}
        />

        {/* Avg Quiz Score — wide card with segmented bar */}
        <Card
          className="dark:bg-slate-900 dash-reveal lg:col-span-2 border border-gray-200 dark:border-gray-800 transition-shadow duration-300 hover:shadow-md hover:shadow-gray-200/60 dark:hover:shadow-black/20"
          style={{ animationDelay: "240ms" }}
        >
          <CardContent className="px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Quiz Score</p>
              <span className="bg-amber-50 dark:bg-amber-950 p-1.5 rounded-md">
                <Trophy size={14} className="text-amber-600 dark:text-amber-400" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white tabular-nums leading-none">
                <CountUp value={data.averageQuizScore} suffix="%" />
              </span>
              <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={14} />
                +5%
              </span>
            </div>
            <SegmentedBar value={data.averageQuizScore} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Equal Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registrations Chart */}
        <Card className="dash-reveal bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800" style={{ animationDelay: "320ms" }}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  User Registrations
                </CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  Last 7 days
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ArrowUpRight size={14} />
                <span className="text-xs font-medium">+12%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.registrationChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#f3f4f6'} vertical={false} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#6b7280' : '#9ca3af', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#6b7280' : '#9ca3af', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#111827' : 'white',
                      border: isDark ? '1px solid #1f2937' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    fill="url(#regGradient)"
                    dot={false}
                    activeDot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                    name="New Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Chart */}
        <Card className="dash-reveal bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800" style={{ animationDelay: "380ms" }}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  Student Activity
                </CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  Last 7 days
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ArrowUpRight size={14} />
                <span className="text-xs font-medium">+8%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.activityChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#f3f4f6'} vertical={false} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#6b7280' : '#9ca3af', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#6b7280' : '#9ca3af', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#111827' : 'white',
                      border: isDark ? '1px solid #1f2937' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    fill="url(#actGradient)"
                    dot={false}
                    activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
                    name="Activity"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Row - Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <Card className="dark:bg-slate-900 dash-reveal border border-gray-200 dark:border-gray-800" style={{ animationDelay: "440ms" }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                Recent Registrations
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5">
                {data.recentUsers.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.recentUsers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No users yet</p>
            ) : (
              <>
                <div className="space-y-1">
                  {registrationsPagination.currentItems.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <InitialsAvatar name={user.name} email={user.email} size={36} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.name || "Unnamed"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`ml-3 text-[10px] font-medium px-2 py-0.5 ${
                          user.role === "ADMIN"
                            ? "border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:bg-purple-950"
                            : user.role === "TEACHER"
                            ? "border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950"
                            : "border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-950"
                        }`}
                      >
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {registrationsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[11px] text-gray-400">
                      {registrationsPage} / {registrationsPagination.totalPages}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setRegistrationsPage((p) => Math.max(1, p - 1))}
                        disabled={registrationsPage === 1}
                      >
                        <ChevronLeft size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setRegistrationsPage((p) => Math.min(registrationsPagination.totalPages, p + 1))}
                        disabled={registrationsPage === registrationsPagination.totalPages}
                      >
                        <ChevronRight size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="dark:bg-slate-900 dash-reveal border border-gray-200 dark:border-gray-800" style={{ animationDelay: "500ms" }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                Recent Activity
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5">
                {data.recentActivity.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No activity yet</p>
            ) : (
              <>
                <div className="space-y-1">
                  {activityPagination.currentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="relative shrink-0">
                        <InitialsAvatar name={item.user.name} email={item.user.email} size={36} />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                            item.quizCompleted ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {item.user.name || item.user.email}
                          </span>{" "}
                          {item.quizCompleted ? (
                            <>
                              completed quiz in{" "}
                              <span className="font-medium text-gray-900 dark:text-white">{item.chapter.title}</span>
                              <span className="text-amber-600 dark:text-amber-400 ml-1">({item.quizScore}%)</span>
                            </>
                          ) : (
                            <>
                              visited{" "}
                              <span className="font-medium text-gray-900 dark:text-white">{item.chapter.title}</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {item.chapter.subject.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {activityPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[11px] text-gray-400">
                      {activityPage} / {activityPagination.totalPages}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                        disabled={activityPage === 1}
                      >
                        <ChevronLeft size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setActivityPage((p) => Math.min(activityPagination.totalPages, p + 1))}
                        disabled={activityPage === activityPagination.totalPages}
                      >
                        <ChevronRight size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const ACCENTS = {
  blue: { icon: "text-blue-400", bg: "bg-blue-500/20" },
  emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/20" },
  amber: { icon: "text-amber-400", bg: "bg-amber-500/20" },
  rose: { icon: "text-rose-400", bg: "bg-rose-500/20" },
} as const;

// Compact stat card with an animated count-up value.
function MiniStat({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  delay = 0,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: keyof typeof ACCENTS;
  delay?: number;
}) {
  const c = ACCENTS[accent];
  return (
    <Card
      className="dash-reveal bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 transition-shadow duration-300 hover:shadow-lg hover:shadow-black/30"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="px-3 py-2.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <span className={`${c.bg} p-1.5 rounded-md`}>
            <Icon size={14} className={c.icon} />
          </span>
        </div>
        <div className="mt-1">
          <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums leading-none">
            <CountUp value={value} />
          </p>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// 5-segment progress bar; filled segments animate in with a stagger.
function SegmentedBar({ value }: { value: number }) {
  const total = 5;
  const filled = Math.round(value / (100 / total));
  return (
    <div className="flex gap-1.5 mt-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-2 flex-1 rounded-full ${
            i < filled ? "seg-grow bg-amber-500" : "bg-gray-200 dark:bg-slate-700"
          }`}
          style={i < filled ? { animationDelay: `${300 + i * 90}ms` } : undefined}
        />
      ))}
    </div>
  );
}
