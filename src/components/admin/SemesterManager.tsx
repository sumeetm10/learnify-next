"use client";

import { useEffect, useState } from "react";
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

interface Course {
  id: string;
  name: string;
}

interface Semester {
  id: number;
  name: string;
  courseId: string;
  course: { name: string };
  _count: { subjects: number };
}

export function SemesterManager() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Semester | null>(null);
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formCourseId, setFormCourseId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [semRes, courseRes] = await Promise.all([
        fetch("/api/admin/semesters"),
        fetch("/api/admin/courses"),
      ]);
      if (!semRes.ok || !courseRes.ok) throw new Error("Failed to fetch");
      setSemesters(await semRes.json());
      setCourses(await courseRes.json());
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormId("");
    setFormName("");
    setFormCourseId(courses.length > 0 ? courses[0].id : "");
    setDialogOpen(true);
  };

  const openEdit = (semester: Semester) => {
    setEditing(semester);
    setFormId(String(semester.id));
    setFormName(semester.name);
    setFormCourseId(semester.courseId);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCourseId) {
      toast.error("Name and course are required");
      return;
    }

    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const res = await fetch("/api/admin/semesters", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formId || undefined,
          name: formName.trim(),
          courseId: formCourseId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(editing ? "Semester updated" : "Semester created");
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (semester: Semester) => {
    if (!confirm(`Delete semester "${semester.name}"? This cannot be undone.`))
      return;

    try {
      const res = await fetch(`/api/admin/semesters?id=${semester.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }

      toast.success("Semester deleted");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-gray-500">Loading semesters...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Semesters</CardTitle>
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus size={14} /> Add Semester
          </Button>
        </CardHeader>
        <CardContent>
          {semesters.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No semesters yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semesters.map((semester) => (
                  <TableRow key={semester.id}>
                    <TableCell className="font-mono text-sm">
                      {semester.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {semester.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{semester.course.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {semester._count.subjects} subject
                        {semester._count.subjects !== 1 ? "s" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(semester)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(semester)}
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
              {editing ? "Edit Semester" : "Add Semester"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sem-course">Course</Label>
              <Select value={formCourseId} onValueChange={setFormCourseId}>
                <SelectTrigger id="sem-course">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="sem-id">Semester ID (optional, auto-generated)</Label>
                <Input
                  id="sem-id"
                  type="number"
                  placeholder="Leave blank for auto"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="sem-name">Name</Label>
              <Input
                id="sem-name"
                placeholder="e.g. 1st Semester"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
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
