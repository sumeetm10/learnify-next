"use client";

import { useState } from "react";
import { ArrowLeft, FileText, BookOpen, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SubjectWithChapters } from "@/types";

interface Props {
  subject: SubjectWithChapters;
  onBack: () => void;
  onOpenPdf: (path: string, title: string) => void;
  onOpenQuiz: (chapterId: string, title: string) => void;
}

export function SubjectView({ subject, onBack, onOpenPdf, onOpenQuiz }: Props) {
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  const selectedChapter = subject.chapters.find((c) => c.id === selectedChapterId);
  const teacherPdfs = selectedChapter?.teacherPdfs || [];
  const hasTeacherPdfs = teacherPdfs.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#427da6] hover:text-[#356a8a] mb-6 font-medium transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Subjects
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{subject.icon}</span>
          <div>
            <h2 className="text-2xl font-bold">{subject.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{subject.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select a Chapter</label>
          <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a chapter..." />
            </SelectTrigger>
            <SelectContent>
              {subject.chapters.map((chapter) => (
                <SelectItem key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedChapter && (
            <div className="space-y-4 pt-4">
              {/* Teacher-uploaded PDFs (shown first — these are the real uploaded materials) */}
              {hasTeacherPdfs && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Upload size={14} />
                    Study Materials ({teacherPdfs.length})
                  </p>
                  {teacherPdfs.map((pdf) => (
                    <Button
                      key={pdf.id}
                      onClick={() => onOpenPdf(pdf.filePath, pdf.title)}
                      className="w-full bg-[#427da6] hover:bg-[#356a8a] gap-2 justify-start"
                    >
                      <FileText size={18} />
                      {pdf.title}
                    </Button>
                  ))}
                </div>
              )}

              {/* Fallback: Show nothing helpful if no PDFs at all */}
              {!hasTeacherPdfs && (
                <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm border border-dashed dark:border-slate-700 rounded-lg">
                  <FileText size={24} className="mx-auto mb-2 opacity-50" />
                  No study materials uploaded for this chapter yet.
                </div>
              )}

              {/* Quiz button — always available */}
              <Button
                onClick={() => onOpenQuiz(selectedChapter.id, selectedChapter.title)}
                variant="outline"
                className="w-full border-[#427da6] text-[#427da6] hover:bg-[#427da6]/10 gap-2"
              >
                <BookOpen size={18} />
                Take Quiz
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
