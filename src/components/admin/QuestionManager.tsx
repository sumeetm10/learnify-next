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
  subjectId: string;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  answer: string;
  orderIndex: number;
  chapterId: string;
}

export function QuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterChapter, setFilterChapter] = useState<string>("none");

  // Form state
  const [formText, setFormText] = useState("");
  const [formOption1, setFormOption1] = useState("");
  const [formOption2, setFormOption2] = useState("");
  const [formOption3, setFormOption3] = useState("");
  const [formOption4, setFormOption4] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formChapterId, setFormChapterId] = useState("");
  const [formOrderIndex, setFormOrderIndex] = useState("1");

  // Derived filtered lists
  const filteredSubjects =
    filterSemester && filterSemester !== "all"
      ? subjects.filter((s) => s.semesterId === parseInt(filterSemester))
      : subjects;

  const filteredChapters =
    filterSubject && filterSubject !== "all"
      ? chapters.filter((c) => c.subjectId === filterSubject)
      : filterSemester && filterSemester !== "all"
      ? chapters.filter((c) => {
          const sub = subjects.find((s) => s.id === c.subjectId);
          return sub?.semesterId === parseInt(filterSemester);
        })
      : chapters;

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
      const res = await fetch("/api/admin/chapters");
      if (!res.ok) throw new Error("Failed to fetch");
      setChapters(await res.json());
    } catch {
      toast.error("Failed to load chapters");
    }
  };

  const fetchQuestions = async (chapterId: string) => {
    if (!chapterId || chapterId === "none") {
      setQuestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/questions?chapterId=${chapterId}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      setQuestions(await res.json());
    } catch {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
    fetchSubjects();
    fetchChapters();
  }, []);

  useEffect(() => {
    fetchQuestions(filterChapter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterChapter]);

  // Reset cascading filters
  useEffect(() => {
    setFilterSubject("all");
    setFilterChapter("none");
  }, [filterSemester]);

  useEffect(() => {
    setFilterChapter("none");
  }, [filterSubject]);

  // Build the current options array for the answer select
  const currentOptions = [formOption1, formOption2, formOption3, formOption4].filter(
    (o) => o.trim() !== ""
  );

  const openAdd = () => {
    setEditing(null);
    setFormText("");
    setFormOption1("");
    setFormOption2("");
    setFormOption3("");
    setFormOption4("");
    setFormAnswer("");
    setFormChapterId(
      filterChapter !== "none" ? filterChapter : filteredChapters.length > 0 ? filteredChapters[0].id : ""
    );
    setFormOrderIndex("1");
    setDialogOpen(true);
  };

  const openEdit = (question: Question) => {
    setEditing(question);
    setFormText(question.text);
    setFormOption1(question.options[0] || "");
    setFormOption2(question.options[1] || "");
    setFormOption3(question.options[2] || "");
    setFormOption4(question.options[3] || "");
    setFormAnswer(question.answer);
    setFormChapterId(question.chapterId);
    setFormOrderIndex(String(question.orderIndex));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formText.trim() || !formChapterId) {
      toast.error("Question text and chapter are required");
      return;
    }

    const options = [formOption1, formOption2, formOption3, formOption4].filter(
      (o) => o.trim() !== ""
    );
    if (options.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }

    if (!formAnswer.trim()) {
      toast.error("Please select the correct answer");
      return;
    }

    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        text: formText.trim(),
        options,
        answer: formAnswer.trim(),
        orderIndex: parseInt(formOrderIndex) || 1,
        chapterId: formChapterId,
      };
      if (editing) body.id = editing.id;

      const res = await fetch("/api/admin/questions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(editing ? "Question updated" : "Question created");
      setDialogOpen(false);
      fetchQuestions(filterChapter);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (question: Question) => {
    if (
      !confirm("Delete this question? This cannot be undone.")
    )
      return;

    try {
      const res = await fetch(`/api/admin/questions?id=${question.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }

      toast.success("Question deleted");
      fetchQuestions(filterChapter);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Questions</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterSemester} onValueChange={setFilterSemester}>
              <SelectTrigger className="w-[150px]">
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
              <SelectTrigger className="w-[160px]">
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
            <Select value={filterChapter} onValueChange={setFilterChapter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a chapter</SelectItem>
                {filteredChapters.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={openAdd}
              className="gap-1.5"
              disabled={filterChapter === "none" && filteredChapters.length === 0}
            >
              <Plus size={14} /> Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filterChapter === "none" ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Select a chapter to view its questions.
            </p>
          ) : loading ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Loading questions...
            </p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No questions for this chapter. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="text-gray-400">
                      {question.orderIndex}
                    </TableCell>
                    <TableCell className="font-medium max-w-[250px]">
                      <span className="line-clamp-2">{question.text}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {question.options.length} options
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-sm text-gray-600">
                      {question.answer}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(question)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(question)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Question" : "Add Question"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="q-chapter">Chapter</Label>
              <Select value={formChapterId} onValueChange={setFormChapterId}>
                <SelectTrigger id="q-chapter">
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-text">Question Text</Label>
              <Textarea
                id="q-text"
                placeholder="Enter the question..."
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="q-opt1">Option 1</Label>
                <Input
                  id="q-opt1"
                  placeholder="Option A"
                  value={formOption1}
                  onChange={(e) => setFormOption1(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-opt2">Option 2</Label>
                <Input
                  id="q-opt2"
                  placeholder="Option B"
                  value={formOption2}
                  onChange={(e) => setFormOption2(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-opt3">Option 3</Label>
                <Input
                  id="q-opt3"
                  placeholder="Option C"
                  value={formOption3}
                  onChange={(e) => setFormOption3(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-opt4">Option 4</Label>
                <Input
                  id="q-opt4"
                  placeholder="Option D"
                  value={formOption4}
                  onChange={(e) => setFormOption4(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="q-answer">Correct Answer</Label>
                <Select value={formAnswer} onValueChange={setFormAnswer}>
                  <SelectTrigger id="q-answer">
                    <SelectValue placeholder="Select answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentOptions.map((opt, i) => (
                      <SelectItem key={i} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-order">Order Index</Label>
                <Input
                  id="q-order"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formOrderIndex}
                  onChange={(e) => setFormOrderIndex(e.target.value)}
                />
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
