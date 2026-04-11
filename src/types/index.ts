export interface CourseData {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  semesters: CourseSemester[];
}

export interface CourseSemester {
  id: number;
  name: string;
  courseId: string;
  _count: { subjects: number };
}

export interface SubjectWithChapters {
  id: string;
  title: string;
  description: string;
  icon: string;
  semesterId: number;
  chapters: ChapterSummary[];
}

export interface TeacherPdfSummary {
  id: string;
  title: string;
  filePath: string;
}

export interface ChapterSummary {
  id: string;
  title: string;
  pdfPath: string;
  orderIndex: number;
  teacherPdfs?: TeacherPdfSummary[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  answer: string;
  orderIndex: number;
}

export interface ChapterProgress {
  visited: boolean;
  quizCompleted: boolean;
  quizScore: number;
}

export interface SubjectProgressData {
  progress: number;
  chapters: Record<string, ChapterProgress>;
}

export interface SemesterProgressData {
  progress: number;
  name: string;
  subjects: Record<string, SubjectProgressData>;
}

export interface CourseProgressData {
  progress: number;
  name: string;
  icon: string;
  slug: string;
  semesters: Record<number, SemesterProgressData>;
}

export interface ProgressData {
  courses: Record<string, CourseProgressData>;
  totalProgress: number;
  lastVisited: { chapterId: string; timestamp: string } | null;
}

export interface SearchResult {
  type: "subject" | "chapter";
  id: string;
  title: string;
  semesterId: number;
  subjectId?: string;
  subjectTitle?: string;
}

// ===== NEW ADMIN TYPES =====

// User roles — matches the Prisma Role enum exactly
export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

// User data returned by admin APIs
export interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Site settings editable from admin panel
export interface SiteSettingsData {
  collegeName: string;
  tagline: string;
  heroText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  logoUrl: string;
}

// Contact message with admin-specific fields
export interface ContactMessageData {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  user?: { name: string | null; email: string } | null;
}

// Analytics data for admin dashboard
export interface AnalyticsData {
  totalUsers: number;
  totalSubjects: number;
  totalChapters: number;
  totalQuestions: number;
  unreadMessages: number;
  averageQuizScore: number;
  recentUsers: { id: string; name: string | null; email: string; role: UserRole; createdAt: string }[];
  recentActivity: {
    id: string;
    visited: boolean;
    quizCompleted: boolean;
    quizScore: number;
    updatedAt: string;
    user: { name: string | null; email: string };
    chapter: { title: string; subject: { title: string } };
  }[];
}

// ===== EXISTING TYPES =====

export interface TeacherPdfData {
  id: string;
  title: string;
  filePath: string;
  chapterId: string;
  createdAt: string;
  chapter: {
    title: string;
    subject: {
      title: string;
    };
  };
}
