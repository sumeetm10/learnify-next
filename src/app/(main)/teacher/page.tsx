"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Trash2, Eye, LogOut, Search } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { SubjectWithChapters, TeacherPdfData, CourseData } from "@/types";

export default function TeacherPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithChapters[]>([]);
  const [pdfs, setPdfs] = useState<TeacherPdfData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch courses
  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => setCourses(data.courses || []))
      .catch(() => toast.error("Failed to load courses"));
  }, []);

  // Fetch subjects
  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then((data) => setSubjects(data.subjects || []))
      .catch(() => toast.error("Failed to load subjects"));
  }, []);

  // Fetch teacher PDFs
  const fetchPdfs = useCallback(() => {
    fetch("/api/teacher/pdfs")
      .then((r) => r.json())
      .then((data) => setPdfs(data.pdfs || []))
      .catch(() => toast.error("Failed to load PDFs"));
  }, []);

  useEffect(() => {
    fetchPdfs();
  }, [fetchPdfs]);

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);
  const courseSemesters = selectedCourseData?.semesters || [];

  const filteredSubjects = selectedSemester
    ? subjects.filter((s) => s.semesterId === parseInt(selectedSemester))
    : [];

  const selectedSubjectData = subjects.find((s) => s.id === selectedSubject);
  const chapters = selectedSubjectData?.chapters || [];

  const filteredPdfs = searchTerm
    ? pdfs.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.chapter.subject.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      )
    : pdfs;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !selectedChapter) {
      toast.error("Please fill all fields");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }
    const MAX_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      toast.error("PDF must be smaller than 10 MB.");
      return;
    }
    if (file.size === 0) {
      toast.error("The selected file is empty.");
      return;
    }
    if (file.name.length > 100) {
      toast.error("Filename is too long.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("File must have a .pdf extension.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("chapterId", selectedChapter);

    try {
      const res = await fetch("/api/teacher/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("PDF uploaded successfully!");
        setTitle("");
        setFile(null);
        setSelectedChapter("");
        fetchPdfs();
        // Reset file input
        const fileInput = document.getElementById(
          "pdfFile",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } catch {
      toast.error("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, pdfTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${pdfTitle}"?`)) return;

    try {
      const res = await fetch(`/api/teacher/pdfs?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("PDF deleted successfully!");
        fetchPdfs();
      } else {
        toast.error("Failed to delete PDF.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        {/* Breadcrumb & Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/" className="hover:text-[#427da6]">
                Home
              </Link>{" "}
              &gt; Teacher Dashboard
            </div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Welcome, {session?.user?.name || session?.user?.email}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="gap-2"
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload size={16} />
              Upload PDFs
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <FileText size={16} />
              Manage PDFs
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload a New PDF</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Select
                        value={selectedCourse}
                        onValueChange={(v) => {
                          setSelectedCourse(v);
                          setSelectedSemester("");
                          setSelectedSubject("");
                          setSelectedChapter("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.icon} {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Semester</Label>
                      <Select
                        value={selectedSemester}
                        onValueChange={(v) => {
                          setSelectedSemester(v);
                          setSelectedSubject("");
                          setSelectedChapter("");
                        }}
                        disabled={!selectedCourse}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {courseSemesters.map((sem) => (
                            <SelectItem key={sem.id} value={String(sem.id)}>
                              {sem.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select
                        value={selectedSubject}
                        onValueChange={(v) => {
                          setSelectedSubject(v);
                          setSelectedChapter("");
                        }}
                        disabled={!selectedSemester}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredSubjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Chapter</Label>
                    <Select
                      value={selectedChapter}
                      onValueChange={setSelectedChapter}
                      disabled={!selectedSubject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pdfTitle">PDF Title</Label>
                    <Input
                      id="pdfTitle"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a title for the PDF"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pdfFile">PDF File</Label>
                    <Input
                      id="pdfFile"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#427da6] hover:bg-[#356a8a] gap-2"
                    disabled={uploading}
                  >
                    <Upload size={18} />
                    {uploading ? "Uploading..." : "Upload PDF"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Uploaded PDFs ({pdfs.length})</CardTitle>
                  <div className="relative w-64">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <Input
                      placeholder="Search PDFs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredPdfs.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {searchTerm
                      ? "No PDFs match your search."
                      : "No PDFs uploaded yet."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredPdfs.map((pdf) => (
                      <div
                        key={pdf.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText
                            size={20}
                            className="text-[#427da6] flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {pdf.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {pdf.chapter.subject.title} &bull;{" "}
                              {pdf.chapter.title} &bull;{" "}
                              {new Date(pdf.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(pdf.filePath, "_blank")}
                            className="gap-1"
                          >
                            <Eye size={14} />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(pdf.id, pdf.title)}
                            className="gap-1 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
