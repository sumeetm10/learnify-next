"use client";

import { useState } from "react";
import { SubjectGrid } from "./SubjectGrid";
import { SubjectView } from "./SubjectView";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { QuizModal } from "@/components/quiz/QuizModal";
import type { SubjectWithChapters } from "@/types";

interface Props {
  subjects: SubjectWithChapters[];
  semesterId: number;
}

export function SemesterClient({ subjects, semesterId }: Props) {
  const [selectedSubject, setSelectedSubject] = useState<SubjectWithChapters | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfPath, setPdfPath] = useState("");
  const [pdfTitle, setPdfTitle] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizChapterId, setQuizChapterId] = useState("");
  const [quizChapterTitle, setQuizChapterTitle] = useState("");

  const handleOpenPdf = (path: string, title: string) => {
    setPdfPath(path);
    setPdfTitle(title);
    setPdfOpen(true);
    // Mark as visited — match by pdfPath OR by teacherPdf filePath
    const chapter = selectedSubject?.chapters.find(c =>
      c.pdfPath === path || c.teacherPdfs?.some(tp => tp.filePath === path)
    );
    if (chapter) {
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id, action: "visit" }),
      });
    }
  };

  const handleOpenQuiz = (chapterId: string, chapterTitle: string) => {
    setQuizChapterId(chapterId);
    setQuizChapterTitle(chapterTitle);
    setQuizOpen(true);
  };

  if (selectedSubject) {
    return (
      <>
        <SubjectView
          subject={selectedSubject}
          onBack={() => setSelectedSubject(null)}
          onOpenPdf={handleOpenPdf}
          onOpenQuiz={handleOpenQuiz}
        />
        <PdfViewer
          open={pdfOpen}
          onClose={() => setPdfOpen(false)}
          pdfPath={pdfPath}
          title={pdfTitle}
        />
        <QuizModal
          open={quizOpen}
          onClose={() => setQuizOpen(false)}
          chapterId={quizChapterId}
          chapterTitle={quizChapterTitle}
        />
      </>
    );
  }

  return <SubjectGrid subjects={subjects} onSelect={setSelectedSubject} />;
}
