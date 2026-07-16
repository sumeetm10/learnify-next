"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import type { CourseData } from "@/types";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [adminScaled, setAdminScaled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => setCourses(data.courses || []))
      .catch(() => {});
  }, []);

  // On admin routes, start at full size then scale down next frame so the
  // shrink animates (transition-all) instead of appearing pre-scaled.
  const isAdminRoute = pathname.startsWith("/admin");
  useEffect(() => {
    if (!isAdminRoute) return;
    const id = requestAnimationFrame(() => setAdminScaled(true));
    return () => cancelAnimationFrame(id);
  }, [isAdminRoute]);

  const userRole = session?.user ? (session.user as unknown as { role?: string }).role : null;
  const userCourseId = session?.user ? (session.user as unknown as { courseId?: string | null }).courseId : null;
  const isAdmin = userRole === "ADMIN";
  const isTeacher = userRole === "TEACHER";

  // Course selector is only for logged-in users: a student sees only their own
  // course, teachers/admins see all, and logged-out visitors see none.
  const visibleCourses = !session
    ? []
    : userRole === "STUDENT"
      ? userCourseId
        ? courses.filter((c) => c.id === userCourseId)
        : []
      : courses;

  const navLinks = [
    { href: "/about", label: "About" },
    { href: "/progress", label: "Progress" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className={`fixed top-4 z-50 w-[90%] max-w-5xl transition-all duration-500 ease-in-out ${
      isAdminRoute
        ? `left-1/2 md:left-[calc(50%_+_8rem)] -translate-x-1/2 ${adminScaled ? "scale-[0.92]" : "scale-100"}`
        : "left-1/2 -translate-x-1/2"
    }`}>
      <nav className="bg-[#427da6]/85 dark:bg-[#1a3550]/90 backdrop-blur-xl border border-white/15 shadow-lg shadow-[#1a3550]/20 flex items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 ease-in-out">
        <Link href="/" className="font-bold tracking-wide text-white text-xl">
          Learnify
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          {visibleCourses.length > 0 && (
            <select
              className="bg-white/20 text-white border-none rounded-full px-3 py-1.5 text-sm cursor-pointer outline-none [&>option]:text-black"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) router.push(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="" disabled>Select Course</option>
              {visibleCourses.map((course) => (
                <option key={course.id} value={`/course/${course.slug}`}>
                  {course.icon} {course.name}
                </option>
              ))}
            </select>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-white/90 hover:text-white text-sm font-medium transition-colors ${
                pathname === link.href ? "text-white underline underline-offset-4" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}

          <ThemeToggle />

          {/* Auth Buttons */}
          {!session ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 font-medium rounded-full transition-colors text-sm px-3 py-1.5"
              >
                <LogIn size={14} />
                Login
              </Link>
            </div>
          ) : isAdmin ? (
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <LayoutDashboard size={14} />
                Admin Panel
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1.5 bg-red-500/80 hover:bg-red-500 text-white font-medium rounded-full transition-all duration-500 cursor-pointer text-sm px-3 py-1.5"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : isTeacher ? (
            <div className="flex items-center gap-2">
              <Link
                href="/teacher"
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1.5 bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/student"
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1.5 bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden mt-2 bg-[#427da6]/95 dark:bg-[#1a3550]/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg space-y-3">
          {visibleCourses.length > 0 && (
            <select
              className="w-full bg-white/20 text-white border-none rounded-full px-3 py-2 text-sm cursor-pointer outline-none [&>option]:text-black"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  router.push(e.target.value);
                  setMobileOpen(false);
                }
                e.target.value = "";
              }}
            >
              <option value="" disabled>Select Course</option>
              {visibleCourses.map((course) => (
                <option key={course.id} value={`/course/${course.slug}`}>
                  {course.icon} {course.name}
                </option>
              ))}
            </select>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-white/90 hover:text-white text-sm font-medium py-1"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <ThemeToggle />
            <span className="text-white/70 text-xs">Toggle Theme</span>
          </div>

          {/* Auth Buttons (Mobile) */}
          {!session ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/20">
              <Link
                href="/login"
                className="flex items-center gap-2 text-white text-sm font-medium py-1"
                onClick={() => setMobileOpen(false)}
              >
                <LogIn size={14} />
                Login
              </Link>
            </div>
          ) : isAdmin ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/20">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-white text-sm font-medium py-1"
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard size={14} />
                Admin Panel
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="flex items-center gap-2 text-red-300 hover:text-red-200 text-sm font-medium py-1 cursor-pointer"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : isTeacher ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/20">
              <Link
                href="/teacher"
                className="flex items-center gap-2 text-white text-sm font-medium py-1"
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard size={14} />
                Teacher Dashboard
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="flex items-center gap-2 text-red-300 hover:text-red-200 text-sm font-medium py-1 cursor-pointer"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/20">
              <Link
                href="/student"
                className="flex items-center gap-2 text-white text-sm font-medium py-1"
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="flex items-center gap-2 text-red-300 hover:text-red-200 text-sm font-medium py-1 cursor-pointer"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
