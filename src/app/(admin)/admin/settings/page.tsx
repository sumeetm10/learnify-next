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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Save, Settings, Megaphone, Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import type { SiteSettingsData, AnnouncementData } from "@/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsData>({
    collegeName: "",
    tagline: "",
    heroText: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    logoUrl: "",
  });
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [newCircleColor, setNewCircleColor] = useState("#3b82f6");
  const [newBoxColor, setNewBoxColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings").then((r) => r.json()),
      fetch("/api/admin/announcements").then((r) => r.json()),
    ])
      .then(([settingsData, announcementsData]) => {
        setSettings({
          collegeName: settingsData.collegeName || "",
          tagline: settingsData.tagline || "",
          heroText: settingsData.heroText || "",
          contactEmail: settingsData.contactEmail || "",
          contactPhone: settingsData.contactPhone || "",
          contactAddress: settingsData.contactAddress || "",
          logoUrl: settingsData.logoUrl || "",
        });
        setAnnouncements(announcementsData || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load settings");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success("Settings updated!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof SiteSettingsData, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    setSavingAnnouncement(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newAnnouncement.trim(),
          isActive: true,
          circleColor: newCircleColor,
          boxColor: newBoxColor,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const created = await res.json();
      setAnnouncements((prev) => [created, ...prev]);
      setNewAnnouncement("");
      setNewCircleColor("#3b82f6");
      setNewBoxColor("#3b82f6");
      toast.success("Announcement created!");
    } catch {
      toast.error("Failed to create announcement");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleUpdateAnnouncementColor = async (id: string, field: "circleColor" | "boxColor", value: string) => {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch {
      toast.error("Failed to update color");
    }
  };

  const handleToggleAnnouncement = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      );
      toast.success(isActive ? "Announcement activated" : "Announcement deactivated");
    } catch {
      toast.error("Failed to update announcement");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Announcement deleted");
    } catch {
      toast.error("Failed to delete announcement");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} className="text-[#427da6]" />
            Site Settings
          </CardTitle>
          <CardDescription>
            Manage your college site information displayed on the homepage and
            contact pages.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Branding Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Branding
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collegeName">College Name</Label>
                <Input
                  id="collegeName"
                  value={settings.collegeName}
                  onChange={(e) => updateField("collegeName", e.target.value)}
                  placeholder="Enter college name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={settings.tagline}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  placeholder="Enter tagline"
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="heroText">Hero Text</Label>
              <Textarea
                id="heroText"
                value={settings.heroText}
                onChange={(e) => updateField("heroText", e.target.value)}
                placeholder="Enter hero section text"
                rows={3}
              />
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={settings.logoUrl}
                onChange={(e) => updateField("logoUrl", e.target.value)}
                placeholder="/images/logo.png"
              />
            </div>
          </div>

          <Separator />

          {/* Contact Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  placeholder="info@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={settings.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                  placeholder="+977 9876 543 210"
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="contactAddress">Contact Address</Label>
              <Input
                id="contactAddress"
                value={settings.contactAddress}
                onChange={(e) => updateField("contactAddress", e.target.value)}
                placeholder="Baneshwor, Kathmandu"
              />
            </div>
          </div>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcement Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone size={20} className="text-[#427da6]" />
            Announcements
          </CardTitle>
          <CardDescription>
            Create announcements that appear as a floating notification at the bottom-left of the page.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* New Announcement Form */}
          <div className="space-y-3">
            <Input
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              placeholder="Type a new announcement... (max 500 chars)"
              maxLength={500}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddAnnouncement();
              }}
            />
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500 whitespace-nowrap">Circle</Label>
                <div className="flex gap-1.5">
                  {[
                    { label: "Blue", value: "#3b82f6" },
                    { label: "Red", value: "#ef4444" },
                    { label: "Green", value: "#22c55e" },
                    { label: "Yellow", value: "#eab308" },
                  ].map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setNewCircleColor(c.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                        newCircleColor === c.value
                          ? "border-gray-800 scale-110"
                          : "border-gray-200 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500 whitespace-nowrap">Box</Label>
                <div className="flex gap-1.5">
                  {[
                    { label: "Blue", value: "#3b82f6" },
                    { label: "Red", value: "#ef4444" },
                    { label: "Green", value: "#22c55e" },
                    { label: "Yellow", value: "#eab308" },
                  ].map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setNewBoxColor(c.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                        newBoxColor === c.value
                          ? "border-gray-800 scale-110"
                          : "border-gray-200 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleAddAnnouncement}
                disabled={savingAnnouncement || !newAnnouncement.trim()}
                className="ml-auto"
              >
                <Plus size={16} className="mr-1" />
                Add
              </Button>
            </div>
          </div>

          <Separator />

          {/* Announcements List */}
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No announcements yet. Create one above.
            </p>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    ann.isActive
                      ? "bg-[#427da6]/5 dark:bg-[#427da6]/10 border-[#427da6]/20"
                      : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60"
                  }`}
                >
                  {/* Color preview */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div
                      className="w-7 h-7 rounded-full shadow-sm border border-gray-200"
                      style={{ backgroundColor: ann.circleColor }}
                      title="Circle color"
                    />
                    <div
                      className="w-7 h-7 rounded-md shadow-sm border border-gray-200"
                      style={{ backgroundColor: ann.boxColor }}
                      title="Box color"
                    />
                  </div>

                  <button
                    onClick={() => handleToggleAnnouncement(ann.id, !ann.isActive)}
                    className="shrink-0 cursor-pointer"
                    title={ann.isActive ? "Deactivate" : "Activate"}
                  >
                    {ann.isActive ? (
                      <ToggleRight size={24} className="text-[#427da6]" />
                    ) : (
                      <ToggleLeft size={24} className="text-gray-400" />
                    )}
                  </button>

                  <p className="flex-1 text-sm truncate">{ann.message}</p>

                  {/* Inline color editors */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">C</span>
                      <div className="flex gap-0.5">
                        {[
                          { value: "#3b82f6" },
                          { value: "#ef4444" },
                          { value: "#22c55e" },
                          { value: "#eab308" },
                        ].map((c) => (
                          <button
                            key={c.value}
                            onClick={() => handleUpdateAnnouncementColor(ann.id, "circleColor", c.value)}
                            className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                              ann.circleColor === c.value
                                ? "border-gray-800 scale-110"
                                : "border-gray-200 hover:scale-105"
                            }`}
                            style={{ backgroundColor: c.value }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">B</span>
                      <div className="flex gap-0.5">
                        {[
                          { value: "#3b82f6" },
                          { value: "#ef4444" },
                          { value: "#22c55e" },
                          { value: "#eab308" },
                        ].map((c) => (
                          <button
                            key={c.value}
                            onClick={() => handleUpdateAnnouncementColor(ann.id, "boxColor", c.value)}
                            className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                              ann.boxColor === c.value
                                ? "border-gray-800 scale-110"
                                : "border-gray-200 hover:scale-105"
                            }`}
                            style={{ backgroundColor: c.value }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="text-red-400 hover:text-red-600 shrink-0 cursor-pointer"
                    title="Delete announcement"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
