"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  s, I, CSS,
  IcDashboard, IcCourses, IcQuizzes, IcAnalytics, IcAnnounce, IcProfile,
  IcBook, IcFile, IcChart, IcPlay, IcClock, IcCheck, IcTarget,
} from "@/components/dashboard/kit";
import type { ProgressData, CourseData, SubjectWithChapters } from "@/types";

/* ------------------------------------------------------------------ *
 * Student Dashboard — same design language as the teacher dashboard
 * (shared kit), wired to the student-facing APIs: progress, courses,
 * subjects and announcements.
 * ------------------------------------------------------------------ */

type Page = "dashboard" | "subjects" | "quizzes" | "progress" | "announcements" | "profile";

const PAGE_TITLES: Record<Page, [string, string]> = {
  dashboard: ["Dashboard", "Welcome back — here is your learning overview"],
  subjects: ["My Subjects", "Browse the materials for your course"],
  quizzes: ["Quizzes", "Test your knowledge, chapter by chapter"],
  progress: ["My Progress", "Track how far you've come"],
  announcements: ["Announcements", "Latest news from your teachers"],
  profile: ["Profile", "Manage your account details"],
};

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const scoreColor = (n: number) =>
  n >= 80 ? "var(--green)" : n >= 65 ? "var(--accent)" : "var(--amber)";

interface AnnItem {
  id: string;
  message: string;
  circleColor: string;
  boxColor: string;
}
interface ChProg {
  visited: boolean;
  quizCompleted: boolean;
  quizScore: number;
}

export default function StudentPage() {
  /* -------- session + theme (mirrors the rest of the site) -------- */
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const isDark = mounted && theme === "dark";
  const router = useRouter();

  const sessionUser = session?.user as
    | { name?: string | null; email?: string | null; role?: string; courseId?: string | null }
    | undefined;
  const sessionName = sessionUser?.name?.trim() || "Student";
  const sessionEmail = sessionUser?.email?.trim() || "student@learnify.edu";
  const roleLabel = sessionUser?.role
    ? sessionUser.role.charAt(0) + sessionUser.role.slice(1).toLowerCase()
    : "Student";

  const [page, setPage] = useState<Page>("dashboard");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState({ name: "", email: "" });
  const photoRef = useRef<HTMLInputElement>(null);

  /* -------- live data -------- */
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithChapters[]>([]);
  const [announcement, setAnnouncement] = useState<AnnItem | null>(null);

  useEffect(() => {
    fetch("/api/progress").then((r) => (r.ok ? r.json() : null)).then((d) => d && setProgress(d)).catch(() => {});
    fetch("/api/courses").then((r) => (r.ok ? r.json() : null)).then((d) => d?.courses && setCourses(d.courses)).catch(() => {});
    fetch("/api/subjects").then((r) => (r.ok ? r.json() : null)).then((d) => d?.subjects && setSubjects(d.subjects)).catch(() => {});
    fetch("/api/announcements").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.message) setAnnouncement(d); }).catch(() => {});
  }, []);

  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  };

  const doLogout = () => signOut({ callbackUrl: "/" });
  const pickPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setAvatarUrl(URL.createObjectURL(f));
      showToast("Profile photo updated");
    }
  };

  /* -------- identity -------- */
  const displayName = profile.name.trim() || sessionName;
  const displayEmail = profile.email.trim() || sessionEmail;
  const firstName = displayName.split(" ")[0];
  const userInitials = initials(displayName);

  /* -------- derived from live data -------- */
  const courseId = sessionUser?.courseId ?? null;
  const myCourse = courses.find((c) => c.id === courseId) || null;
  const mySemesterIds = new Set(myCourse?.semesters.map((sm) => sm.id));
  const mySubjects = subjects.filter((su) => mySemesterIds.has(su.semesterId));

  // Flatten progress into a chapterId -> status map (only engaged chapters).
  const progMap: Record<string, ChProg> = {};
  if (progress) {
    for (const c of Object.values(progress.courses))
      for (const sem of Object.values(c.semesters))
        for (const sub of Object.values(sem.subjects))
          for (const [chId, ch] of Object.entries(sub.chapters)) progMap[chId] = ch;
  }
  // chapter metadata (title, subject, semester) for the student's course
  const chapterMeta: Record<string, { subjectTitle: string; semesterId: number; chapterTitle: string }> = {};
  for (const su of mySubjects)
    for (const ch of su.chapters)
      chapterMeta[ch.id] = { subjectTitle: su.title, semesterId: su.semesterId, chapterTitle: ch.title };

  const chaptersRead = Object.values(progMap).filter((c) => c.visited).length;
  const quizzesTaken = Object.values(progMap).filter((c) => c.quizCompleted);
  const quizAvg = quizzesTaken.length
    ? Math.round(quizzesTaken.reduce((a, c) => a + c.quizScore, 0) / quizzesTaken.length)
    : 0;
  const overall = progress?.totalProgress ?? 0;
  const totalChapters = mySubjects.reduce((a, su) => a + su.chapters.length, 0);

  const semesterLink = (semesterId: number) =>
    myCourse ? `/course/${myCourse.slug}/semester/${semesterId}` : "/select-course";
  const go = (href: string) => router.push(href);

  // "Continue learning" — the last chapter the student opened
  const lastId = progress?.lastVisited?.chapterId;
  const lastCh = lastId ? chapterMeta[lastId] : undefined;

  // subject progress (%) from the progress payload, keyed by subject id
  const subjectPct: Record<string, number> = {};
  if (progress)
    for (const c of Object.values(progress.courses))
      for (const sem of Object.values(c.semesters))
        for (const [subId, sub] of Object.entries(sem.subjects)) subjectPct[subId] = sub.progress;

  const searchLC = search.trim().toLowerCase();
  const filteredSubjects = searchLC
    ? mySubjects.filter((su) => su.title.toLowerCase().includes(searchLC))
    : mySubjects;

  // group subjects by semester (name from the course)
  const semName: Record<number, string> = {};
  myCourse?.semesters.forEach((sm) => (semName[sm.id] = sm.name));
  const subjectsBySemester = Array.from(
    filteredSubjects.reduce((map, su) => {
      const arr = map.get(su.semesterId) ?? [];
      arr.push(su);
      map.set(su.semesterId, arr);
      return map;
    }, new Map<number, SubjectWithChapters[]>()),
  ).sort((a, b) => a[0] - b[0]);

  const [pageTitle, basePageSub] = PAGE_TITLES[page];
  const pageSub = page === "dashboard" ? `Welcome back, ${firstName} — here is your learning overview` : basePageSub;

  const navFor = (p: Page) => ({
    bg: page === p ? "var(--accent-soft)" : "transparent",
    col: page === p ? "var(--text)" : "var(--muted)",
  });

  const donutOffset = 364.4 * (1 - overall / 100);

  const quizResults = Object.entries(progMap)
    .filter(([, c]) => c.quizCompleted)
    .map(([id, c]) => ({ id, meta: chapterMeta[id], score: c.quizScore }))
    .filter((x) => x.meta);

  return (
    <div className="tdscope" style={s("position:fixed;inset:0;padding-top:80px;display:flex;overflow:hidden;font-family:Manrope,sans-serif;background:var(--bg)")}>
      <style>{CSS}</style>

      {sidebarOpen && (
        <div className="td-overlay" onClick={() => setSidebarOpen(false)} style={s("position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:75")} />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className={sidebarOpen ? "td-side open" : "td-side"} style={s("width:256px;flex:none;background:var(--sidebar);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:20px 16px")}>
        <div style={s("display:flex;align-items:center;gap:11px;padding:6px 8px 20px")}>
          <div style={s("width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,var(--accent),#3f6fac);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(79,134,198,.35)")}>
            <I w={21} sw={2.2} stroke="#fff">
              <path d="M2 7l10-4 10 4-10 4z" />
              <path d="M6 10v5c0 1 2.5 2.5 6 2.5s6-1.5 6-2.5v-5" />
              <path d="M22 7v5" />
            </I>
          </div>
          <div>
            <div style={s("font:800 19px Poppins;letter-spacing:-.3px;line-height:1")}>Learnify</div>
            <div style={s("font:600 10.5px Manrope;color:var(--faint);letter-spacing:.6px;margin-top:3px")}>STUDENT PORTAL</div>
          </div>
        </div>

        <div style={s("font:700 10.5px Manrope;color:var(--faint);letter-spacing:1px;padding:6px 10px 8px")}>MENU</div>
        <nav style={s("display:flex;flex-direction:column;gap:3px")}>
          {([
            ["dashboard", "Dashboard", IcDashboard],
            ["subjects", "My Subjects", IcCourses],
            ["quizzes", "Quizzes", IcQuizzes],
            ["progress", "My Progress", IcAnalytics],
            ["announcements", "Announcements", IcAnnounce],
          ] as [Page, string, ReactNode][]).map(([key, label, icon]) => {
            const n = navFor(key);
            return (
              <button
                key={key}
                onClick={() => { setPage(key); setSidebarOpen(false); }}
                style={s(`display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border:none;border-radius:11px;cursor:pointer;font:600 14px Manrope;text-align:left;transition:background .15s;background:${n.bg};color:${n.col}`)}
              >
                {icon}
                {label}
              </button>
            );
          })}
        </nav>

        <div style={s("flex:1")} />

        <div style={s("font:700 10.5px Manrope;color:var(--faint);letter-spacing:1px;padding:6px 10px 8px")}>ACCOUNT</div>
        {(() => {
          const n = navFor("profile");
          return (
            <button
              onClick={() => { setPage("profile"); setSidebarOpen(false); }}
              style={s(`display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border:none;border-radius:11px;cursor:pointer;font:600 14px Manrope;text-align:left;transition:background .15s;background:${n.bg};color:${n.col}`)}
            >
              {IcProfile}
              Profile
            </button>
          );
        })()}

        <button
          onClick={() => { setPage("profile"); setSidebarOpen(false); }}
          style={s("margin-top:12px;display:flex;align-items:center;gap:11px;padding:11px;border-radius:13px;background:var(--card);border:1px solid var(--border);cursor:pointer;text-align:left;width:100%")}
        >
          <div style={s("width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#5f97d8,#3f6fac);display:flex;align-items:center;justify-content:center;font:700 13px Poppins;color:#fff;flex:none;overflow:hidden")}>
            {avatarUrl ? <img src={avatarUrl} alt="" style={s("width:100%;height:100%;object-fit:cover")} /> : userInitials}
          </div>
          <div style={s("min-width:0")}>
            <div style={s("font:600 13px Manrope;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{displayName}</div>
            <div style={s("font:500 11px Manrope;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{roleLabel}{myCourse ? ` · ${myCourse.name}` : ""}</div>
          </div>
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <div style={s("flex:1;display:flex;flex-direction:column;min-width:0;background:var(--bg)")}>
        {/* TOPBAR */}
        <header className="td-top" style={s("position:relative;z-index:30;flex:none;height:70px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:16px;padding:0 28px;background:var(--topbar);backdrop-filter:blur(8px)")}>
          <button className="td-burger h-bell" onClick={() => setSidebarOpen((o) => !o)} aria-label="Menu" style={s("display:none;width:40px;height:40px;flex:none;border-radius:11px;background:var(--card);border:1px solid var(--border);cursor:pointer;align-items:center;justify-content:center;color:var(--muted)")}>
            <I w={20} sw={2}><path d="M3 6h18M3 12h18M3 18h18" /></I>
          </button>
          <div style={s("min-width:0")}>
            <div className="td-title" style={s("font:700 19px Poppins;letter-spacing:-.3px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{pageTitle}</div>
            <div className="td-sub" style={s("font:500 12px Manrope;color:var(--faint);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{pageSub}</div>
          </div>
          <div style={s("flex:1")} />
          <div className="h-search" style={s("display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--border);border-radius:11px;padding:9px 13px;width:220px")}>
            <I w={16} sw={2} stroke="var(--faint)">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </I>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects…"
              style={s("border:none;background:transparent;color:var(--text);font:500 13px Manrope;outline:none;width:100%")}
            />
          </div>

          {/* theme toggle */}
          <button
            className="h-bell"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
            style={s("width:42px;height:42px;border-radius:11px;background:var(--card);border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--muted)")}
          >
            {isDark ? (
              <I w={18} sw={2}>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
              </I>
            ) : (
              <I w={18} sw={2}>
                <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
              </I>
            )}
          </button>

          {/* notifications */}
          <div style={s("position:relative")}>
            <button
              className="h-bell"
              onClick={() => { setBellOpen((o) => !o); setMenuOpen(false); setUnread(false); }}
              aria-label="Notifications"
              style={s("position:relative;width:42px;height:42px;border-radius:11px;background:var(--card);border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--muted)")}
            >
              <I w={19}>
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </I>
              {unread && announcement && <span style={s("position:absolute;top:9px;right:10px;width:7px;height:7px;border-radius:50%;background:var(--accent);border:2px solid var(--card)")} />}
            </button>
            {bellOpen && (
              <>
                <div onClick={() => setBellOpen(false)} style={s("position:fixed;inset:0;z-index:40")} />
                <div style={s("position:absolute;right:0;top:52px;width:320px;background:var(--card2);border:1px solid var(--border2);border-radius:14px;box-shadow:0 18px 46px rgba(0,0,0,.28);z-index:41;overflow:hidden;animation:popIn .18s ease")}>
                  <div style={s("padding:14px 16px;border-bottom:1px solid var(--border);font:700 14px Poppins")}>Notifications</div>
                  <div style={s("padding:6px")}>
                    {announcement ? (
                      <div style={s("display:flex;gap:11px;padding:12px 12px")}>
                        <div style={s("width:32px;height:32px;border-radius:9px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;flex:none")}><I w={17}><path d="M3 11l14-6v14L3 13z" /></I></div>
                        <div style={s("min-width:0")}><div style={s("font:600 13px Manrope")}>Announcement</div><div style={s("font:500 12px Manrope;color:var(--muted);margin-top:2px")}>{announcement.message}</div></div>
                      </div>
                    ) : (
                      <div style={s("padding:20px 12px;text-align:center;font:500 13px Manrope;color:var(--faint)")}>You&apos;re all caught up.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* avatar + account menu */}
          <div style={s("position:relative")}>
            <button
              onClick={() => { setMenuOpen((o) => !o); setBellOpen(false); }}
              aria-label="Account menu"
              style={s("width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#5f97d8,#3f6fac);display:flex;align-items:center;justify-content:center;font:700 14px Poppins;color:#fff;cursor:pointer;border:none;overflow:hidden;padding:0")}
            >
              {avatarUrl ? <img src={avatarUrl} alt="" style={s("width:100%;height:100%;object-fit:cover")} /> : userInitials}
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={s("position:fixed;inset:0;z-index:40")} />
                <div style={s("position:absolute;right:0;top:52px;width:262px;background:var(--card2);border:1px solid var(--border2);border-radius:14px;box-shadow:0 18px 46px rgba(0,0,0,.28);z-index:41;overflow:hidden;animation:popIn .18s ease")}>
                  <div style={s("display:flex;align-items:center;gap:12px;padding:16px;border-bottom:1px solid var(--border)")}>
                    <div style={s("width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#5f97d8,#3f6fac);display:flex;align-items:center;justify-content:center;font:700 15px Poppins;color:#fff;flex:none;overflow:hidden")}>
                      {avatarUrl ? <img src={avatarUrl} alt="" style={s("width:100%;height:100%;object-fit:cover")} /> : userInitials}
                    </div>
                    <div style={s("min-width:0")}>
                      <div style={s("font:700 14px Poppins;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{displayName}</div>
                      <div style={s("font:500 12px Manrope;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{displayEmail}</div>
                    </div>
                  </div>
                  <div style={s("padding:5px")}>
                    <div style={s("padding:7px 12px 4px;font:600 11px Manrope;color:var(--faint)")}>Signed in as {roleLabel}</div>
                    <button className="h-qa" onClick={() => { setPage("profile"); setMenuOpen(false); }} style={s("display:flex;align-items:center;gap:11px;width:100%;padding:10px 12px;border:none;border-radius:9px;cursor:pointer;font:600 13px Manrope;text-align:left;background:transparent;color:var(--text)")}>
                      {IcProfile} View profile
                    </button>
                    <button className="h-qa" onClick={() => { setPage("progress"); setMenuOpen(false); }} style={s("display:flex;align-items:center;gap:11px;width:100%;padding:10px 12px;border:none;border-radius:9px;cursor:pointer;font:600 13px Manrope;text-align:left;background:transparent;color:var(--text)")}>
                      {IcChart} My progress
                    </button>
                    <button className="h-del" onClick={doLogout} style={s("display:flex;align-items:center;gap:11px;width:100%;padding:10px 12px;border:1px solid transparent;border-radius:9px;cursor:pointer;font:600 13px Manrope;text-align:left;background:transparent;color:var(--red)")}>
                      <I w={17} sw={2}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></I>
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* SCROLL CONTENT */}
        <main className="td-main" style={s("flex:1;overflow-y:auto;padding:28px")}>
          {/* ============ DASHBOARD ============ */}
          {page === "dashboard" && (
            <div style={s("animation:fadeIn .25s ease;max-width:1200px")}>
              {!myCourse && (
                <div style={s("background:var(--amber-soft);border:1px solid var(--border2);border-radius:14px;padding:16px 18px;margin-bottom:18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap")}>
                  <div style={s("font:600 13.5px Manrope;color:var(--text);flex:1;min-width:0")}>You haven&apos;t picked a course yet. Choose one to unlock your subjects and progress.</div>
                  <button className="h-primary" onClick={() => go("/select-course")} style={s("background:var(--accent);color:#fff;border:none;border-radius:10px;padding:9px 15px;font:600 13px Manrope;cursor:pointer")}>Select course</button>
                </div>
              )}

              <div className="td-g4" style={s("display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:22px")}>
                {[
                  { icon: IcCourses, iconBg: "#3b82f6", value: myCourse?.name ?? "—", label: "Your course" },
                  { icon: IcTarget(20), iconBg: "#22c55e", value: overall + "%", label: "Overall progress" },
                  { icon: IcBook, iconBg: "#f59e0b", value: String(chaptersRead), label: `Chapters read${totalChapters ? ` of ${totalChapters}` : ""}` },
                  { icon: IcChart, iconBg: "#a855f7", value: quizzesTaken.length ? quizAvg + "%" : "—", label: "Quiz average" },
                ].map((st, i) => (
                  <div key={i} className="h-stat" style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px")}>
                    <div style={s("display:flex;justify-content:space-between;align-items:flex-start")}>
                      <div style={s(`width:40px;height:40px;border-radius:11px;background:${st.iconBg};display:flex;align-items:center;justify-content:center;color:#fff`)}>{st.icon}</div>
                    </div>
                    <div style={s("font:800 26px Poppins;margin-top:14px;letter-spacing:-.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{st.value}</div>
                    <div style={s("font:500 13px Manrope;color:var(--muted);margin-top:2px")}>{st.label}</div>
                  </div>
                ))}
              </div>

              <div className="td-gmain" style={s("display:grid;grid-template-columns:1.7fr 1fr;gap:18px;align-items:start")}>
                {/* continue learning + subjects */}
                <div style={s("display:flex;flex-direction:column;gap:18px")}>
                  <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px")}>
                    <div style={s("font:700 16px Poppins;margin-bottom:14px")}>Continue learning</div>
                    {lastCh ? (
                      <div style={s("display:flex;align-items:center;gap:14px;flex-wrap:wrap")}>
                        <div style={s("width:46px;height:46px;border-radius:12px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;flex:none")}>{IcBook}</div>
                        <div style={s("flex:1;min-width:0")}>
                          <div style={s("font:600 15px Manrope;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{lastCh.chapterTitle}</div>
                          <div style={s("font:500 12.5px Manrope;color:var(--faint);margin-top:2px")}>{lastCh.subjectTitle}</div>
                        </div>
                        <button className="h-primary" onClick={() => go(semesterLink(lastCh.semesterId))} style={s("display:flex;align-items:center;gap:7px;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:9px 15px;font:600 13px Manrope;cursor:pointer")}>
                          {IcPlay()} Resume
                        </button>
                      </div>
                    ) : (
                      <div style={s("display:flex;align-items:center;gap:14px;flex-wrap:wrap")}>
                        <div style={s("font:500 13.5px Manrope;color:var(--muted);flex:1;min-width:0")}>You haven&apos;t opened any chapter yet. Jump into your subjects to get started.</div>
                        <button className="h-primary" onClick={() => setPage("subjects")} style={s("background:var(--accent);color:#fff;border:none;border-radius:10px;padding:9px 15px;font:600 13px Manrope;cursor:pointer")}>Browse subjects</button>
                      </div>
                    )}
                  </div>

                  <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px")}>
                    <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:14px")}>
                      <div style={s("font:700 16px Poppins")}>Your subjects</div>
                      <button className="h-accent" onClick={() => setPage("subjects")} style={s("border:1px solid var(--border);background:var(--bg2);color:var(--muted);border-radius:9px;padding:7px 12px;font:600 12px Manrope;cursor:pointer")}>View all</button>
                    </div>
                    <div style={s("display:flex;flex-direction:column;gap:4px")}>
                      {mySubjects.slice(0, 5).map((su) => {
                        const pct = subjectPct[su.id] ?? 0;
                        return (
                          <div key={su.id} className="h-row" onClick={() => go(semesterLink(su.semesterId))} style={s("display:flex;align-items:center;gap:14px;padding:11px 10px;border-radius:11px;cursor:pointer")}>
                            <div style={s("width:38px;height:38px;border-radius:10px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent);flex:none")}>{IcBook}</div>
                            <div style={s("min-width:0;flex:1")}>
                              <div style={s("font:600 14px Manrope;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{su.title}</div>
                              <div style={s("font:500 12px Manrope;color:var(--faint);margin-top:2px")}>{su.chapters.length} chapters</div>
                            </div>
                            <div style={s("width:90px;flex:none;display:flex;align-items:center;gap:8px")}>
                              <div style={s("flex:1;height:6px;border-radius:4px;background:var(--bg2);overflow:hidden")}><div style={s(`height:100%;width:${pct}%;background:var(--accent);border-radius:4px`)} /></div>
                              <span style={s("font:600 11px Manrope;color:var(--muted);width:30px;text-align:right")}>{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                      {mySubjects.length === 0 && (
                        <div style={s("padding:26px 10px;text-align:center;font:500 13px Manrope;color:var(--faint)")}>{myCourse ? "No subjects published for your course yet." : "Select a course to see your subjects."}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* donut + quick actions */}
                <div style={s("display:flex;flex-direction:column;gap:18px")}>
                  <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px")}>
                    <div style={s("font:700 16px Poppins;margin-bottom:6px")}>Overall progress</div>
                    <div style={s("font:500 12px Manrope;color:var(--faint);margin-bottom:8px")}>Across everything you&apos;ve studied</div>
                    <div style={s("display:flex;align-items:center;justify-content:center;position:relative;height:150px")}>
                      <svg width="150" height="150" viewBox="0 0 150 150">
                        <circle cx="75" cy="75" r="58" fill="none" stroke="rgba(148,163,184,.14)" strokeWidth="14" />
                        <circle cx="75" cy="75" r="58" fill="none" stroke="var(--accent)" strokeWidth="14" strokeLinecap="round" strokeDasharray="364.4" strokeDashoffset={donutOffset} transform="rotate(-90 75 75)" />
                      </svg>
                      <div style={s("position:absolute;text-align:center")}>
                        <div style={s("font:800 30px Poppins;letter-spacing:-.5px")}>{overall}%</div>
                        <div style={s("font:500 11px Manrope;color:var(--faint)")}>completed</div>
                      </div>
                    </div>
                    <div style={s("display:flex;justify-content:space-around;margin-top:10px")}>
                      <div style={s("text-align:center")}><div style={s("font:700 18px Poppins;color:var(--green)")}>{chaptersRead}</div><div style={s("font:500 11px Manrope;color:var(--faint)")}>Read</div></div>
                      <div style={s("text-align:center")}><div style={s("font:700 18px Poppins;color:var(--accent)")}>{quizzesTaken.length}</div><div style={s("font:500 11px Manrope;color:var(--faint)")}>Quizzes</div></div>
                      <div style={s("text-align:center")}><div style={s("font:700 18px Poppins;color:var(--amber)")}>{totalChapters}</div><div style={s("font:500 11px Manrope;color:var(--faint)")}>Chapters</div></div>
                    </div>
                  </div>
                  <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px")}>
                    <div style={s("font:700 16px Poppins;margin-bottom:14px")}>Quick actions</div>
                    <div style={s("display:flex;flex-direction:column;gap:9px")}>
                      <button className="h-qa" onClick={() => setPage("subjects")} style={s("display:flex;align-items:center;gap:11px;width:100%;padding:12px 13px;border-radius:11px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font:600 13px Manrope;cursor:pointer;text-align:left")}>
                        <span style={s("color:var(--accent)")}>{IcBook}</span> Browse my subjects
                      </button>
                      <button className="h-qa" onClick={() => setPage("quizzes")} style={s("display:flex;align-items:center;gap:11px;width:100%;padding:12px 13px;border-radius:11px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font:600 13px Manrope;cursor:pointer;text-align:left")}>
                        <span style={s("color:var(--accent)")}>{IcQuizzes}</span> Take a quiz
                      </button>
                      <button className="h-qa" onClick={() => setPage("progress")} style={s("display:flex;align-items:center;gap:11px;width:100%;padding:12px 13px;border-radius:11px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font:600 13px Manrope;cursor:pointer;text-align:left")}>
                        <span style={s("color:var(--accent)")}>{IcChart}</span> View my progress
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* recent quiz results */}
              <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px;margin-top:18px")}>
                <div style={s("font:700 16px Poppins;margin-bottom:14px")}>Recent quiz results</div>
                {quizResults.length === 0 ? (
                  <div style={s("padding:24px 10px;text-align:center;font:500 13px Manrope;color:var(--faint)")}>Take a quiz and your scores will appear here.</div>
                ) : (
                  <div style={s("display:flex;flex-direction:column;gap:2px")}>
                    {quizResults.slice(0, 6).map((q) => (
                      <div key={q.id} style={s("display:flex;align-items:center;gap:14px;padding:10px 8px;border-bottom:1px solid var(--border)")}>
                        <div style={s("width:34px;height:34px;border-radius:9px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;flex:none")}>{IcQuizzes}</div>
                        <div style={s("flex:1;min-width:0")}><span style={s("font:600 14px Manrope")}>{q.meta.chapterTitle}</span> <span style={s("font:500 13px Manrope;color:var(--muted)")}>· {q.meta.subjectTitle}</span></div>
                        <span style={s(`font:700 13px Manrope;color:${scoreColor(q.score)};flex:none`)}>{q.score}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============ SUBJECTS ============ */}
          {page === "subjects" && (
            <div style={s("animation:fadeIn .25s ease;max-width:1200px")}>
              {!myCourse ? (
                <EmptyCourse onSelect={() => go("/select-course")} />
              ) : subjectsBySemester.length === 0 ? (
                <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:60px 20px;text-align:center")}>
                  <div style={s("font:600 15px Manrope;color:var(--muted)")}>{searchLC ? "No subjects match your search" : "No subjects published yet"}</div>
                </div>
              ) : (
                subjectsBySemester.map(([semId, subs]) => (
                  <div key={semId} style={s("margin-bottom:22px")}>
                    <div style={s("font:700 14px Poppins;color:var(--muted);margin-bottom:12px")}>{semName[semId] || `Semester ${semId}`}</div>
                    <div className="td-g3" style={s("display:grid;grid-template-columns:repeat(3,1fr);gap:16px")}>
                      {subs.map((su) => {
                        const pct = subjectPct[su.id] ?? 0;
                        return (
                          <div key={su.id} className="h-card" style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px")}>
                            <div style={s("display:flex;align-items:center;gap:12px;margin-bottom:14px")}>
                              <div style={s("width:44px;height:44px;border-radius:12px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;flex:none")}>{IcBook}</div>
                              <div style={s("min-width:0")}><div style={s("font:700 15px Poppins;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{su.title}</div><div style={s("font:500 12px Manrope;color:var(--faint)")}>{su.chapters.length} chapters</div></div>
                            </div>
                            <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:16px")}>
                              <div style={s("flex:1;height:7px;border-radius:4px;background:var(--bg2);overflow:hidden")}><div style={s(`height:100%;width:${pct}%;background:var(--accent);border-radius:4px`)} /></div>
                              <span style={s("font:600 12px Manrope;color:var(--muted)")}>{pct}%</span>
                            </div>
                            <button className="h-primary" onClick={() => go(semesterLink(su.semesterId))} style={s("width:100%;display:flex;align-items:center;justify-content:center;gap:7px;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px;font:600 13px Manrope;cursor:pointer")}>
                              {IcFile(16)} Open materials
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ============ QUIZZES ============ */}
          {page === "quizzes" && (
            <div style={s("animation:fadeIn .25s ease;max-width:1000px")}>
              {!myCourse ? (
                <EmptyCourse onSelect={() => go("/select-course")} />
              ) : mySubjects.length === 0 ? (
                <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:60px 20px;text-align:center")}>
                  <div style={s("font:600 15px Manrope;color:var(--muted)")}>No quizzes available yet</div>
                </div>
              ) : (
                <div style={s("display:flex;flex-direction:column;gap:16px")}>
                  {mySubjects.map((su) => (
                    <div key={su.id} className="h-card" style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px")}>
                      <div style={s("font:700 16px Poppins;margin-bottom:14px")}>{su.title}</div>
                      <div style={s("display:flex;flex-direction:column;gap:4px")}>
                        {su.chapters.map((ch) => {
                          const p = progMap[ch.id];
                          const done = p?.quizCompleted;
                          return (
                            <div key={ch.id} className="h-row" style={s("display:flex;align-items:center;gap:14px;padding:11px 10px;border-radius:11px")}>
                              <div style={s(`width:34px;height:34px;border-radius:9px;background:${done ? "var(--green-soft)" : "var(--accent-soft)"};color:${done ? "var(--green)" : "var(--accent)"};display:flex;align-items:center;justify-content:center;flex:none`)}>{done ? IcCheck(17) : IcQuizzes}</div>
                              <div style={s("flex:1;min-width:0;font:600 14px Manrope;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{ch.title}</div>
                              {done ? (
                                <span style={s(`font:700 13px Manrope;color:${scoreColor(p.quizScore)};flex:none`)}>{p.quizScore}%</span>
                              ) : (
                                <span style={s("font:500 12px Manrope;color:var(--faint);flex:none")}>Not attempted</span>
                              )}
                              <button className="h-accent" onClick={() => go(semesterLink(su.semesterId))} style={s("flex:none;border:1px solid var(--border);background:var(--bg2);color:var(--muted);border-radius:9px;padding:7px 13px;font:600 12px Manrope;cursor:pointer")}>{done ? "Retake" : "Take quiz"}</button>
                            </div>
                          );
                        })}
                        {su.chapters.length === 0 && (
                          <div style={s("padding:16px 10px;font:500 13px Manrope;color:var(--faint)")}>No chapters yet.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============ PROGRESS ============ */}
          {page === "progress" && (
            <div style={s("animation:fadeIn .25s ease;max-width:1000px")}>
              <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px;margin-bottom:18px")}>
                <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:12px")}>
                  <div style={s("font:700 16px Poppins")}>Overall progress</div>
                  <div style={s("font:800 20px Poppins;color:var(--accent)")}>{overall}%</div>
                </div>
                <div style={s("height:9px;border-radius:5px;background:var(--bg2);overflow:hidden")}><div style={s(`height:100%;width:${overall}%;background:var(--accent);border-radius:5px`)} /></div>
              </div>

              {progress && Object.keys(progress.courses).length > 0 ? (
                Object.entries(progress.courses).map(([cid, cd]) => (
                  <div key={cid} style={s("margin-bottom:18px")}>
                    {Object.entries(cd.semesters).map(([semId, sd]) => {
                      if (Object.keys(sd.subjects).length === 0) return null;
                      return (
                        <div key={semId} style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px;margin-bottom:16px")}>
                          <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:16px")}>
                            <div style={s("font:700 16px Poppins")}>{cd.icon} {cd.name} · {sd.name}</div>
                            <span style={s("font:700 13px Manrope;color:var(--accent)")}>{sd.progress}%</span>
                          </div>
                          <div style={s("display:flex;flex-direction:column;gap:14px")}>
                            {Object.entries(sd.subjects).map(([subId, sub]) => {
                              const title = subjects.find((x) => x.id === subId)?.title || subId;
                              return (
                                <div key={subId}>
                                  <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:8px")}>
                                    <span style={s("font:600 14px Manrope")}>{title}</span>
                                    <span style={s("font:500 12px Manrope;color:var(--muted)")}>{sub.progress}%</span>
                                  </div>
                                  <div style={s("height:7px;border-radius:4px;background:var(--bg2);overflow:hidden;margin-bottom:8px")}><div style={s(`height:100%;width:${sub.progress}%;background:var(--accent);border-radius:4px`)} /></div>
                                  <div className="td-g2" style={s("display:grid;grid-template-columns:1fr 1fr;gap:8px")}>
                                    {Object.entries(sub.chapters).map(([chId, ch]) => (
                                      <div key={chId} style={s("display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:9px;background:var(--bg2);border:1px solid var(--border)")}>
                                        <span style={s(`color:${ch.visited ? "var(--green)" : "var(--faint)"};flex:none;display:flex`)}>{ch.visited ? IcCheck(15) : IcClock(15)}</span>
                                        <span style={s("flex:1;min-width:0;font:600 12.5px Manrope;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{chapterMeta[chId]?.chapterTitle || chId}</span>
                                        {ch.quizCompleted && <span style={s(`font:700 11px Manrope;color:${scoreColor(ch.quizScore)};flex:none`)}>{ch.quizScore}%</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:50px 20px;text-align:center")}>
                  <div style={s("font:600 15px Manrope;color:var(--muted)")}>No progress yet</div>
                  <div style={s("font:500 13px Manrope;color:var(--faint);margin-top:6px")}>Chapters you read and quizzes you take will show up here.</div>
                  <button className="h-primary" onClick={() => setPage("subjects")} style={s("margin-top:16px;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px 18px;font:600 13px Manrope;cursor:pointer")}>Browse subjects</button>
                </div>
              )}
            </div>
          )}

          {/* ============ ANNOUNCEMENTS ============ */}
          {page === "announcements" && (
            <div style={s("animation:fadeIn .25s ease;max-width:900px")}>
              {announcement ? (
                <div className="h-card" style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px")}>
                  <div style={s("display:flex;align-items:flex-start;gap:14px")}>
                    <div style={s("width:42px;height:42px;border-radius:11px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;flex:none")}><I w={20}><path d="M3 11l14-6v14L3 13z" /></I></div>
                    <div style={s("flex:1;min-width:0")}>
                      <div style={s("font:700 16px Poppins")}>Announcement</div>
                      <div style={s("font:500 13.5px/1.6 Manrope;color:var(--muted);margin-top:8px")}>{announcement.message}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:50px 20px;text-align:center")}>
                  <div style={s("font:600 15px Manrope;color:var(--muted)")}>No announcements right now</div>
                  <div style={s("font:500 13px Manrope;color:var(--faint);margin-top:6px")}>Check back later for updates from your teachers.</div>
                </div>
              )}
            </div>
          )}

          {/* ============ PROFILE ============ */}
          {page === "profile" && (
            <div style={s("animation:fadeIn .25s ease;max-width:760px")}>
              <input ref={photoRef} type="file" accept="image/*" onChange={pickPhoto} style={s("display:none")} />
              <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:26px;margin-bottom:18px;display:flex;align-items:center;gap:20px")}>
                <div style={s("width:78px;height:78px;border-radius:50%;background:linear-gradient(135deg,#5f97d8,#3f6fac);display:flex;align-items:center;justify-content:center;font:800 26px Poppins;color:#fff;flex:none;overflow:hidden")}>
                  {avatarUrl ? <img src={avatarUrl} alt="" style={s("width:100%;height:100%;object-fit:cover")} /> : userInitials}
                </div>
                <div style={s("flex:1;min-width:0")}>
                  <div style={s("font:700 21px Poppins;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{displayName}</div>
                  <div style={s("font:500 13px Manrope;color:var(--muted);margin-top:2px")}>{roleLabel}{myCourse ? ` · ${myCourse.name}` : ""}</div>
                </div>
                <button className="h-accent" onClick={() => photoRef.current?.click()} style={s("padding:9px 15px;border-radius:10px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font:600 13px Manrope;cursor:pointer")}>Change photo</button>
              </div>
              <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:26px")}>
                <div style={s("font:700 16px Poppins;margin-bottom:20px")}>Account details</div>
                <div className="td-g2" style={s("display:grid;grid-template-columns:1fr 1fr;gap:16px")}>
                  <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Full name</label><input className="h-input" value={profile.name || sessionName} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={s("width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none")} /></div>
                  <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Email</label><input className="h-input" value={profile.email || sessionEmail} onChange={(e) => setProfile({ ...profile, email: e.target.value })} style={s("width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none")} /></div>
                  <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Course</label><input className="h-input" value={myCourse?.name ?? "Not selected"} readOnly style={s("width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none")} /></div>
                  <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Role</label><input className="h-input" value={roleLabel} readOnly style={s("width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none")} /></div>
                </div>
                <div style={s("display:flex;gap:10px;justify-content:flex-end;margin-top:22px")}>
                  <button onClick={() => setProfile({ name: "", email: "" })} style={s("padding:11px 18px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--muted);font:600 13px Manrope;cursor:pointer")}>Cancel</button>
                  <button className="h-primary" onClick={() => showToast("Profile saved")} style={s("padding:11px 20px;border-radius:10px;border:none;background:var(--accent);color:#fff;font:600 13px Manrope;cursor:pointer")}>Save changes</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= TOAST ================= */}
      {toast && (
        <div style={s("position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:90;display:flex;align-items:center;gap:11px;background:var(--card2);border:1px solid var(--border2);border-radius:12px;padding:13px 18px;box-shadow:0 12px 40px rgba(0,0,0,.4);animation:slideUp .25s ease")}>
          <div style={s("width:24px;height:24px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;flex:none")}><I w={14} sw={3} stroke="#fff"><path d="M20 6L9 17l-5-5" /></I></div>
          <span style={s("font:600 13.5px Manrope")}>{toast}</span>
        </div>
      )}
    </div>
  );
}

/* prompt shown when the student has not picked a course yet */
function EmptyCourse({ onSelect }: { onSelect: () => void }) {
  return (
    <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:50px 20px;text-align:center")}>
      <div style={s("width:52px;height:52px;border-radius:14px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 14px")}>{IcCourses}</div>
      <div style={s("font:700 16px Poppins")}>Pick your course first</div>
      <div style={s("font:500 13px Manrope;color:var(--faint);margin-top:6px")}>Choose a course to unlock its subjects, quizzes and progress.</div>
      <button className="h-primary" onClick={onSelect} style={s("margin-top:16px;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px 20px;font:600 13px Manrope;cursor:pointer")}>Select course</button>
    </div>
  );
}
