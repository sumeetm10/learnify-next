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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Course {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  _count: { semesters: number };
}

export function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("");

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/admin/courses");
      if (!res.ok) throw new Error("Failed to fetch");
      setCourses(await res.json());
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormId("");
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormIcon("");
    setDialogOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setFormId(course.id);
    setFormName(course.name);
    setFormSlug(course.slug);
    setFormDescription(course.description);
    setFormIcon(course.icon);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formId.trim() || !formName.trim() || !formSlug.trim() || !formDescription.trim() || !formIcon.trim()) {
      toast.error("All fields are required");
      return;
    }

    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const res = await fetch("/api/admin/courses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formId.trim(),
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim(),
          icon: formIcon.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(editing ? "Course updated" : "Course created");
      setDialogOpen(false);
      fetchCourses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`Delete course "${course.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/courses?id=${course.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      toast.success("Course deleted");
      fetchCourses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-gray-500">Loading courses...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Courses</CardTitle>
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus size={14} /> Add Course
          </Button>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No courses yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Semesters</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="text-xl">{course.icon}</TableCell>
                    <TableCell className="font-medium">
                      {course.name}
                      <span className="block text-xs text-gray-400 font-mono">{course.slug}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-gray-500 text-sm">
                      {course.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {course._count.semesters} sem.
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(course)}>
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(course)}
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
            <DialogTitle>{editing ? "Edit Course" : "Add Course"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course-id">Course ID</Label>
                <Input
                  id="course-id"
                  placeholder="e.g. bba"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  disabled={!!editing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-slug">Slug (URL)</Label>
                <Input
                  id="course-slug"
                  placeholder="e.g. bba"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course-name">Name</Label>
                <Input
                  id="course-name"
                  placeholder="e.g. BBA"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-icon">Icon (emoji)</Label>
                <Input
                  id="course-icon"
                  placeholder="e.g. 📊"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-desc">Description</Label>
              <Textarea
                id="course-desc"
                placeholder="Brief description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
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
