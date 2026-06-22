"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Message sent successfully!");
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: MapPin, label: "Location", value: "Baneshwor, Kathmandu" },
    { icon: Phone, label: "Phone", value: "+91 9876 543 210" },
    { icon: Mail, label: "Email", value: "info@shubhashree.com" },
    { icon: Clock, label: "Working Hours", value: "Mon-Fri: 9AM - 6PM" },
  ];

  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="text-center px-6 mb-12">
        <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
        <p className="text-gray-600 dark:text-gray-300">We&apos;d love to hear from you!</p>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Form */}
          <Card className="lg:col-span-3 dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" placeholder="Your name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="your@email.com" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select name="subject" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="content">Content Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" name="message" placeholder="Your message..." rows={5} required />
                </div>
                <Button type="submit" className="w-full bg-[#427da6] hover:bg-[#356a8a]" disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info */}
          <div className="lg:col-span-2 space-y-4">
            {contactInfo.map((item) => (
              <div key={item.label} className="flex items-start gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-[#427da6]/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="text-[#427da6]" size={18} />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{item.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{item.value}</p>
                </div>
              </div>
            ))}

            {/* Social Links */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-sm mb-3">Follow Us</h3>
              <div className="flex gap-3">
                {["Facebook", "Instagram", "LinkedIn", "YouTube"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="px-3 py-1.5 text-xs bg-[#427da6]/10 text-[#427da6] rounded-full hover:bg-[#427da6] hover:text-white transition-colors"
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <iframe
            src="https://www.google.com/maps?q=Shubhashree+College+of+Management,+Baneshwor,+Kathmandu&output=embed"
            width="100%"
            height="350"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location Map"
          />
        </div>
      </section>
    </div>
  );
}
