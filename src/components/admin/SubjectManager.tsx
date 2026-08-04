"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useSortable } from "@/hooks/useSortable";
import { SortableHead } from "./SortableHead";
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

interface Course {
  id: string;
  name: string;
}

interface Semester {
  id: number;
  name: string;
  courseId: string;
  course: { name: string };
}

interface Subject {
  id: string;
  title: string;
  description: string;
  icon: string;
  semesterId: number;
  semester: { name: string };
  _count: { chapters: number };
}

export function SubjectManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formId, setFormId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formSemesterId, setFormSemesterId] = useState("");

  // Derived: semesters filtered by selected course
  const filteredSemesters =
    filterCourse && filterCourse !== "all"
      ? semesters.filter((sem) => sem.courseId === filterCourse)
      : semesters;

  // Filter displayed subjects by course if no semester filter
  const displayedSubjects =
    filterCourse !== "all" && filterSemester === "all"
      ? subjects.filter((sub) =>
          filteredSemesters.some((sem) => sem.id === sub.semesterId)
        )
      : subjects;

  const { sorted, sortKey, sortDir, requestSort } = useSortable<Subject>(
    displayedSubjects,
    {
      title: (s) => s.title,
      description: (s) => s.description,
      semester: (s) => s.semester?.name ?? "",
      chapters: (s) => s._count.chapters,
    },
    "title"
  );

  const fetchSemesters = async () => {
    try {
      const res = await fetch("/api/admin/semesters");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSemesters(data);
    } catch {
      toast.error("Failed to load semesters");
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/admin/courses");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCourses(data);
    } catch {
      toast.error("Failed to load courses");
    }
  };

  const fetchSubjects = async () => {
    try {
      const url =
        filterSemester && filterSemester !== "all"
          ? `/api/admin/subjects?semesterId=${filterSemester}`
          : "/api/admin/subjects";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubjects(data);
    } catch {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
    fetchCourses();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSemester]);

  // Reset semester filter when course filter changes
  useEffect(() => {
    setFilterSemester("all");
  }, [filterCourse]);

  const openAdd = () => {
    setEditing(null);
    setFormId("");
    setFormTitle("");
    setFormDescription("");
    setFormIcon("");
    setFormSemesterId(
      filteredSemesters.length > 0 ? String(filteredSemesters[0].id) : ""
    );
    setDialogOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setEditing(subject);
    setFormId(subject.id);
    setFormTitle(subject.title);
    setFormDescription(subject.description);
    setFormIcon(subject.icon);
    setFormSemesterId(String(subject.semesterId));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (
      !formId.trim() ||
      !formTitle.trim() ||
      !formDescription.trim() ||
      !formIcon.trim() ||
      !formSemesterId
    ) {
      toast.error("All fields are required");
      return;
    }

    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const res = await fetch("/api/admin/subjects", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formId.trim(),
          title: formTitle.trim(),
          description: formDescription.trim(),
          icon: formIcon.trim(),
          semesterId: formSemesterId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(editing ? "Subject updated" : "Subject created");
      setDialogOpen(false);
      fetchSubjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`Delete subject "${subject.title}"? This cannot be undone.`))
      return;

    try {
      const res = await fetch(`/api/admin/subjects?id=${subject.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }

      toast.success("Subject deleted");
      fetchSubjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-gray-500">Loading subjects...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Subjects</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSemester} onValueChange={setFilterSemester}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                {filteredSemesters.map((sem) => (
                  <SelectItem key={sem.id} value={String(sem.id)}>
                    {sem.course.name} — {sem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={openAdd} className="gap-1.5">
              <Plus size={14} /> Add Subject
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {displayedSubjects.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No subjects found.{" "}
              {filterCourse !== "all" || filterSemester !== "all"
                ? "Try a different filter or add a new subject."
                : "Add one to get started."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <SortableHead label="Title" sortKey="title" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
                  <SortableHead label="Description" sortKey="description" activeKey={sortKey} dir={sortDir} onSort={requestSort} className="hidden md:table-cell" />
                  <SortableHead label="Semester" sortKey="semester" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
                  <SortableHead label="Chapters" sortKey="chapters" activeKey={sortKey} dir={sortDir} onSort={requestSort} />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="text-xl">{subject.icon}</TableCell>
                    <TableCell className="font-medium">
                      {subject.title}
                      <span className="block text-xs text-gray-400 font-mono">
                        {subject.id}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-gray-500 text-sm">
                      {subject.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{subject.semester.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {subject._count.chapters} ch.
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(subject)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(subject)}
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
              {editing ? "Edit Subject" : "Add Subject"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sub-id">Subject ID (slug)</Label>
              <Input
                id="sub-id"
                placeholder="e.g. financial-accounting"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                disabled={!!editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-title">Title</Label>
              <Input
                id="sub-title"
                placeholder="e.g. Financial Accounting"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-desc">Description</Label>
              <Textarea
                id="sub-desc"
                placeholder="Brief description of the subject"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sub-icon">Icon (emoji)</Label>
                <Input
                  id="sub-icon"
                  placeholder="e.g. 📊"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-semester">Semester</Label>
                <Select
                  value={formSemesterId}
                  onValueChange={setFormSemesterId}
                >
                  <SelectTrigger id="sub-semester">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => (
                      <SelectItem key={sem.id} value={String(sem.id)}>
                        {sem.course.name} — {sem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
