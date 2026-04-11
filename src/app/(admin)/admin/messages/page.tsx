"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  MailOpen,
  Archive,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { ContactMessageData } from "@/types";

interface MessagesResponse {
  messages: ContactMessageData[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"all" | "unread" | "archived">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/messages?status=${status}&page=${page}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data: MessagesResponse = await res.json();
      setMessages(data.messages);
      setTotalPages(data.totalPages);
      setUnreadCount(data.unreadCount);
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleTabChange = (value: string) => {
    setStatus(value as "all" | "unread" | "archived");
    setPage(1);
  };

  const toggleRead = async (msg: ContactMessageData) => {
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg.id, isRead: !msg.isRead }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(msg.isRead ? "Marked as unread" : "Marked as read");
      fetchMessages();
    } catch {
      toast.error("Failed to update message");
    }
  };

  const archiveMessage = async (msg: ContactMessageData) => {
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: msg.id,
          isArchived: !msg.isArchived,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(msg.isArchived ? "Unarchived" : "Archived");
      fetchMessages();
    } catch {
      toast.error("Failed to update message");
    }
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this message?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Message deleted");
      fetchMessages();
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-[#427da6]" />
          <h1 className="text-xl font-semibold">Contact Messages</h1>
        </div>
      </div>

      {/* Tabs for filtering */}
      <Tabs value={status} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread" className="gap-1.5">
            Unread
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-[20px] px-1.5 text-xs bg-blue-100 text-blue-700"
              >
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Messages List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No messages yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card
              key={msg.id}
              className={`transition-colors ${
                !msg.isRead ? "border-l-4 border-l-blue-500" : ""
              }`}
            >
              <CardContent className="p-4">
                {/* Message Header */}
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() =>
                      setExpandedId(expandedId === msg.id ? null : msg.id)
                    }
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {!msg.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm truncate">
                        {msg.name}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {msg.email}
                      </span>
                      {msg.user && (
                        <Badge
                          variant="outline"
                          className="text-xs border-green-300 text-green-700 bg-green-50 flex-shrink-0"
                        >
                          Registered
                        </Badge>
                      )}
                    </div>
                    <p className="font-semibold text-sm">{msg.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(msg.createdAt)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRead(msg)}
                      title={msg.isRead ? "Mark as unread" : "Mark as read"}
                      className="h-8 w-8 p-0"
                    >
                      {msg.isRead ? (
                        <Mail size={15} />
                      ) : (
                        <MailOpen size={15} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archiveMessage(msg)}
                      title={msg.isArchived ? "Unarchive" : "Archive"}
                      className="h-8 w-8 p-0"
                    >
                      <Archive size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMessage(msg.id)}
                      title="Delete permanently"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>

                {/* Message Body (expandable) */}
                {expandedId === msg.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                )}

                {/* Collapsed preview */}
                {expandedId !== msg.id && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {msg.message}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft size={16} />
            Previous
          </Button>
          <span className="text-sm text-gray-500 px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
