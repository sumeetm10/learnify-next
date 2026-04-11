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
} from "lucide-react";
import { toast } from "sonner";
import type { UserData, UserRole } from "@/types";

// Badge color map for roles
const roleBadgeStyles: Record<UserRole, string> = {
  STUDENT: "border-blue-300 text-blue-700 bg-blue-50",
  TEACHER: "border-green-300 text-green-700 bg-green-50",
  ADMIN: "border-purple-300 text-purple-700 bg-purple-50",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Ref for debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    } catch {
      toast.error("Failed to update user");
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield size={18} className="text-[#427da6]" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
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
              <SelectTrigger className="w-full sm:w-[160px]">
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
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-500">No users found.</p>
            </div>
          ) : (
            <>
              {/* Users Table */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        {/* User info: name + email */}
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {user.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </TableCell>

                        {/* Role Badge */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={roleBadgeStyles[user.role]}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.isActive
                                ? "border-green-300 text-green-700 bg-green-50"
                                : "border-red-300 text-red-700 bg-red-50"
                            }
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>

                        {/* Joined Date */}
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </TableCell>

                        {/* Actions Dropdown */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  updateUser(user.id, { role: "STUDENT" })
                                }
                                disabled={user.role === "STUDENT"}
                              >
                                <GraduationCap size={14} className="mr-2" />
                                Make Student
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateUser(user.id, { role: "TEACHER" })
                                }
                                disabled={user.role === "TEACHER"}
                              >
                                <BookOpenIcon size={14} className="mr-2" />
                                Make Teacher
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateUser(user.id, { role: "ADMIN" })
                                }
                                disabled={user.role === "ADMIN"}
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
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <UserX size={14} className="mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateUser(user.id, { isActive: true })
                                  }
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <UserCheck size={14} className="mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * 20 + 1}
                  {"\u2013"}
                  {Math.min(page * 20, total)} of {total} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
