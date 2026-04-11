"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  Trophy,
  MessageSquare,
  HelpCircle,
  Layers,
  Activity,
  UserPlus,
} from "lucide-react";
import type { AnalyticsData } from "@/types";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Failed to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={data.totalUsers}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Subjects"
          value={data.totalSubjects}
          icon={BookOpen}
          color="bg-green-500"
          subtitle={`${data.totalChapters} chapters, ${data.totalQuestions} questions`}
        />
        <StatCard
          title="Avg Quiz Score"
          value={`${data.averageQuizScore}%`}
          icon={Trophy}
          color="bg-amber-500"
        />
        <StatCard
          title="Unread Messages"
          value={data.unreadMessages}
          icon={MessageSquare}
          color="bg-purple-500"
        />
      </div>

      {/* Two Column Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus size={18} className="text-[#427da6]" />
              Recent Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentUsers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No users yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {user.name || "Unnamed"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        user.role === "ADMIN"
                          ? "border-purple-300 text-purple-700 bg-purple-50"
                          : user.role === "TEACHER"
                          ? "border-green-300 text-green-700 bg-green-50"
                          : "border-blue-300 text-blue-700 bg-blue-50"
                      }
                    >
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity size={18} className="text-[#427da6]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <div
                      className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                        item.quizCompleted ? "bg-amber-500" : "bg-green-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          {item.user.name || item.user.email}
                        </span>{" "}
                        {item.quizCompleted ? (
                          <>
                            completed quiz in{" "}
                            <span className="font-medium">{item.chapter.title}</span>{" "}
                            <span className="text-amber-600">({item.quizScore}%)</span>
                          </>
                        ) : (
                          <>
                            visited{" "}
                            <span className="font-medium">{item.chapter.title}</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.chapter.subject.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Reusable stat card component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`${color} p-3 rounded-lg`}>
            <Icon size={22} className="text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
