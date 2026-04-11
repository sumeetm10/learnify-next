"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Semester {
  id: number;
  name: string;
}

interface Subject {
  id: string;
  title: string;
  semesterId: number;
}

interface Chapter {
  id: string;
  title: string;
  pdfPath: string;
  orderIndex: number;
  subjectId: string;
  subject: { title: string; semesterId: number };
  _count: { questions: number };
}

export function ChapterManager() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Chapter | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  // Form state
  const [formId, setFormId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formOrderIndex, setFormOrderIndex] = useState("1");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived: subjects filtered by selected semester
  const filteredSubjects =
    filterSemester && filterSemester !== "all"
      ? subjects.filter((s) => s.semesterId === parseInt(filterSemester))
      : subjects;

  const fetchSemesters = async () => {
    try {
      const res = await fetch("/api/admin/semesters");
      if (!res.ok) throw new Error("Failed to fetch");
      setSemesters(await res.json());
    } catch {
      toast.error("Failed to load semesters");
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/admin/subjects");
      if (!res.ok) throw new Error("Failed to fetch");
      setSubjects(await res.json());
    } catch {
      toast.error("Failed to load subjects");
    }
  };

  const fetchChapters = async () => {
    try {
      const url =
        filterSubject && filterSubject !== "all"
          ? `/api/admin/chapters?subjectId=${filterSubject}`
          : "/api/admin/chapters";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      setChapters(await res.json());
    } catch {
      toast.error("Failed to load chapters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
    fetchSubjects();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSubject]);

  // Reset subject filter when semester filter changes
  useEffect(() => {
    setFilterSubject("all");
  }, [filterSemester]);

  const openAdd = () => {
    setEditing(null);
    setFormId("");
    setFormTitle("");
    setFormSubjectId(filteredSubjects.length > 0 ? filteredSubjects[0].id : "");
    setFormOrderIndex("1");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDialogOpen(true);
  };

  const openEdit = (chapter: Chapter) => {
    setEditing(chapter);
    setFormId(chapter.id);
    setFormTitle(chapter.title);
    setFormSubjectId(chapter.subjectId);
    setFormOrderIndex(String(chapter.orderIndex));
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formId.trim() || !formTitle.trim() || !formSubjectId) {
      toast.error("ID, title, and subject are required");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("id", formId.trim());
      formData.append("title", formTitle.trim());
      formData.append("subjectId", formSubjectId);
      formData.append("orderIndex", formOrderIndex || "1");

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formData.append("file", file);
      }

      const method = editing ? "PATCH" : "POST";
      const res = await fetch("/api/admin/chapters", {
        method,
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(editing ? "Chapter updated" : "Chapter created");
      setDialogOpen(false);
      fetchChapters();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chapter: Chapter) => {
    if (
      !confirm(
        `Delete chapter "${chapter.title}"? This will also delete all its questions and progress records.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/chapters?id=${chapter.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }

      toast.success("Chapter deleted");
      fetchChapters();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // Filter displayed chapters by semester if no subject filter
  const displayedChapters =
    filterSemester && filterSemester !== "all" && filterSubject === "all"
      ? chapters.filter(
          (ch) => ch.subject.semesterId === parseInt(filterSemester)
        )
      : chapters;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-gray-500">Loading chapters...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Chapters</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterSemester} onValueChange={setFilterSemester}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                {semesters.map((sem) => (
                  <SelectItem key={sem.id} value={String(sem.id)}>
                    {sem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {filteredSubjects.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={openAdd} className="gap-1.5">
              <Plus size={14} /> Add Chapter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {displayedChapters.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No chapters found. Adjust filters or add a new chapter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="hidden md:table-cell">
                    PDF Path
                  </TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedChapters.map((chapter) => (
                  <TableRow key={chapter.id}>
                    <TableCell className="font-medium">
                      {chapter.title}
                      <span className="block text-xs text-gray-400 font-mono">
                        {chapter.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{chapter.subject.title}</Badge>
                    </TableCell>
                    <TableCell>{chapter.orderIndex}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[180px] truncate text-gray-500 text-xs font-mono">
                      {chapter.pdfPath}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {chapter._count.questions} Q
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(chapter)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(chapter)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Chapter" : "Add Chapter"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ch-id">Chapter ID (slug)</Label>
              <Input
                id="ch-id"
                placeholder="e.g. intro-to-accounting"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                disabled={!!editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ch-title">Title</Label>
              <Input
                id="ch-title"
                placeholder="e.g. Introduction to Accounting"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ch-subject">Subject</Label>
                <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                  <SelectTrigger id="ch-subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ch-order">Order Index</Label>
                <Input
                  id="ch-order"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formOrderIndex}
                  onChange={(e) => setFormOrderIndex(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ch-pdf">
                PDF File{editing ? " (leave empty to keep current)" : ""}
              </Label>
              <Input
                id="ch-pdf"
                type="file"
                accept=".pdf"
                ref={fileInputRef}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
