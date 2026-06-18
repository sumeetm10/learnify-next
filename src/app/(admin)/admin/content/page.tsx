"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Layers, BookOpen, FileText, HelpCircle } from "lucide-react";
import { CourseManager } from "@/components/admin/CourseManager";
import { SemesterManager } from "@/components/admin/SemesterManager";
import { SubjectManager } from "@/components/admin/SubjectManager";
import { ChapterManager } from "@/components/admin/ChapterManager";
import { QuestionManager } from "@/components/admin/QuestionManager";

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage courses, semesters, subjects, chapters, and quiz questions
        </p>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses" className="gap-1.5">
            <GraduationCap size={14} /> Courses
          </TabsTrigger>
          <TabsTrigger value="semesters" className="gap-1.5">
            <Layers size={14} /> Semesters
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-1.5">
            <BookOpen size={14} /> Subjects
          </TabsTrigger>
          <TabsTrigger value="chapters" className="gap-1.5">
            <FileText size={14} /> Chapters
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-1.5">
            <HelpCircle size={14} /> Questions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="courses">
          <CourseManager />
        </TabsContent>
        <TabsContent value="semesters">
          <SemesterManager />
        </TabsContent>
        <TabsContent value="subjects">
          <SubjectManager />
        </TabsContent>
        <TabsContent value="chapters">
          <ChapterManager />
        </TabsContent>
        <TabsContent value="questions">
          <QuestionManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
