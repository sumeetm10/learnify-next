"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Megaphone,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import type { AnnouncementData } from "@/types";

const PRESET_COLORS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Red", value: "#ef4444" },
  { label: "Green", value: "#22c55e" },
  { label: "Yellow", value: "#eab308" },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [newCircleColor, setNewCircleColor] = useState("#3b82f6");
  const [newBoxColor, setNewBoxColor] = useState("#3b82f6");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState("");

  const fetchAnnouncements = () => {
    fetch("/api/admin/announcements")
      .then((r) => r.json())
      .then((data) => {
        setAnnouncements(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load announcements");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async () => {
    if (!newMessage.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newMessage.trim(),
          isActive: true,
          circleColor: newCircleColor,
          boxColor: newBoxColor,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Announcement created");
      setNewMessage("");
      setNewCircleColor("#3b82f6");
      setNewBoxColor("#3b82f6");
      fetchAnnouncements();
    } catch {
      toast.error("Failed to create announcement");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      toast.success(currentActive ? "Announcement deactivated" : "Announcement activated");
      fetchAnnouncements();
    } catch {
      toast.error("Failed to update announcement");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editMessage.trim()) return;
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, message: editMessage.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Announcement updated");
      setEditingId(null);
      setEditMessage("");
      fetchAnnouncements();
    } catch {
      toast.error("Failed to update announcement");
    }
  };

  const handleColorChange = async (id: string, field: "circleColor" | "boxColor", value: string) => {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update color");
      fetchAnnouncements();
    } catch {
      toast.error("Failed to update color");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Announcement deleted");
      fetchAnnouncements();
    } catch {
      toast.error("Failed to delete announcement");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone size={20} className="text-[#427da6]" />
            New Announcement
          </CardTitle>
          <CardDescription>
            Create a new announcement. It will be displayed as a floating notification at the bottom-left of all pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Enter announcement message..."
            rows={2}
          />

          {/* Color pickers */}
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Circle Color</Label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNewCircleColor(c.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                      newCircleColor === c.value
                        ? "border-gray-800 scale-110 ring-2 ring-gray-300"
                        : "border-gray-200 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Box Color</Label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNewBoxColor(c.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                      newBoxColor === c.value
                        ? "border-gray-800 scale-110 ring-2 ring-gray-300"
                        : "border-gray-200 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={creating || !newMessage.trim()}>
              <Plus size={16} className="mr-1" />
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>All Announcements</CardTitle>
          <CardDescription>
            Manage existing announcements. Click the color dots to change colors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-sm">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    a.isActive
                      ? "border-[#427da6]/30 bg-[#427da6]/5"
                      : "border-gray-200 dark:border-slate-700 opacity-60"
                  }`}
                >
                  {/* Color preview */}
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: a.circleColor }}
                      title="Circle color"
                    />
                    <div
                      className="w-6 h-6 rounded-md border border-gray-200"
                      style={{ backgroundColor: a.boxColor }}
                      title="Box color"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {editingId === a.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={() => handleUpdate(a.id)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditMessage("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white">
                        {a.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(a.createdAt).toLocaleDateString()}
                      {a.isActive && (
                        <span className="ml-2 text-green-600 font-medium">
                          Active
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Inline color editors */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-1">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={`circle-${a.id}-${c.value}`}
                            onClick={() => handleColorChange(a.id, "circleColor", c.value)}
                            className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                              a.circleColor === c.value
                                ? "border-gray-800 scale-125"
                                : "border-gray-300 hover:scale-110"
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={`Circle: ${c.label}`}
                          />
                        ))}
                      </div>
                      <div className="w-px h-4 bg-gray-200" />
                      <div className="flex gap-1">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={`box-${a.id}-${c.value}`}
                            onClick={() => handleColorChange(a.id, "boxColor", c.value)}
                            className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                              a.boxColor === c.value
                                ? "border-gray-800 scale-125"
                                : "border-gray-300 hover:scale-110"
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={`Box: ${c.label}`}
                          />
                        ))}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggle(a.id, a.isActive)}
                      title={a.isActive ? "Deactivate" : "Activate"}
                    >
                      {a.isActive ? (
                        <ToggleRight size={18} className="text-green-600" />
                      ) : (
                        <ToggleLeft size={18} className="text-gray-400" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(a.id);
                        setEditMessage(a.message);
                      }}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(a.id)}
                      title="Delete"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
