"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreHorizontal,
  Shield,
  BookOpen as BookOpenIcon,
  GraduationCap,
  UserX,
  UserCheck,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import type { UserData, UserRole } from "@/types";

// Badge color map for roles - dark mode aware
const roleBadgeStyles: Record<UserRole, string> = {
  STUDENT: "border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-950",
  TEACHER: "border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950",
  ADMIN: "border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:bg-purple-950",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { data: session } = useSession();
  const currentUserId = session?.user
    ? (session.user as unknown as { id?: string }).id
    : undefined;

  // Ref for debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch users from API
  const fetchUsers = useCallback(
    async (searchVal: string, roleVal: string, pageVal: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchVal) params.set("search", searchVal);
        if (roleVal && roleVal !== "ALL") params.set("role", roleVal);
        params.set("page", String(pageVal));

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch users");

        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial fetch and refetch on filter/page change
  useEffect(() => {
    fetchUsers(search, roleFilter, page);
  }, [roleFilter, page, fetchUsers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchUsers(value, roleFilter, 1);
    }, 300);
  };

  // Update user via PATCH
  const updateUser = async (
    userId: string,
    data: { role?: UserRole; isActive?: boolean }
  ) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...data }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update user");
        return;
      }

      const updated: UserData = await res.json();

      // Replace the user in the local list
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );

      if (data.role) {
        toast.success(`Role updated to ${data.role}`);
      } else if (typeof data.isActive === "boolean") {
        toast.success(
          data.isActive ? "User activated" : "User deactivated"
        );
      }

      // Refetch so users, total, and totalPages resync with the active search/filter
      fetchUsers(search, roleFilter, page);
    } catch {
      toast.error("Failed to update user");
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      {/* Main Card */}
      <Card
        className="dark:bg-slate-900 dash-reveal border border-gray-200 dark:border-gray-800"
        style={{ animationDelay: "100ms" }}
      >
        <CardContent className="p-4">
          {/* Stats Row */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
                <Users size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">{total}</p>
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={(val) => {
                setRoleFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="TEACHER">Teacher</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg animate-pulse"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                    <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded w-40" />
                  </div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-16" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-14" />
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded w-16" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                <Users size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">No users found</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {/* Users List - Card Style */}
              <div className="space-y-2">
                {users.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group"
                    style={{
                      animation: mounted ? `slideUp 0.3s ease-out forwards` : undefined,
                      animationDelay: `${index * 40}ms`,
                      opacity: 0,
                    }}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-white">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name || "Unnamed"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Role Badge */}
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium px-2 py-0.5 ${roleBadgeStyles[user.role]}`}
                    >
                      {user.role}
                    </Badge>

                    {/* Status Badge */}
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium px-2 py-0.5 ${
                        user.isActive
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950"
                          : "border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-950"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>

                    {/* Joined Date */}
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-20 text-right hidden sm:block">
                      {formatDate(user.createdAt)}
                    </span>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() =>
                            updateUser(user.id, { role: "STUDENT" })
                          }
                          disabled={
                            user.role === "STUDENT" ||
                            user.id === currentUserId
                          }
                          className="text-sm"
                        >
                          <GraduationCap size={14} className="mr-2" />
                          Make Student
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateUser(user.id, { role: "TEACHER" })
                          }
                          disabled={
                            user.role === "TEACHER" ||
                            user.id === currentUserId
                          }
                          className="text-sm"
                        >
                          <BookOpenIcon size={14} className="mr-2" />
                          Make Teacher
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateUser(user.id, { role: "ADMIN" })
                          }
                          disabled={user.role === "ADMIN"}
                          className="text-sm"
                        >
                          <Shield size={14} className="mr-2" />
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.isActive ? (
                          <DropdownMenuItem
                            onClick={() =>
                              updateUser(user.id, { isActive: false })
                            }
                            disabled={user.id === currentUserId}
                            className="text-sm text-red-600 focus:text-red-600"
                          >
                            <UserX size={14} className="mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              updateUser(user.id, { isActive: true })
                            }
                            className="text-sm text-emerald-600 focus:text-emerald-600"
                          >
                            <UserCheck size={14} className="mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {(page - 1) * 20 + 1}
                  {"\u2013"}
                  {Math.min(page * 20, total)} of {total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
