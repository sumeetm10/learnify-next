"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ReactNode, ChangeEvent, DragEvent } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";

/* ------------------------------------------------------------------ *
 * Teacher Dashboard — exact reproduction of the provided design.
 * Dark, self-contained dashboard (own sidebar + topbar), full-screen.
 * ------------------------------------------------------------------ */

// Parse a raw CSS declaration string into a React style object so the
// design's exact inline styles can be reused verbatim.
function s(str: string): CSSProperties {
  const o: Record<string, string> = {};
  for (const decl of str.split(";")) {
    const idx = decl.indexOf(":");
    if (idx < 0) continue;
    const rawKey = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (!rawKey || !val) continue;
    const key = rawKey.startsWith("--")
      ? rawKey
      : rawKey.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
    o[key] = val;
  }
  return o as CSSProperties;
}

// Small SVG helper (24x24, rounded caps/joins by default).
function I({
  w = 19,
  h,
  sw = 1.9,
  stroke = "currentColor",
  fill = "none",
  children,
}: {
  w?: number;
  h?: number;
  sw?: number;
  stroke?: string;
  fill?: string;
  children: ReactNode;
}) {
  return (
    <svg
      width={w}
      height={h ?? w}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/* -------------------------------- icons -------------------------------- */
const IcDashboard = (
  <I>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </I>
);
const IcMaterials = (
  <I>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6" />
    <path d="M9 17h6" />
  </I>
);
const IcQuizzes = (
  <I>
    <path d="M9 11l3 3 8-8" />
    <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
  </I>
);
const IcAnalytics = (
  <I>
    <path d="M3 3v18h18" />
    <rect x="7" y="11" width="3" height="6" rx="1" />
    <rect x="12" y="7" width="3" height="10" rx="1" />
    <rect x="17" y="9" width="3" height="8" rx="1" />
  </I>
);
const IcCourses = (
  <I>
    <path d="M12 3l9 5-9 5-9-5z" />
    <path d="M3 12l9 5 9-5" />
    <path d="M3 16l9 5 9-5" />
  </I>
);
const IcAnnounce = (
  <I>
    <path d="M3 11l14-6v14L3 13z" />
    <path d="M3 11v2a2 2 0 0 0 2 2h1" />
    <path d="M8 15v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
  </I>
);
const IcProfile = (
  <I>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
  </I>
);
const IcFile = (w = 18) => (
  <I w={w}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </I>
);
const IcPlus = (w = 15, sw = 2.4) => (
  <I w={w} sw={sw}>
    <path d="M12 5v14M5 12h14" />
  </I>
);
const IcEye = (
  <I w={15} sw={2}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </I>
);
const IcTrash = (
  <I w={15} sw={2}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </I>
);
const IcPaper = (
  <I w={17} sw={2}>
    <path d="M3 11l14-6v14L3 13z" />
  </I>
);
const IcChart = (
  <I w={17} sw={2}>
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 3 3 5-6" />
  </I>
);
const IcBook = (
  <I w={17}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </I>
);

/* ------------------------------- data types ------------------------------ */
interface Material {
  id: string;
  title: string;
  course: string;
  semester: string;
  subject: string;
  chapter: string;
  date: string;
  filePath?: string; // present for real (DB) uploads — used by the view button
  pages?: number; // demo-only fields (not tracked in the DB)
  size?: string;
  downloads?: number;
}

/* --- shapes returned by the live API (subset of what we use) --- */
interface LiveCourse {
  id: string;
  name: string;
  slug: string;
  semesters: { id: number; name: string }[];
}
interface LiveSubject {
  id: string;
  title: string;
  semesterId: number;
  chapters: { id: string; title: string }[];
}
interface LivePdf {
  id: string;
  title: string;
  filePath: string;
  createdAt: string;
  chapter: {
    title: string;
    subject: { title: string; semester: { name: string; course: { name: string } } };
  };
}
const mapPdf = (p: LivePdf): Material => ({
  id: p.id,
  title: p.title,
  course: p.chapter.subject.semester.course.name,
  semester: p.chapter.subject.semester.name,
  subject: p.chapter.subject.title,
  chapter: p.chapter.title,
  filePath: p.filePath,
  date: new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
});
interface Quiz {
  id: number;
  title: string;
  course: string;
  subject: string;
  questions: number;
  attempts: number;
  avg: number;
  status: string;
}
interface Announcement {
  id: number;
  title: string;
  course: string;
  body: string;
  author: string;
  date: string;
}
interface Student {
  name: string;
  course: string;
  comp: number;
  score: number;
}
interface Activity {
  name: string;
  action: string;
  score: string;
  time: string;
  course: string;
}
interface DraftQ {
  q: string;
  opts: string[];
  correct: number;
}

type Page =
  | "dashboard"
  | "materials"
  | "quizzes"
  | "progress"
  | "courses"
  | "announcements"
  | "profile";

/* ------------------------------- seed data ------------------------------ */
const SEED_MATERIALS: Material[] = [
  { id: "1", title: "Normalization & Keys", course: "BCSIT", semester: "Semester 4", subject: "Database Management", chapter: "3", pages: 24, size: "2.1 MB", downloads: 186, date: "Jul 8" },
  { id: "2", title: "TCP/IP Model Explained", course: "BCSIT", semester: "Semester 4", subject: "Computer Networks", chapter: "2", pages: 31, size: "3.4 MB", downloads: 142, date: "Jul 6" },
  { id: "3", title: "React Fundamentals", course: "BCSIT", semester: "Semester 5", subject: "Web Technology", chapter: "1", pages: 42, size: "4.8 MB", downloads: 209, date: "Jul 5" },
  { id: "4", title: "Sorting Algorithms", course: "BCSIT", semester: "Semester 3", subject: "Data Structures", chapter: "5", pages: 28, size: "2.7 MB", downloads: 174, date: "Jul 3" },
  { id: "5", title: "Principles of Marketing", course: "BBA", semester: "Semester 2", subject: "Marketing", chapter: "1", pages: 36, size: "3.0 MB", downloads: 98, date: "Jul 2" },
  { id: "6", title: "Financial Statements", course: "BBA", semester: "Semester 3", subject: "Accounting", chapter: "4", pages: 40, size: "3.9 MB", downloads: 121, date: "Jul 1" },
  { id: "7", title: "Food & Beverage Service", course: "BHM", semester: "Semester 2", subject: "F&B Operations", chapter: "2", pages: 22, size: "1.9 MB", downloads: 67, date: "Jun 29" },
  { id: "8", title: "ER Diagrams", course: "BCSIT", semester: "Semester 4", subject: "Database Management", chapter: "2", pages: 19, size: "1.6 MB", downloads: 158, date: "Jun 27" },
];

const SEED_QUIZZES: Quiz[] = [
  { id: 1, title: "DBMS · Chapter 3 Quiz", course: "BCSIT", subject: "Database Management", questions: 15, attempts: 128, avg: 82, status: "Published" },
  { id: 2, title: "Networks · TCP/IP", course: "BCSIT", subject: "Computer Networks", questions: 12, attempts: 96, avg: 68, status: "Published" },
  { id: 3, title: "Web Tech · React Basics", course: "BCSIT", subject: "Web Technology", questions: 20, attempts: 141, avg: 88, status: "Published" },
  { id: 4, title: "Data Structures · Sorting", course: "BCSIT", subject: "Data Structures", questions: 10, attempts: 0, avg: 0, status: "Draft" },
  { id: 5, title: "Marketing · Fundamentals", course: "BBA", subject: "Marketing", questions: 14, attempts: 74, avg: 76, status: "Published" },
  { id: 6, title: "F&B · Service Standards", course: "BHM", subject: "F&B Operations", questions: 12, attempts: 41, avg: 71, status: "Draft" },
];

const SEED_ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: "Mid-term quiz schedule released", course: "BCSIT", body: "The mid-term quizzes for Semester 4 will open Monday. Database Management and Computer Networks quizzes will be available for 48 hours each. Make sure to review chapters 1–4.", author: "", date: "Jul 9, 2026" },
  { id: 2, title: "New React material uploaded", course: "BCSIT", body: "I have uploaded the React Fundamentals chapter under Web Technology (Semester 5). It covers components, props and state with examples. Read before next class.", author: "", date: "Jul 5, 2026" },
  { id: 3, title: "Marketing assignment deadline", course: "BBA", body: "The Principles of Marketing assignment is due this Friday. Submit through the portal. Late submissions will not be accepted.", author: "", date: "Jul 2, 2026" },
  { id: 4, title: "Welcome to the new semester", course: "All", body: "Welcome back everyone! All updated materials and quizzes are now live on Learnify. Reach out if you have trouble accessing any chapter.", author: "", date: "Jun 24, 2026" },
];

const SEED_STUDENTS: Student[] = [
  { name: "Sumeet Shrestha", course: "BCSIT", comp: 86, score: 88 },
  { name: "Nishant Upadhyay", course: "BCSIT", comp: 74, score: 79 },
  { name: "Priya Karki", course: "BBA", comp: 91, score: 92 },
  { name: "Rohan Thapa", course: "BCSIT", comp: 58, score: 64 },
  { name: "Anisha Gurung", course: "BHM", comp: 67, score: 73 },
  { name: "Bibek Rai", course: "BCSIT", comp: 80, score: 81 },
  { name: "Sneha Maharjan", course: "BBA", comp: 45, score: 58 },
];

const SEED_ACTIVITY: Activity[] = [
  { name: "Priya Karki", action: "completed DBMS · Chapter 3 Quiz", score: "92%", time: "5 min ago", course: "BBA" },
  { name: "Sumeet Shrestha", action: "downloaded React Fundamentals", score: "—", time: "22 min ago", course: "BCSIT" },
  { name: "Rohan Thapa", action: "attempted Networks · TCP/IP", score: "64%", time: "1 hr ago", course: "BCSIT" },
  { name: "Anisha Gurung", action: "completed F&B · Service Standards", score: "73%", time: "3 hr ago", course: "BHM" },
  { name: "Bibek Rai", action: "completed Web Tech · React Basics", score: "81%", time: "5 hr ago", course: "BCSIT" },
];

const LAST_ACTIVE = ["2h ago", "1d ago", "3h ago", "5h ago", "1d ago", "4h ago", "2d ago"];

const COURSE_CARDS = [
  { code: "BCSIT", name: "Computer Science & IT", color: "var(--accent)", tagBg: "var(--accent-soft)", subjects: 42, students: 186 },
  { code: "BBA", name: "Business Administration", color: "var(--green)", tagBg: "var(--green-soft)", subjects: 38, students: 104 },
  { code: "BHM", name: "Hotel Management", color: "var(--amber)", tagBg: "var(--amber-soft)", subjects: 34, students: 52 },
];

const SUBJECT_LIST = [
  { name: "Database Management", chapters: 8, pdfs: 12 },
  { name: "Computer Networks", chapters: 7, pdfs: 9 },
  { name: "Operating Systems", chapters: 9, pdfs: 11 },
  { name: "Web Technology", chapters: 6, pdfs: 14 },
  { name: "Software Engineering", chapters: 8, pdfs: 8 },
  { name: "Numerical Methods", chapters: 5, pdfs: 6 },
];

const PAGE_TITLES: Record<Page, [string, string]> = {
  dashboard: ["Dashboard", "Welcome back, Aadarsh — here is your teaching overview"],
  materials: ["Study Materials", "Upload and organise PDFs by course, semester & chapter"],
  quizzes: ["Quizzes", "Create and manage MCQ quizzes for your students"],
  progress: ["Analytics", "Track student performance across subjects"],
  courses: ["Courses & Subjects", "Manage your courses, semesters and subjects"],
  announcements: ["Announcements", "Keep your students informed"],
  profile: ["Profile", "Manage your account details"],
};

/* ------------------------------- helpers ------------------------------- */
function meta(course: string): { color: string; bg: string } {
  const m: Record<string, { color: string; bg: string }> = {
    BCSIT: { color: "var(--accent)", bg: "var(--accent-soft)" },
    BBA: { color: "var(--green)", bg: "var(--green-soft)" },
    BHM: { color: "var(--amber)", bg: "var(--amber-soft)" },
    All: { color: "var(--muted)", bg: "rgba(148,163,184,.14)" },
  };
  return m[course] || m.All;
}
const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const scoreColor = (n: number) =>
  n >= 80 ? "var(--green)" : n >= 65 ? "var(--accent)" : "var(--amber)";

/* ------------------------------ component ------------------------------ */
export default function TeacherPage() {
  /* -------- session + theme (mirrors the rest of the site) -------- */
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  // false during SSR/hydration, true after mount — avoids a hydration mismatch
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const isDark = mounted && theme === "dark";

  const sessionUser = session?.user as
    | { name?: string | null; email?: string | null; role?: string }
    | undefined;
  const sessionName = sessionUser?.name?.trim() || "Teacher";
  const sessionEmail = sessionUser?.email?.trim() || "teacher@learnify.edu";
  const roleLabel = sessionUser?.role
    ? sessionUser.role.charAt(0) + sessionUser.role.slice(1).toLowerCase()
    : "Faculty";

  const [page, setPage] = useState<Page>("dashboard");
  const [course, setCourse] = useState("BCSIT");
  const [search, setSearch] = useState("");
  const [matFilterSem, setMatFilterSem] = useState("All semesters");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [annOpen, setAnnOpen] = useState(false);
  const [toast, setToast] = useState("");

  // UI state for the topbar menus, avatar photo, in-place quiz edit & subjects
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState(SUBJECT_LIST);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "+977 98XXXXXXXX",
    department: "BCSIT",
    bio: "Educator passionate about making study materials accessible and learning measurable for every student.",
  });
  const photoRef = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<Material[]>(SEED_MATERIALS);
  const [quizzes, setQuizzes] = useState<Quiz[]>(SEED_QUIZZES);
  const [announcements, setAnnouncements] = useState<Announcement[]>(SEED_ANNOUNCEMENTS);

  /* -------- live data (real DB) -------- */
  const [liveCourses, setLiveCourses] = useState<LiveCourse[]>([]);
  const [liveSubjects, setLiveSubjects] = useState<LiveSubject[]>([]);
  const [liveMode, setLiveMode] = useState(false); // true once real uploads load

  const loadMaterials = async () => {
    try {
      const res = await fetch("/api/teacher/pdfs");
      if (!res.ok) return; // not signed in (e.g. /teacher-preview) → keep seed demo
      const data = await res.json();
      setMaterials(((data.pdfs ?? []) as LivePdf[]).map(mapPdf));
      setLiveMode(true);
    } catch {
      /* offline / no API → keep the seed demo */
    }
  };

  useEffect(() => {
    // Public endpoints — power the upload picker and the courses page.
    fetch("/api/courses").then((r) => (r.ok ? r.json() : null)).then((d) => d?.courses && setLiveCourses(d.courses)).catch(() => {});
    fetch("/api/subjects").then((r) => (r.ok ? r.json() : null)).then((d) => d?.subjects && setLiveSubjects(d.subjects)).catch(() => {});
    loadMaterials();
  }, []);

  // Display identity — falls back to the live session, then to a safe default
  // (the /teacher-preview route renders this with no session).
  const displayName = profile.name.trim() || sessionName;
  const displayEmail = profile.email.trim() || sessionEmail;
  const firstName = displayName.split(" ")[0];
  const userInitials = initials(displayName);

  const [upload, setUpload] = useState({ courseId: "", semesterId: "", subjectId: "", chapterId: "", title: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [ann, setAnn] = useState({ course: "BCSIT", title: "", body: "" });
  const [quiz, setQuiz] = useState<{ course: string; subject: string; title: string; questions: DraftQ[] }>({
    course: "BCSIT",
    subject: "",
    title: "",
    questions: [{ q: "", opts: ["", "", "", ""], correct: 0 }],
  });

  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  };

  const resetUpload = () => {
    setUpload({ courseId: "", semesterId: "", subjectId: "", chapterId: "", title: "" });
    setUploadFile(null);
    setDragOver(false);
  };
  // Accept a chosen/dropped file: PDFs only; pre-fill the title from the name.
  const chooseFile = (f: File | null | undefined) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      showToast("Only PDF files are allowed");
      return;
    }
    setUploadFile(f);
    setUpload((u) => (u.title.trim() ? u : { ...u, title: f.name.replace(/\.pdf$/i, "") }));
  };
  const onDropFile = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    chooseFile(e.dataTransfer.files?.[0]);
  };

  const submitUpload = async () => {
    if (!uploadFile) {
      showToast("Choose a PDF file first");
      return;
    }
    if (!upload.title.trim()) {
      showToast("Add a title first");
      return;
    }
    if (!upload.chapterId) {
      showToast("Select course, semester, subject & chapter");
      return;
    }
    setUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("title", upload.title.trim());
      fd.append("chapterId", upload.chapterId);
      const res = await fetch("/api/teacher/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await loadMaterials();
      setUploadOpen(false);
      resetUpload();
      setPage("materials");
      showToast("Material uploaded successfully");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadBusy(false);
    }
  };

  const submitAnn = () => {
    if (!ann.title.trim() || !ann.body.trim()) {
      showToast("Add a title and message first");
      return;
    }
    const nid = Math.max(0, ...announcements.map((x) => x.id)) + 1;
    const item: Announcement = { id: nid, title: ann.title, course: ann.course, body: ann.body, author: displayName, date: "Just now" };
    setAnnouncements((a) => [item, ...a]);
    setAnnOpen(false);
    setAnn({ course: "BCSIT", title: "", body: "" });
    showToast("Announcement posted");
  };

  /* -------- account / topbar actions -------- */
  const doLogout = () => signOut({ callbackUrl: "/" });
  const pickPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setAvatarUrl(URL.createObjectURL(f));
      showToast("Profile photo updated");
    }
  };
  const addSubject = () => {
    // Subjects/chapters come from the DB and are created in the Admin panel.
    if (liveCourses.length) {
      showToast("Subjects are managed from the Admin panel");
      return;
    }
    const name = window.prompt("New subject name")?.trim();
    if (name) {
      setSubjects((s) => [{ name, chapters: 0, pdfs: 0 }, ...s]);
      showToast(`Added “${name}”`);
    }
  };

  const addQuestion = () =>
    setQuiz((q) => ({ ...q, questions: [...q.questions, { q: "", opts: ["", "", "", ""], correct: 0 }] }));
  const removeQuestion = (i: number) =>
    setQuiz((q) => {
      const arr = q.questions.slice();
      if (arr.length > 1) arr.splice(i, 1);
      return { ...q, questions: arr };
    });
  const setQ = (i: number, val: string) =>
    setQuiz((q) => {
      const arr = q.questions.slice();
      arr[i] = { ...arr[i], q: val };
      return { ...q, questions: arr };
    });
  const setOpt = (i: number, oi: number, val: string) =>
    setQuiz((q) => {
      const arr = q.questions.slice();
      const opts = arr[i].opts.slice();
      opts[oi] = val;
      arr[i] = { ...arr[i], opts };
      return { ...q, questions: arr };
    });
  const setCorrect = (i: number, oi: number) =>
    setQuiz((q) => {
      const arr = q.questions.slice();
      arr[i] = { ...arr[i], correct: oi };
      return { ...q, questions: arr };
    });

  const resetQuiz = () =>
    setQuiz({ course: "BCSIT", subject: "", title: "", questions: [{ q: "", opts: ["", "", "", ""], correct: 0 }] });
  const openCreateQuiz = () => {
    setEditingQuizId(null);
    resetQuiz();
    setQuizOpen(true);
  };
  const openEditQuiz = (q: Quiz) => {
    setEditingQuizId(q.id);
    setQuiz({ course: q.course, subject: q.subject, title: q.title, questions: [{ q: "", opts: ["", "", "", ""], correct: 0 }] });
    setQuizOpen(true);
  };

  const submitQuiz = () => {
    if (!quiz.title.trim() || !quiz.subject.trim()) {
      showToast("Add a title and subject first");
      return;
    }
    if (editingQuizId != null) {
      setQuizzes((qs) =>
        qs.map((x) => (x.id === editingQuizId ? { ...x, title: quiz.title, course: quiz.course, subject: quiz.subject } : x)),
      );
      showToast("Quiz updated");
    } else {
      const nid = Math.max(0, ...quizzes.map((x) => x.id)) + 1;
      const item: Quiz = { id: nid, title: quiz.title, course: quiz.course, subject: quiz.subject, questions: quiz.questions.length, attempts: 0, avg: 0, status: "Published" };
      setQuizzes((q) => [item, ...q]);
      showToast("Quiz published");
    }
    setCourse(quiz.course);
    setEditingQuizId(null);
    setQuizOpen(false);
    resetQuiz();
  };

  const deleteMaterial = async (id: string) => {
    const prev = materials;
    setMaterials((m) => m.filter((x) => x.id !== id)); // optimistic
    if (!liveMode) {
      showToast("Material deleted");
      return;
    }
    try {
      const res = await fetch(`/api/teacher/pdfs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Material deleted");
    } catch {
      setMaterials(prev); // roll back on failure
      showToast("Could not delete material");
    }
  };
  const deleteQuiz = (id: number) => {
    setQuizzes((q) => q.filter((x) => x.id !== id));
    showToast("Quiz deleted");
  };
  const toggleQuiz = (id: number) =>
    setQuizzes((q) =>
      q.map((x) => (x.id === id ? { ...x, status: x.status === "Published" ? "Draft" : "Published" } : x)),
    );

  /* --------------------------- derived values --------------------------- */
  const navFor = (p: Page) => ({
    bg: page === p ? "var(--accent-soft)" : "transparent",
    col: page === p ? "var(--text)" : "var(--muted)",
  });
  const pillFor = (c: string) => ({
    bg: course === c ? "var(--accent)" : "transparent",
    col: course === c ? "#fff" : "var(--muted)",
  });

  const searchLC = search.trim().toLowerCase();
  let fm = materials.filter((m) => m.course === course);
  if (matFilterSem !== "All semesters") fm = fm.filter((m) => m.semester === matFilterSem);
  if (searchLC) fm = fm.filter((m) => (m.title + m.subject).toLowerCase().includes(searchLC));

  let fq = quizzes.filter((q) => q.course === course);
  if (searchLC) fq = fq.filter((q) => (q.title + q.subject).toLowerCase().includes(searchLC));

  const recentMaterials = materials.slice(0, 4);
  const [pageTitle, basePageSub] = PAGE_TITLES[page];
  const pageSub =
    page === "dashboard"
      ? `Welcome back, ${firstName} — here is your teaching overview`
      : basePageSub;

  // Semester filter options for the Materials page (from the loaded data).
  const semOptions = Array.from(
    new Set(materials.filter((m) => m.course === course).map((m) => m.semester)),
  );

  // Upload picker — cascading options from live data.
  const upCourse = liveCourses.find((c) => c.id === upload.courseId);
  const upSemesters = upCourse?.semesters ?? [];
  const upSubjects = liveSubjects.filter((sub) => String(sub.semesterId) === upload.semesterId);
  const upSubject = upSubjects.find((sub) => sub.id === upload.subjectId);
  const upChapters = upSubject?.chapters ?? [];

  // Courses page — live courses/subjects, falling back to the demo cards.
  const displayCourses = liveCourses.length
    ? liveCourses.map((c) => {
        const m = meta(c.name);
        const semIds = new Set(c.semesters.map((sm) => sm.id));
        return {
          code: c.name,
          name: c.slug.toUpperCase(),
          color: m.color,
          tagBg: m.bg,
          semesters: c.semesters.length,
          subjects: liveSubjects.filter((sub) => semIds.has(sub.semesterId)).length,
          students: "—" as string | number,
        };
      })
    : COURSE_CARDS.map((c) => ({ ...c, semesters: 8, students: c.students as string | number }));
  const selectedCourseObj = liveCourses.find((c) => c.name === course);
  const selectedCourseSemIds = new Set(selectedCourseObj?.semesters.map((sm) => sm.id));
  const displaySubjects = liveCourses.length
    ? liveSubjects
        .filter((sub) => selectedCourseSemIds.has(sub.semesterId))
        .map((sub) => ({
          name: sub.title,
          chapters: sub.chapters.length,
          pdfs: materials.filter((m) => m.subject === sub.title).length,
        }))
    : subjects;

  const coursePills = () => (
    <div style={s("display:flex;gap:6px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:5px")}>
      {(["BCSIT", "BBA", "BHM"] as const).map((c) => {
        const p = pillFor(c);
        return (
          <button
            key={c}
            onClick={() => setCourse(c)}
            style={s(`padding:8px 15px;border:none;border-radius:9px;cursor:pointer;font:600 13px Manrope;background:${p.bg};color:${p.col}`)}
          >
            {c}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="tdscope" style={s("position:fixed;inset:0;padding-top:80px;display:flex;overflow:hidden;font-family:Manrope,sans-serif;background:var(--bg)")}>
      <style>{CSS}</style>

      {/* ================= SIDEBAR ================= */}
      <aside style={s("width:256px;flex:none;background:var(--sidebar);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:20px 16px")}>
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
            <div style={s("font:600 10.5px Manrope;color:var(--faint);letter-spacing:.6px;margin-top:3px")}>TEACHER PORTAL</div>
          </div>
        </div>

        <div style={s("font:700 10.5px Manrope;color:var(--faint);letter-spacing:1px;padding:6px 10px 8px")}>MENU</div>
        <nav style={s("display:flex;flex-direction:column;gap:3px")}>
          {([
            ["dashboard", "Dashboard", IcDashboard],
            ["materials", "Materials", IcMaterials],
            ["quizzes", "Quizzes", IcQuizzes],
            ["progress", "Analytics", IcAnalytics],
            ["courses", "Courses", IcCourses],
            ["announcements", "Announcements", IcAnnounce],
          ] as [Page, string, ReactNode][]).map(([key, label, icon]) => {
            const n = navFor(key);
            return (
              <button
                key={key}
                onClick={() => setPage(key)}
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
              onClick={() => setPage("profile")}
              style={s(`display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border:none;border-radius:11px;cursor:pointer;font:600 14px Manrope;text-align:left;transition:background .15s;background:${n.bg};color:${n.col}`)}
            >
              {IcProfile}
              Profile
            </button>
          );
        })()}

        <button
          onClick={() => setPage("profile")}
          style={s("margin-top:12px;display:flex;align-items:center;gap:11px;padding:11px;border-radius:13px;background:var(--card);border:1px solid var(--border);cursor:pointer;text-align:left;width:100%")}
        >
          <div style={s("width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#5f97d8,#3f6fac);display:flex;align-items:center;justify-content:center;font:700 13px Poppins;color:#fff;flex:none;overflow:hidden")}>
            {avatarUrl ? <img src={avatarUrl} alt="" style={s("width:100%;height:100%;object-fit:cover")} /> : userInitials}
          </div>
          <div style={s("min-width:0")}>
            <div style={s("font:600 13px Manrope;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{displayName}</div>
            <div style={s("font:500 11px Manrope;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{roleLabel} · {course}</div>
          </div>
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <div style={s("flex:1;display:flex;flex-direction:column;min-width:0;background:var(--bg)")}>
        {/* TOPBAR */}
        <header style={s("position:relative;z-index:30;flex:none;height:70px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:16px;padding:0 28px;background:var(--topbar);backdrop-filter:blur(8px)")}>
          <div style={s("min-width:0")}>
            <div style={s("font:700 19px Poppins;letter-spacing:-.3px;line-height:1.1")}>{pageTitle}</div>
            <div style={s("font:500 12px Manrope;color:var(--faint);margin-top:2px")}>{pageSub}</div>
          </div>
          <div style={s("flex:1")} />
          <div className="h-search" style={s("display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--border);border-radius:11px;padding:9px 13px;width:230px")}>
            <I w={16} sw={2} stroke="var(--faint)">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </I>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search materials, quizzes…"
              style={s("border:none;background:transparent;color:var(--text);font:500 13px Manrope;outline:none;width:100%")}
            />
          </div>

          {/* theme toggle — mirrors the site's light/dark switch */}
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
              {unread && <span style={s("position:absolute;top:9px;right:10px;width:7px;height:7px;border-radius:50%;background:var(--accent);border:2px solid var(--card)")} />}
            </button>
            {bellOpen && (
              <>
                <div onClick={() => setBellOpen(false)} style={s("position:fixed;inset:0;z-index:40")} />
                <div style={s("position:absolute;right:0;top:52px;width:330px;background:var(--card2);border:1px solid var(--border2);border-radius:14px;box-shadow:0 18px 46px rgba(0,0,0,.28);z-index:41;overflow:hidden;animation:popIn .18s ease")}>
                  <div style={s("padding:14px 16px;border-bottom:1px solid var(--border);font:700 14px Poppins")}>Notifications</div>
                  <div style={s("max-height:320px;overflow-y:auto")}>
                    {SEED_ACTIVITY.map((a, i) => {
                      const mt = meta(a.course);
                      return (
                        <div key={i} style={s("display:flex;gap:11px;padding:12px 16px;border-bottom:1px solid var(--border)")}>
                          <div style={s(`width:32px;height:32px;border-radius:50%;background:${mt.bg};color:${mt.color};display:flex;align-items:center;justify-content:center;font:700 11px Poppins;flex:none`)}>{initials(a.name)}</div>
                          <div style={s("min-width:0")}>
                            <div style={s("font:600 13px Manrope")}>{a.name} <span style={s("font-weight:500;color:var(--muted)")}>{a.action}</span></div>
                            <div style={s("font:500 11px Manrope;color:var(--faint);margin-top:2px")}>{a.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* profile avatar + account menu */}
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
                      {IcChart} Student analytics
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
        <main style={s("flex:1;overflow-y:auto;padding:28px")}>
          {/* ============ DASHBOARD ============ */}
          {page === "dashboard" && (
            <div style={s("animation:fadeIn .25s ease;max-width:1200px")}>
              <div style={s("display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:22px")}>
                {[
                  { icon: (<I w={20}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></I>), iconBg: "#3b82f6", iconCol: "#fff", tag: "+12", value: "342", label: "Enrolled students" },
                  { icon: IcFile(20), iconBg: "#22c55e", iconCol: "#fff", tag: "+5", value: liveMode ? String(materials.length) : "128", label: "PDFs uploaded" },
                  { icon: (<I w={20}><path d="M9 11l3 3 8-8" /><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" /></I>), iconBg: "#f59e0b", iconCol: "#fff", tag: "+3", value: "46", label: "Active quizzes" },
                  { icon: (<I w={20}><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></I>), iconBg: "#a855f7", iconCol: "#fff", tag: "+2.4%", value: "78%", label: "Avg quiz score" },
                ].map((st, i) => (
                  <div key={i} className="h-stat" style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px")}>
                    <div style={s("display:flex;justify-content:space-between;align-items:flex-start")}>
                      <div style={s(`width:40px;height:40px;border-radius:11px;background:${st.iconBg};display:flex;align-items:center;justify-content:center;color:${st.iconCol}`)}>{st.icon}</div>
                      <span style={s("font:700 11px Manrope;color:var(--green);background:var(--green-soft);padding:4px 8px;border-radius:20px")}>{st.tag}</span>
                    </div>
                    <div style={s("font:800 30px Poppins;margin-top:14px;letter-spacing:-.5px")}>{st.value}</div>
                    <div style={s("font:500 13px Manrope;color:var(--muted);margin-top:2px")}>{st.label}</div>
                  </div>
                ))}
              </div>

              <div style={s("display:grid;grid-template-columns:1.7fr 1fr;gap:18px;align-items:start")}>
                {/* recent materials */}
                <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px")}>
                  <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:16px")}>
                    <div style={s("font:700 16px Poppins")}>Recent uploads</div>
                    <button className="h-primary" onClick={() => setUploadOpen(true)} style={s("display:flex;align-items:center;gap:7px;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:9px 14px;font:600 13px Manrope;cursor:pointer")}>
                      {IcPlus()} Upload PDF
                    </button>
                  </div>
                  <div style={s("display:flex;flex-direction:column;gap:4px")}>
                    {recentMaterials.map((m) => {
                      const mt = meta(m.course);
                      return (
                        <div key={m.id} className="h-row" style={s("display:flex;align-items:center;gap:14px;padding:11px 10px;border-radius:11px")}>
                          <div style={s("width:38px;height:38px;border-radius:10px;background:var(--red-soft);display:flex;align-items:center;justify-content:center;color:var(--red);flex:none")}>{IcFile(18)}</div>
                          <div style={s("min-width:0;flex:1")}>
                            <div style={s("font:600 14px Manrope;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{m.title}</div>
                            <div style={s("font:500 12px Manrope;color:var(--faint);margin-top:2px")}>{m.subject}{m.chapter ? ` · ${m.chapter}` : ""}{m.pages ? ` · ${m.pages} pages` : ""}{m.size ? ` · ${m.size}` : ""}</div>
                          </div>
                          <span style={s(`font:700 11px Manrope;color:${mt.color};background:${mt.bg};padding:4px 10px;border-radius:20px;flex:none`)}>{m.course}</span>
                          <span style={s("font:500 12px Manrope;color:var(--faint);width:78px;text-align:right;flex:none")}>{m.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* donut + quick actions */}
                <div style={s("display:flex;flex-direction:column;gap:18px")}>
                  <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px")}>
                    <div style={s("font:700 16px Poppins;margin-bottom:6px")}>Course completion</div>
                    <div style={s("font:500 12px Manrope;color:var(--faint);margin-bottom:8px")}>Across all your subjects</div>
                    <div style={s("display:flex;align-items:center;justify-content:center;position:relative;height:150px")}>
                      <svg width="150" height="150" viewBox="0 0 150 150">
                        <circle cx="75" cy="75" r="58" fill="none" stroke="rgba(148,163,184,.14)" strokeWidth="14" />
                        <circle cx="75" cy="75" r="58" fill="none" stroke="var(--accent)" strokeWidth="14" strokeLinecap="round" strokeDasharray="364.4" strokeDashoffset="94.7" transform="rotate(-90 75 75)" />
                      </svg>
                      <div style={s("position:absolute;text-align:center")}>
                        <div style={s("font:800 30px Poppins;letter-spacing:-.5px")}>74%</div>
                        <div style={s("font:500 11px Manrope;color:var(--faint)")}>completed</div>
                      </div>
                    </div>
                    <div style={s("display:flex;justify-content:space-around;margin-top:10px")}>
                      <div style={s("text-align:center")}><div style={s("font:700 18px Poppins;color:var(--green)")}>96</div><div style={s("font:500 11px Manrope;color:var(--faint)")}>Chapters</div></div>
                      <div style={s("text-align:center")}><div style={s("font:700 18px Poppins;color:var(--accent)")}>71</div><div style={s("font:500 11px Manrope;color:var(--faint)")}>Done</div></div>
                      <div style={s("text-align:center")}><div style={s("font:700 18px Poppins;color:var(--amber)")}>25</div><div style={s("font:500 11px Manrope;color:var(--faint)")}>Pending</div></div>
                    </div>
                  </div>
                  <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px")}>
                    <div style={s("font:700 16px Poppins;margin-bottom:14px")}>Quick actions</div>
                    <div style={s("display:flex;flex-direction:column;gap:9px")}>
                      <button className="h-qa" onClick={openCreateQuiz} style={s("display:flex;align-items:center;gap:11px;width:100%;padding:12px 13px;border-radius:11px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font:600 13px Manrope;cursor:pointer;text-align:left")}>
                        <span style={s("color:var(--accent)")}><I w={17} sw={2}><path d="M12 5v14M5 12h14" /></I></span> Create a new quiz
                      </button>
                      <button className="h-qa" onClick={() => setAnnOpen(true)} style={s("display:flex;align-items:center;gap:11px;width:100%;padding:12px 13px;border-radius:11px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font:600 13px Manrope;cursor:pointer;text-align:left")}>
                        <span style={s("color:var(--accent)")}>{IcPaper}</span> Post an announcement
                      </button>
                      <button className="h-qa" onClick={() => setPage("progress")} style={s("display:flex;align-items:center;gap:11px;width:100%;padding:12px 13px;border-radius:11px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font:600 13px Manrope;cursor:pointer;text-align:left")}>
                        <span style={s("color:var(--accent)")}>{IcChart}</span> View student analytics
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* student activity */}
              <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px;margin-top:18px")}>
                <div style={s("font:700 16px Poppins;margin-bottom:14px")}>Recent student activity</div>
                <div style={s("display:flex;flex-direction:column;gap:2px")}>
                  {SEED_ACTIVITY.map((a, i) => {
                    const mt = meta(a.course);
                    const sc = a.score === "—" ? "var(--faint)" : scoreColor(parseInt(a.score));
                    return (
                      <div key={i} style={s("display:flex;align-items:center;gap:14px;padding:10px 8px;border-bottom:1px solid var(--border)")}>
                        <div style={s(`width:34px;height:34px;border-radius:50%;background:${mt.bg};color:${mt.color};display:flex;align-items:center;justify-content:center;font:700 12px Poppins;flex:none`)}>{initials(a.name)}</div>
                        <div style={s("flex:1;min-width:0")}><span style={s("font:600 14px Manrope")}>{a.name}</span> <span style={s("font:500 13px Manrope;color:var(--muted)")}>{a.action}</span></div>
                        <span style={s(`font:700 13px Manrope;color:${sc};flex:none`)}>{a.score}</span>
                        <span style={s("font:500 12px Manrope;color:var(--faint);width:70px;text-align:right;flex:none")}>{a.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============ MATERIALS ============ */}
          {page === "materials" && (
            <div style={s("animation:fadeIn .25s ease;max-width:1200px")}>
              <div style={s("display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap")}>
                {coursePills()}
                <select value={matFilterSem} onChange={(e) => setMatFilterSem(e.target.value)} style={s("background:var(--card);border:1px solid var(--border);border-radius:11px;padding:10px 13px;color:var(--text);font:600 13px Manrope;cursor:pointer;outline:none")}>
                  <option>All semesters</option>
                  {semOptions.map((sm) => (<option key={sm}>{sm}</option>))}
                </select>
                <div style={s("flex:1")} />
                <button className="h-primary" onClick={() => setUploadOpen(true)} style={s("display:flex;align-items:center;gap:7px;background:var(--accent);color:#fff;border:none;border-radius:11px;padding:11px 16px;font:600 13px Manrope;cursor:pointer")}>
                  {IcPlus()} Upload PDF
                </button>
              </div>

              <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden")}>
                <div style={s("display:grid;grid-template-columns:2.4fr 1.2fr .9fr .7fr .7fr 90px;gap:14px;padding:14px 22px;border-bottom:1px solid var(--border);font:700 11px Manrope;color:var(--faint);letter-spacing:.5px;text-transform:uppercase")}>
                  <div>Material</div><div>Subject</div><div>Semester</div><div>Pages</div><div>Downloads</div><div style={s("text-align:right")}>Actions</div>
                </div>
                {fm.map((m) => (
                  <div key={m.id} className="h-row" style={s("display:grid;grid-template-columns:2.4fr 1.2fr .9fr .7fr .7fr 90px;gap:14px;padding:15px 22px;border-bottom:1px solid var(--border);align-items:center")}>
                    <div style={s("display:flex;align-items:center;gap:12px;min-width:0")}>
                      <div style={s("width:36px;height:36px;border-radius:9px;background:var(--red-soft);display:flex;align-items:center;justify-content:center;color:var(--red);flex:none")}>{IcFile(17)}</div>
                      <div style={s("min-width:0")}><div style={s("font:600 14px Manrope;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{m.title}</div><div style={s("font:500 11.5px Manrope;color:var(--faint)")}>{m.size ? `Chapter ${m.chapter} · ${m.size}` : m.chapter}</div></div>
                    </div>
                    <div style={s("font:500 13px Manrope;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{m.subject}</div>
                    <div style={s("font:500 13px Manrope;color:var(--muted)")}>{m.semester.replace("Semester", "Sem")}</div>
                    <div style={s("font:600 13px Manrope")}>{m.pages ?? "—"}</div>
                    <div style={s("font:600 13px Manrope")}>{m.downloads ?? "—"}</div>
                    <div style={s("display:flex;gap:6px;justify-content:flex-end")}>
                      <button className="h-accent" onClick={() => (m.filePath ? window.open(m.filePath, "_blank", "noopener") : showToast(`Opening “${m.title}”`))} style={s("width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center")}>{IcEye}</button>
                      <button className="h-del" onClick={() => deleteMaterial(m.id)} style={s("width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center")}>{IcTrash}</button>
                    </div>
                  </div>
                ))}
                {fm.length === 0 && (
                  <div style={s("padding:60px 20px;text-align:center;color:var(--faint)")}>
                    <div style={s("font:600 15px Manrope;color:var(--muted)")}>No materials match your filters</div>
                    <div style={s("font:500 13px Manrope;margin-top:6px")}>Try another semester, or upload a new PDF.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============ QUIZZES ============ */}
          {page === "quizzes" && (
            <div style={s("animation:fadeIn .25s ease;max-width:1200px")}>
              <div style={s("display:flex;align-items:center;gap:12px;margin-bottom:20px")}>
                {coursePills()}
                <div style={s("flex:1")} />
                <button className="h-primary" onClick={openCreateQuiz} style={s("display:flex;align-items:center;gap:7px;background:var(--accent);color:#fff;border:none;border-radius:11px;padding:11px 16px;font:600 13px Manrope;cursor:pointer")}>
                  {IcPlus()} Create quiz
                </button>
              </div>

              <div style={s("display:grid;grid-template-columns:repeat(2,1fr);gap:18px")}>
                {fq.map((q) => {
                  const pub = q.status === "Published";
                  const sc = scoreColor(q.avg || 70);
                  return (
                    <div key={q.id} className="h-card" style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px")}>
                      <div style={s("display:flex;align-items:flex-start;justify-content:space-between;gap:12px")}>
                        <div style={s("min-width:0")}>
                          <div style={s("font:700 16px Poppins;margin-bottom:4px")}>{q.title}</div>
                          <div style={s("font:500 12.5px Manrope;color:var(--faint)")}>{q.subject}</div>
                        </div>
                        <span style={s(`font:700 11px Manrope;color:${pub ? "var(--green)" : "var(--amber)"};background:${pub ? "var(--green-soft)" : "var(--amber-soft)"};padding:5px 11px;border-radius:20px;flex:none`)}>{q.status}</span>
                      </div>
                      <div style={s("display:flex;gap:22px;margin:18px 0 14px")}>
                        <div><div style={s("font:800 20px Poppins")}>{q.questions}</div><div style={s("font:500 11px Manrope;color:var(--faint)")}>Questions</div></div>
                        <div><div style={s("font:800 20px Poppins")}>{q.attempts}</div><div style={s("font:500 11px Manrope;color:var(--faint)")}>Attempts</div></div>
                        <div><div style={s(`font:800 20px Poppins;color:${sc}`)}>{q.attempts ? q.avg + "%" : "—"}</div><div style={s("font:500 11px Manrope;color:var(--faint)")}>Avg score</div></div>
                      </div>
                      <div style={s("height:7px;border-radius:4px;background:var(--bg2);overflow:hidden;margin-bottom:16px")}><div style={s(`height:100%;width:${q.avg || 0}%;background:${sc};border-radius:4px`)} /></div>
                      <div style={s("display:flex;gap:8px")}>
                        <button className="h-accent" onClick={() => toggleQuiz(q.id)} style={s("flex:1;padding:9px;border-radius:9px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font:600 12.5px Manrope;cursor:pointer")}>{pub ? "Unpublish" : "Publish"}</button>
                        <button className="h-accent" onClick={() => openEditQuiz(q)} style={s("padding:9px 12px;border-radius:9px;border:1px solid var(--border);background:var(--bg2);color:var(--muted);font:600 12.5px Manrope;cursor:pointer")}>Edit</button>
                        <button className="h-del" onClick={() => deleteQuiz(q.id)} style={s("width:36px;padding:9px;border-radius:9px;border:1px solid var(--border);background:var(--bg2);color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center")}>{IcTrash}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============ ANALYTICS ============ */}
          {page === "progress" && (
            <div style={s("animation:fadeIn .25s ease;max-width:1200px")}>
              <div style={s("display:grid;grid-template-columns:1.3fr 1fr;gap:18px;margin-bottom:18px")}>
                <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px")}>
                  <div style={s("font:700 16px Poppins;margin-bottom:20px")}>Average score by subject</div>
                  <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:18px;height:190px;padding:0 4px")}>
                    {[
                      { v: 82, h: "66%", c: "var(--accent)", g: "#3f6fac", l: "Prog." },
                      { v: 76, h: "58%", c: "var(--accent)", g: "#3f6fac", l: "DBMS" },
                      { v: 68, h: "47%", c: "var(--amber)", g: "#a5822f", l: "Net." },
                      { v: 88, h: "76%", c: "var(--green)", g: "#3d7d63", l: "Web" },
                      { v: 71, h: "50%", c: "var(--amber)", g: "#a5822f", l: "Math" },
                      { v: 79, h: "62%", c: "var(--accent)", g: "#3f6fac", l: "Eng." },
                    ].map((b, i) => (
                      <div key={i} style={s("flex:1;display:flex;flex-direction:column;align-items:center;gap:9px;height:100%;justify-content:flex-end")}>
                        <div style={s(`font:700 12px Poppins;color:${b.c}`)}>{b.v}</div>
                        <div style={s(`width:100%;max-width:46px;height:${b.h};background:linear-gradient(180deg,${b.c},${b.g});border-radius:8px 8px 0 0`)} />
                        <div style={s("font:600 11px Manrope;color:var(--faint);text-align:center")}>{b.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px")}>
                  <div style={s("font:700 16px Poppins;margin-bottom:20px")}>Submissions this week</div>
                  <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:10px;height:190px")}>
                    {[
                      { h: "40%", c: "var(--accent-soft)", l: "Mon" },
                      { h: "62%", c: "var(--accent-soft)", l: "Tue" },
                      { h: "55%", c: "var(--accent-soft)", l: "Wed" },
                      { h: "85%", c: "var(--accent)", l: "Thu" },
                      { h: "72%", c: "var(--accent-soft)", l: "Fri" },
                      { h: "30%", c: "var(--accent-soft)", l: "Sat" },
                      { h: "22%", c: "var(--accent-soft)", l: "Sun" },
                    ].map((b, i) => (
                      <div key={i} style={s("flex:1;display:flex;flex-direction:column;align-items:center;gap:9px;height:100%;justify-content:flex-end")}>
                        <div style={s(`width:100%;height:${b.h};background:${b.c};border-radius:6px 6px 0 0`)} />
                        <div style={s("font:600 11px Manrope;color:var(--faint)")}>{b.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden")}>
                <div style={s("padding:18px 22px;border-bottom:1px solid var(--border);font:700 16px Poppins")}>Student progress</div>
                <div style={s("display:grid;grid-template-columns:1.6fr .8fr 1.4fr .9fr .8fr;gap:14px;padding:13px 22px;border-bottom:1px solid var(--border);font:700 11px Manrope;color:var(--faint);letter-spacing:.5px;text-transform:uppercase")}>
                  <div>Student</div><div>Course</div><div>Completion</div><div>Avg score</div><div>Last active</div>
                </div>
                {SEED_STUDENTS.map((st, i) => {
                  const mt = meta(st.course);
                  return (
                    <div key={i} className="h-row" style={s("display:grid;grid-template-columns:1.6fr .8fr 1.4fr .9fr .8fr;gap:14px;padding:14px 22px;border-bottom:1px solid var(--border);align-items:center")}>
                      <div style={s("display:flex;align-items:center;gap:11px;min-width:0")}><div style={s(`width:34px;height:34px;border-radius:50%;background:${mt.bg};color:${mt.color};display:flex;align-items:center;justify-content:center;font:700 12px Poppins;flex:none`)}>{initials(st.name)}</div><div style={s("font:600 14px Manrope;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{st.name}</div></div>
                      <div><span style={s(`font:700 11px Manrope;color:${mt.color};background:${mt.bg};padding:4px 10px;border-radius:20px`)}>{st.course}</span></div>
                      <div style={s("display:flex;align-items:center;gap:10px")}><div style={s("flex:1;height:7px;border-radius:4px;background:var(--bg2);overflow:hidden")}><div style={s(`height:100%;width:${st.comp}%;background:var(--accent);border-radius:4px`)} /></div><span style={s("font:600 12px Manrope;color:var(--muted);width:34px")}>{st.comp}%</span></div>
                      <div style={s(`font:700 14px Manrope;color:${scoreColor(st.score)}`)}>{st.score}%</div>
                      <div style={s("font:500 12.5px Manrope;color:var(--faint)")}>{LAST_ACTIVE[i % 7]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============ COURSES ============ */}
          {page === "courses" && (
            <div style={s("animation:fadeIn .25s ease;max-width:1200px")}>
              <div style={s("display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:22px")}>
                {displayCourses.map((c) => (
                  <div key={c.code} className="h-card" style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden")}>
                    <div style={s(`height:6px;background:${c.color}`)} />
                    <div style={s("padding:22px")}>
                      <div style={s("display:flex;align-items:center;gap:12px;margin-bottom:16px")}>
                        <div style={s(`width:46px;height:46px;border-radius:12px;background:${c.tagBg};color:${c.color};display:flex;align-items:center;justify-content:center;font:800 15px Poppins`)}>{c.code}</div>
                        <div><div style={s("font:700 16px Poppins")}>{c.code}</div><div style={s("font:500 12px Manrope;color:var(--faint)")}>{c.name}</div></div>
                      </div>
                      <div style={s("display:flex;justify-content:space-between;padding:14px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:16px")}>
                        <div style={s("text-align:center")}><div style={s("font:800 18px Poppins")}>{c.semesters}</div><div style={s("font:500 11px Manrope;color:var(--faint)")}>Semesters</div></div>
                        <div style={s("text-align:center")}><div style={s("font:800 18px Poppins")}>{c.subjects}</div><div style={s("font:500 11px Manrope;color:var(--faint)")}>Subjects</div></div>
                        <div style={s("text-align:center")}><div style={s("font:800 18px Poppins")}>{c.students}</div><div style={s("font:500 11px Manrope;color:var(--faint)")}>Students</div></div>
                      </div>
                      <button className="h-accent" onClick={() => { setCourse(c.code); showToast(`Managing ${c.code} subjects`); }} style={s("width:100%;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font:600 13px Manrope;cursor:pointer")}>Manage subjects</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px")}>
                <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:16px")}>
                  <div style={s("font:700 16px Poppins")}>{course} · Subjects</div>
                  <button onClick={addSubject} style={s("display:flex;align-items:center;gap:7px;background:var(--accent-soft);color:var(--accent);border:none;border-radius:9px;padding:8px 13px;font:600 12.5px Manrope;cursor:pointer")}>{IcPlus(14)} Add subject</button>
                </div>
                <div style={s("display:grid;grid-template-columns:repeat(2,1fr);gap:10px")}>
                  {displaySubjects.map((sub) => (
                    <div key={sub.name} style={s("display:flex;align-items:center;gap:13px;padding:13px 15px;border-radius:11px;background:var(--bg2);border:1px solid var(--border)")}>
                      <div style={s("width:36px;height:36px;border-radius:9px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center")}>{IcBook}</div>
                      <div style={s("flex:1;min-width:0")}><div style={s("font:600 14px Manrope")}>{sub.name}</div><div style={s("font:500 11.5px Manrope;color:var(--faint)")}>{sub.chapters} chapters · {sub.pdfs} PDFs</div></div>
                    </div>
                  ))}
                  {displaySubjects.length === 0 && (
                    <div style={s("grid-column:1/3;padding:30px 20px;text-align:center;font:500 13px Manrope;color:var(--faint)")}>No subjects for {course} yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============ ANNOUNCEMENTS ============ */}
          {page === "announcements" && (
            <div style={s("animation:fadeIn .25s ease;max-width:900px")}>
              <div style={s("display:flex;justify-content:flex-end;margin-bottom:18px")}>
                <button className="h-primary" onClick={() => setAnnOpen(true)} style={s("display:flex;align-items:center;gap:7px;background:var(--accent);color:#fff;border:none;border-radius:11px;padding:11px 16px;font:600 13px Manrope;cursor:pointer")}>
                  {IcPlus()} New announcement
                </button>
              </div>
              <div style={s("display:flex;flex-direction:column;gap:14px")}>
                {announcements.map((a) => {
                  const mt = meta(a.course);
                  return (
                    <div key={a.id} className="h-card" style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px")}>
                      <div style={s("display:flex;align-items:flex-start;gap:14px")}>
                        <div style={s("width:42px;height:42px;border-radius:11px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;flex:none")}><I w={20}><path d="M3 11l14-6v14L3 13z" /></I></div>
                        <div style={s("flex:1;min-width:0")}>
                          <div style={s("display:flex;align-items:center;gap:10px;flex-wrap:wrap")}><span style={s("font:700 16px Poppins")}>{a.title}</span><span style={s(`font:700 10.5px Manrope;color:${mt.color};background:${mt.bg};padding:4px 9px;border-radius:20px`)}>{a.course}</span></div>
                          <div style={s("font:500 13.5px/1.6 Manrope;color:var(--muted);margin-top:8px")}>{a.body}</div>
                          <div style={s("font:500 12px Manrope;color:var(--faint);margin-top:12px")}>Posted by {a.author || displayName} · {a.date}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  <div style={s("font:500 13px Manrope;color:var(--muted);margin-top:2px")}>{roleLabel} · Learnify</div>
                </div>
                <button className="h-accent" onClick={() => photoRef.current?.click()} style={s("padding:9px 15px;border-radius:10px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font:600 13px Manrope;cursor:pointer")}>Change photo</button>
              </div>
              <div style={s("background:var(--card);border:1px solid var(--border);border-radius:16px;padding:26px")}>
                <div style={s("font:700 16px Poppins;margin-bottom:20px")}>Account details</div>
                <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:16px")}>
                  <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Full name</label><input className="h-input" value={profile.name || sessionName} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={s("width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none")} /></div>
                  <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Email</label><input className="h-input" value={profile.email || sessionEmail} onChange={(e) => setProfile({ ...profile, email: e.target.value })} style={s("width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none")} /></div>
                  <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Phone</label><input className="h-input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} style={s("width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none")} /></div>
                  <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Department</label><input className="h-input" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} style={s("width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none")} /></div>
                  <div style={s("grid-column:1/3")}><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Bio</label><textarea className="h-input" rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} style={s("width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none;resize:vertical")} /></div>
                </div>
                <div style={s("display:flex;gap:10px;justify-content:flex-end;margin-top:22px")}>
                  <button onClick={() => setProfile({ name: "", email: "", phone: "+977 98XXXXXXXX", department: "BCSIT", bio: "Educator passionate about making study materials accessible and learning measurable for every student." })} style={s("padding:11px 18px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--muted);font:600 13px Manrope;cursor:pointer")}>Cancel</button>
                  <button className="h-primary" onClick={() => showToast("Profile saved")} style={s("padding:11px 20px;border-radius:10px;border:none;background:var(--accent);color:#fff;font:600 13px Manrope;cursor:pointer")}>Save changes</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= UPLOAD MODAL ================= */}
      {uploadOpen && (
        <div onClick={() => setUploadOpen(false)} style={s("position:fixed;inset:0;background:rgba(6,10,20,.66);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:50;animation:fadeIn .15s ease")}>
          <div onClick={(e) => e.stopPropagation()} style={s("width:520px;max-width:92vw;background:var(--bg2);border:1px solid var(--border2);border-radius:18px;padding:26px;animation:popIn .22s cubic-bezier(.2,.8,.3,1)")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:20px")}>
              <div><div style={s("font:700 18px Poppins")}>Upload study material</div><div style={s("font:500 12.5px Manrope;color:var(--faint);margin-top:2px")}>Add a PDF chapter for your students</div></div>
              <button onClick={() => setUploadOpen(false)} style={s("width:34px;height:34px;border-radius:9px;border:1px solid var(--border);background:var(--card);color:var(--muted);cursor:pointer;font-size:18px")}>✕</button>
            </div>
            <input ref={fileRef} type="file" accept="application/pdf" onChange={(e) => chooseFile(e.target.files?.[0])} style={s("display:none")} />
            <div
              className="h-drop"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDropFile}
              style={s(`border:1.5px dashed ${dragOver ? "var(--accent)" : "var(--border2)"};border-radius:13px;padding:26px;text-align:center;margin-bottom:18px;cursor:pointer;background:${dragOver ? "var(--accent-soft)" : "var(--card)"}`)}
            >
              <div style={s("width:46px;height:46px;border-radius:12px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 10px")}><I w={22}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5-5 5 5" /><path d="M12 5v13" /></I></div>
              {uploadFile ? (
                <>
                  <div style={s("font:600 14px Manrope;color:var(--accent)")}>{uploadFile.name}</div>
                  <div style={s("font:500 12px Manrope;color:var(--faint);margin-top:4px")}>{(uploadFile.size / 1048576).toFixed(1)} MB · click to choose a different file</div>
                </>
              ) : (
                <>
                  <div style={s("font:600 14px Manrope")}>Drag &amp; drop a PDF, or <span style={s("color:var(--accent)")}>browse</span></div>
                  <div style={s("font:500 12px Manrope;color:var(--faint);margin-top:4px")}>PDF only</div>
                </>
              )}
            </div>
            <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px")}>
              <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Course</label><select value={upload.courseId} onChange={(e) => setUpload({ ...upload, courseId: e.target.value, semesterId: "", subjectId: "", chapterId: "" })} style={s("width:100%;background:var(--card);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none;cursor:pointer")}><option value="">Select course</option>{liveCourses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>
              <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Semester</label><select value={upload.semesterId} onChange={(e) => setUpload({ ...upload, semesterId: e.target.value, subjectId: "", chapterId: "" })} disabled={!upload.courseId} style={s("width:100%;background:var(--card);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none;cursor:pointer")}><option value="">Select semester</option>{upSemesters.map((sm) => (<option key={sm.id} value={String(sm.id)}>{sm.name}</option>))}</select></div>
              <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Subject</label><select value={upload.subjectId} onChange={(e) => setUpload({ ...upload, subjectId: e.target.value, chapterId: "" })} disabled={!upload.semesterId} style={s("width:100%;background:var(--card);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none;cursor:pointer")}><option value="">{upSubjects.length ? "Select subject" : "No subjects here"}</option>{upSubjects.map((sub) => (<option key={sub.id} value={sub.id}>{sub.title}</option>))}</select></div>
              <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Chapter</label><select value={upload.chapterId} onChange={(e) => setUpload({ ...upload, chapterId: e.target.value })} disabled={!upload.subjectId} style={s("width:100%;background:var(--card);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none;cursor:pointer")}><option value="">{upChapters.length ? "Select chapter" : "No chapters"}</option>{upChapters.map((ch) => (<option key={ch.id} value={ch.id}>{ch.title}</option>))}</select></div>
            </div>
            <div style={s("margin-bottom:22px")}><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Title</label><input className="h-input" value={upload.title} onChange={(e) => setUpload({ ...upload, title: e.target.value })} placeholder="e.g. Normalization & Keys" style={s("width:100%;background:var(--card);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none")} /></div>
            {!liveCourses.length && <div style={s("font:500 12px Manrope;color:var(--amber);margin-bottom:14px")}>Sign in as a teacher to upload — courses could not be loaded.</div>}
            <div style={s("display:flex;gap:10px;justify-content:flex-end")}>
              <button onClick={() => { setUploadOpen(false); resetUpload(); }} style={s("padding:11px 18px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--muted);font:600 13px Manrope;cursor:pointer")}>Cancel</button>
              <button className="h-primary" onClick={submitUpload} disabled={uploadBusy} style={s(`padding:11px 20px;border-radius:10px;border:none;background:var(--accent);color:#fff;font:600 13px Manrope;cursor:${uploadBusy ? "default" : "pointer"};opacity:${uploadBusy ? ".65" : "1"}`)}>{uploadBusy ? "Uploading…" : "Upload material"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= QUIZ MODAL ================= */}
      {quizOpen && (
        <div onClick={() => setQuizOpen(false)} style={s("position:fixed;inset:0;background:rgba(6,10,20,.66);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:50;animation:fadeIn .15s ease")}>
          <div onClick={(e) => e.stopPropagation()} style={s("width:600px;max-width:94vw;max-height:88vh;overflow-y:auto;background:var(--bg2);border:1px solid var(--border2);border-radius:18px;padding:26px;animation:popIn .22s cubic-bezier(.2,.8,.3,1)")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:20px")}>
              <div><div style={s("font:700 18px Poppins")}>{editingQuizId != null ? "Edit quiz" : "Create a quiz"}</div><div style={s("font:500 12.5px Manrope;color:var(--faint);margin-top:2px")}>{editingQuizId != null ? "Update this quiz's details" : "Build an MCQ quiz for a chapter"}</div></div>
              <button onClick={() => { setEditingQuizId(null); setQuizOpen(false); }} style={s("width:34px;height:34px;border-radius:9px;border:1px solid var(--border);background:var(--card);color:var(--muted);cursor:pointer;font-size:18px")}>✕</button>
            </div>
            <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px")}>
              <div style={s("grid-column:1/3")}><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Quiz title</label><input className="h-input" value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} placeholder="e.g. Chapter 3 · Normalization" style={s("width:100%;background:var(--card);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none")} /></div>
              <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Course</label><select value={quiz.course} onChange={(e) => setQuiz({ ...quiz, course: e.target.value })} style={s("width:100%;background:var(--card);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none;cursor:pointer")}><option>BCSIT</option><option>BBA</option><option>BHM</option></select></div>
              <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Subject</label><input className="h-input" value={quiz.subject} onChange={(e) => setQuiz({ ...quiz, subject: e.target.value })} placeholder="e.g. Database Management" style={s("width:100%;background:var(--card);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none")} /></div>
            </div>
            {editingQuizId != null && (
              <div style={s("display:flex;gap:10px;background:var(--accent-soft);border:1px solid var(--border2);border-radius:11px;padding:12px 14px;margin:6px 0 4px;font:500 12.5px Manrope;color:var(--muted)")}>
                Editing quiz details — questions & attempts are kept as they are.
              </div>
            )}
            {editingQuizId == null && (
            <>
            <div style={s("display:flex;align-items:center;justify-content:space-between;margin:18px 0 12px")}><div style={s("font:700 13px Poppins")}>Questions</div><div style={s("font:600 12px Manrope;color:var(--faint)")}>{quiz.questions.length} added</div></div>
            <div style={s("display:flex;flex-direction:column;gap:12px;margin-bottom:14px")}>
              {quiz.questions.map((qq, i) => (
                <div key={i} style={s("background:var(--card);border:1px solid var(--border);border-radius:12px;padding:15px")}>
                  <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:11px")}>
                    <div style={s("width:24px;height:24px;border-radius:7px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;font:700 12px Poppins;flex:none")}>{i + 1}</div>
                    <input className="h-input" value={qq.q} onChange={(e) => setQ(i, e.target.value)} placeholder="Type the question…" style={s("flex:1;background:var(--bg2);border:1px solid var(--border2);border-radius:9px;padding:9px 12px;color:var(--text);font:500 13px Manrope;outline:none")} />
                    <button className="h-del" onClick={() => removeQuestion(i)} style={s("width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--muted);cursor:pointer;flex:none")}>✕</button>
                  </div>
                  <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:8px")}>
                    {[0, 1, 2, 3].map((oi) => (
                      <div key={oi} style={s("display:flex;align-items:center;gap:8px")}>
                        <span onClick={() => setCorrect(i, oi)} style={s(`width:9px;height:9px;border-radius:50%;background:${qq.correct === oi ? "var(--green)" : "rgba(148,163,184,.3)"};flex:none;cursor:pointer`)} />
                        <input value={qq.opts[oi]} onChange={(e) => setOpt(i, oi, e.target.value)} onClick={() => setCorrect(i, oi)} placeholder={oi === 0 ? "Option A (click dot = correct)" : `Option ${String.fromCharCode(65 + oi)}`} style={s("flex:1;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:8px 10px;color:var(--text);font:500 12.5px Manrope;outline:none")} />
                      </div>
                    ))}
                  </div>
                  <div style={s("font:500 11px Manrope;color:var(--faint);margin-top:9px")}>Click a dot to mark the correct answer.</div>
                </div>
              ))}
            </div>
            <button className="h-qa" onClick={addQuestion} style={s("width:100%;padding:11px;border-radius:10px;border:1.5px dashed var(--border2);background:transparent;color:var(--accent);font:600 13px Manrope;cursor:pointer;margin-bottom:20px")}>+ Add question</button>
            </>
            )}
            <div style={s("display:flex;gap:10px;justify-content:flex-end")}>
              <button onClick={() => { setEditingQuizId(null); setQuizOpen(false); }} style={s("padding:11px 18px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--muted);font:600 13px Manrope;cursor:pointer")}>Cancel</button>
              <button className="h-primary" onClick={submitQuiz} style={s("padding:11px 20px;border-radius:10px;border:none;background:var(--accent);color:#fff;font:600 13px Manrope;cursor:pointer")}>{editingQuizId != null ? "Save changes" : "Publish quiz"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ANNOUNCEMENT MODAL ================= */}
      {annOpen && (
        <div onClick={() => setAnnOpen(false)} style={s("position:fixed;inset:0;background:rgba(6,10,20,.66);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:50;animation:fadeIn .15s ease")}>
          <div onClick={(e) => e.stopPropagation()} style={s("width:520px;max-width:92vw;background:var(--bg2);border:1px solid var(--border2);border-radius:18px;padding:26px;animation:popIn .22s cubic-bezier(.2,.8,.3,1)")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:20px")}>
              <div><div style={s("font:700 18px Poppins")}>New announcement</div><div style={s("font:500 12.5px Manrope;color:var(--faint);margin-top:2px")}>Share an update with your students</div></div>
              <button onClick={() => setAnnOpen(false)} style={s("width:34px;height:34px;border-radius:9px;border:1px solid var(--border);background:var(--card);color:var(--muted);cursor:pointer;font-size:18px")}>✕</button>
            </div>
            <div style={s("display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:14px")}>
              <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Title</label><input className="h-input" value={ann.title} onChange={(e) => setAnn({ ...ann, title: e.target.value })} placeholder="e.g. Mid-term quiz schedule" style={s("width:100%;background:var(--card);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none")} /></div>
              <div><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Course</label><select value={ann.course} onChange={(e) => setAnn({ ...ann, course: e.target.value })} style={s("width:100%;background:var(--card);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none;cursor:pointer")}><option>BCSIT</option><option>BBA</option><option>BHM</option><option>All</option></select></div>
            </div>
            <div style={s("margin-bottom:22px")}><label style={s("font:600 12px Manrope;color:var(--muted);display:block;margin-bottom:7px")}>Message</label><textarea className="h-input" value={ann.body} onChange={(e) => setAnn({ ...ann, body: e.target.value })} rows={4} placeholder="Write your announcement…" style={s("width:100%;background:var(--card);border:1px solid var(--border2);border-radius:10px;padding:11px 13px;color:var(--text);font:500 14px Manrope;outline:none;resize:vertical")} /></div>
            <div style={s("display:flex;gap:10px;justify-content:flex-end")}>
              <button onClick={() => setAnnOpen(false)} style={s("padding:11px 18px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--muted);font:600 13px Manrope;cursor:pointer")}>Cancel</button>
              <button className="h-primary" onClick={submitAnn} style={s("padding:11px 20px;border-radius:10px;border:none;background:var(--accent);color:#fff;font:600 13px Manrope;cursor:pointer")}>Post announcement</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOAST ================= */}
      {toast && (
        <div style={s("position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:11px;background:var(--card2);border:1px solid var(--border2);border-radius:12px;padding:13px 18px;box-shadow:0 12px 40px rgba(0,0,0,.4);animation:slideUp .25s ease")}>
          <div style={s("width:24px;height:24px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;flex:none")}><I w={14} sw={3} stroke="#fff"><path d="M20 6L9 17l-5-5" /></I></div>
          <span style={s("font:600 13.5px Manrope")}>{toast}</span>
        </div>
      )}
    </div>
  );
}

/* --------------------------- scoped styles --------------------------- */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap');
/* Light palette (default) — matches the site's light theme. */
.tdscope{
  --bg:#f6f7fb; --bg2:#eef1f7; --sidebar:#ffffff; --card:#ffffff; --card2:#ffffff;
  --border:rgba(15,23,42,.09); --border2:rgba(15,23,42,.16);
  --text:#1e293b; --muted:#5a6b82; --faint:#8695a9;
  --accent:#4f86c6; --accent-h:#3f6fac; --accent-soft:rgba(79,134,198,.12);
  --green:#3f9a76; --green-soft:rgba(63,154,118,.13);
  --amber:#b7902f; --amber-soft:rgba(183,144,47,.14);
  --red:#c9534d; --red-soft:rgba(201,83,77,.12);
  --topbar:rgba(255,255,255,.72);
  color:var(--text);-webkit-font-smoothing:antialiased;
  transition:background-color .3s ease,color .3s ease;
}
/* Dark palette — near-black cards on a slate-950 base, like the admin panel. */
.dark .tdscope{
  --bg:#060910; --bg2:#0d1421; --sidebar:#080c15; --card:#0f1626; --card2:#141d2e;
  --border:rgba(148,163,184,.11); --border2:rgba(148,163,184,.19);
  --text:#eef2f8; --muted:#94a3b8; --faint:#5f6d80;
  --accent:#4f86c6; --accent-h:#5f97d8; --accent-soft:rgba(79,134,198,.16);
  --green:#22c55e; --green-soft:rgba(34,197,94,.15);
  --amber:#f59e0b; --amber-soft:rgba(245,158,11,.15);
  --red:#ef4444; --red-soft:rgba(239,68,68,.15);
  --topbar:rgba(6,9,16,.72);
}
.tdscope *{box-sizing:border-box}
.tdscope a{color:var(--accent);text-decoration:none}
.tdscope a:hover{color:var(--accent-h)}
.tdscope ::-webkit-scrollbar{width:10px;height:10px}
.tdscope ::-webkit-scrollbar-thumb{background:rgba(148,163,184,.18);border-radius:8px;border:2px solid var(--bg)}
.tdscope ::-webkit-scrollbar-thumb:hover{background:rgba(148,163,184,.3)}
.tdscope input::placeholder,.tdscope textarea::placeholder{color:var(--faint)}
.tdscope .h-primary:hover{background:var(--accent-h)!important}
.tdscope .h-bell:hover{border-color:var(--border2)!important}
.tdscope .h-row:hover{background:var(--bg2)!important}
.tdscope .h-qa:hover{border-color:var(--accent)!important;background:var(--accent-soft)!important}
.tdscope .h-accent:hover{border-color:var(--accent)!important;color:var(--accent)!important}
.tdscope .h-del:hover{border-color:var(--red)!important;color:var(--red)!important}
.tdscope .h-drop:hover{border-color:var(--accent)!important}
.tdscope .h-input:focus{border-color:var(--accent)!important}
.tdscope .h-search:focus-within{border-color:var(--accent)!important}
/* subtle motion — gentle card lift + staggered entrance for the stat row */
.tdscope .h-card{transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.tdscope .h-card:hover{border-color:var(--border2)!important;transform:translateY(-3px);box-shadow:0 12px 30px rgba(2,6,20,.14)}
.tdscope .h-stat{animation:fadeUp .5s cubic-bezier(.2,.7,.3,1) both;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.tdscope .h-stat:hover{transform:translateY(-3px);border-color:var(--border2)!important;box-shadow:0 12px 30px rgba(2,6,20,.14)}
.tdscope .h-stat:nth-child(1){animation-delay:.03s}
.tdscope .h-stat:nth-child(2){animation-delay:.1s}
.tdscope .h-stat:nth-child(3){animation-delay:.17s}
.tdscope .h-stat:nth-child(4){animation-delay:.24s}
.tdscope .h-row{transition:background .15s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes popIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){
  .tdscope .h-stat{animation:none}
  .tdscope .h-card:hover,.tdscope .h-stat:hover{transform:none}
}
`;
