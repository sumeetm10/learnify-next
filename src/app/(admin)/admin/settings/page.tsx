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
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";
import type { SiteSettingsData } from "@/types";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data: SiteSettingsData) => {
        setSettings({
          collegeName: data.collegeName || "",
          tagline: data.tagline || "",
          heroText: data.heroText || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          contactAddress: data.contactAddress || "",
          logoUrl: data.logoUrl || "",
        });
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
    </div>
  );
}
