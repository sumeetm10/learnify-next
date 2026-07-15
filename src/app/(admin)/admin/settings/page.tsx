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
import { Save, Settings, Megaphone, Trash2, Plus, ToggleLeft, ToggleRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
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
    facebookUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
  });
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [newCircleColor, setNewCircleColor] = useState("#3b82f6");
  const [newBoxColor, setNewBoxColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
          facebookUrl: settingsData.facebookUrl || "",
          instagramUrl: settingsData.instagramUrl || "",
          linkedinUrl: settingsData.linkedinUrl || "",
          youtubeUrl: settingsData.youtubeUrl || "",
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
    setSaved(false);
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

      setSaved(true);
      toast.success("Settings saved successfully!");
      setTimeout(() => setSaved(false), 2000);
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
      <div className="space-y-6">
        <div className="fade-in">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Site Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your college site information
          </p>
        </div>
        <Card className="border border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                  <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="fade-in">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Site Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your college site information displayed on the homepage and contact pages.
        </p>
      </div>

      {/* Settings Card */}
      <Card
        className="dash-reveal border border-gray-200 dark:border-gray-800 dark:bg-slate-900"
        style={{ animationDelay: "100ms" }}
      >
        <CardContent className="p-4">
          {/* Branding Section */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Branding
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="collegeName" className="text-xs">College Name</Label>
                <Input
                  id="collegeName"
                  value={settings.collegeName}
                  onChange={(e) => updateField("collegeName", e.target.value)}
                  placeholder="Enter college name"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tagline" className="text-xs">Tagline</Label>
                <Input
                  id="tagline"
                  value={settings.tagline}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  placeholder="Enter tagline"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="heroText" className="text-xs">Hero Text</Label>
              <Textarea
                id="heroText"
                value={settings.heroText}
                onChange={(e) => updateField("heroText", e.target.value)}
                placeholder="Enter hero section text"
                rows={2}
                className="text-sm resize-none"
              />
            </div>
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="logoUrl" className="text-xs">Logo URL</Label>
              <Input
                id="logoUrl"
                value={settings.logoUrl}
                onChange={(e) => updateField("logoUrl", e.target.value)}
                placeholder="/images/logo.png"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Contact Information Section */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail" className="text-xs">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  placeholder="info@example.com"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactPhone" className="text-xs">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={settings.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                  placeholder="+977 9876 543 210"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="contactAddress" className="text-xs">Contact Address</Label>
              <Input
                id="contactAddress"
                value={settings.contactAddress}
                onChange={(e) => updateField("contactAddress", e.target.value)}
                placeholder="Baneshwor, Kathmandu"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Social Links Section */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Social Links
            </h3>
            <p className="text-[11px] text-gray-400 mb-3">
              Full URLs (https://...). Leave a field blank to hide that icon.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="facebookUrl" className="text-xs">Facebook</Label>
                <Input
                  id="facebookUrl"
                  value={settings.facebookUrl}
                  onChange={(e) => updateField("facebookUrl", e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="instagramUrl" className="text-xs">Instagram</Label>
                <Input
                  id="instagramUrl"
                  value={settings.instagramUrl}
                  onChange={(e) => updateField("instagramUrl", e.target.value)}
                  placeholder="https://instagram.com/yourpage"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkedinUrl" className="text-xs">LinkedIn</Label>
                <Input
                  id="linkedinUrl"
                  value={settings.linkedinUrl}
                  onChange={(e) => updateField("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/company/yourpage"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="youtubeUrl" className="text-xs">YouTube</Label>
                <Input
                  id="youtubeUrl"
                  value={settings.youtubeUrl}
                  onChange={(e) => updateField("youtubeUrl", e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className={`transition-all duration-200 ${
                saved
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : ""
              }`}
            >
              {saved ? (
                <>
                  <Check size={14} className="mr-1.5" />
                  Saved!
                </>
              ) : saving ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} className="mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcements Card */}
      <Card
        className="dash-reveal border border-gray-200 dark:border-gray-800 dark:bg-slate-900"
        style={{ animationDelay: "200ms" }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950">
              <Megaphone size={14} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Announcements</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Floating notifications at bottom-left of the page
              </p>
            </div>
          </div>

          {/* New Announcement Form */}
          <div className="space-y-2 mb-4">
            <div className="flex gap-2">
              <Input
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="Type a new announcement..."
                maxLength={500}
                className="h-9 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddAnnouncement();
                }}
              />
              <Button
                onClick={handleAddAnnouncement}
                disabled={savingAnnouncement || !newAnnouncement.trim()}
                size="sm"
                className="h-9"
              >
                {savingAnnouncement ? (
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
              </Button>
            </div>

            {/* Color Pickers */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] text-gray-400 uppercase">Circle</Label>
                <div className="flex gap-1">
                  {[
                    "#3b82f6",
                    "#ef4444",
                    "#22c55e",
                    "#eab308",
                    "#8b5cf6",
                    "#06b6d4",
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewCircleColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${
                        newCircleColor === c
                          ? "border-gray-900 dark:border-white scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-[10px] text-gray-400 uppercase">Box</Label>
                <div className="flex gap-1">
                  {[
                    "#3b82f6",
                    "#ef4444",
                    "#22c55e",
                    "#eab308",
                    "#8b5cf6",
                    "#06b6d4",
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewBoxColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${
                        newBoxColor === c
                          ? "border-gray-900 dark:border-white scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Announcements List */}
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 inline-block mb-2">
                <Megaphone size={20} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No announcements yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Create one above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {announcements.map((ann, index) => (
                <div
                  key={ann.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 ${
                    ann.isActive
                      ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 opacity-60"
                  }`}
                  style={{
                    animation: `slideUp 0.3s ease-out forwards`,
                    animationDelay: `${index * 50}ms`,
                    opacity: 0,
                  }}
                >
                  {/* Color dots */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ann.circleColor }}
                    />
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: ann.boxColor }}
                    />
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleAnnouncement(ann.id, !ann.isActive)}
                    className="shrink-0 cursor-pointer transition-colors"
                  >
                    {ann.isActive ? (
                      <ToggleRight size={20} className="text-blue-500" />
                    ) : (
                      <ToggleLeft size={20} className="text-gray-400" />
                    )}
                  </button>

                  {/* Message */}
                  <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                    {ann.message}
                  </p>

                  {/* Inline color editors */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-0.5">
                      {["#3b82f6", "#ef4444", "#22c55e", "#eab308"].map((c) => (
                        <button
                          key={`c-${ann.id}-${c}`}
                          onClick={() => handleUpdateAnnouncementColor(ann.id, "circleColor", c)}
                          className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                            ann.circleColor === c
                              ? "border-gray-900 dark:border-white scale-125"
                              : "border-transparent hover:scale-110"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                    <div className="flex gap-0.5">
                      {["#3b82f6", "#ef4444", "#22c55e", "#eab308"].map((c) => (
                        <button
                          key={`b-${ann.id}-${c}`}
                          onClick={() => handleUpdateAnnouncementColor(ann.id, "boxColor", c)}
                          className={`w-3.5 h-3.5 rounded border transition-all cursor-pointer ${
                            ann.boxColor === c
                              ? "border-gray-900 dark:border-white scale-125"
                              : "border-transparent hover:scale-110"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="text-gray-400 hover:text-red-500 shrink-0 cursor-pointer transition-colors p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
