"use client";
import { useState, useEffect } from "react";
import { notices } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";

export default function AdminNoticesPage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [noticeList, setNoticeList] = useState(notices);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"academic" | "events" | "fee" | "general">("academic");
  const [body, setBody] = useState("");

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const newNotice = {
      id: `N${Date.now()}`,
      title,
      category,
      body,
      date: new Date().toISOString().split("T")[0],
      postedBy: "Office of Principal / Admin",
    };
    setNoticeList([newNotice, ...noticeList]);
    showToast("Notice published to all students and staff", "success");
    setShowCreate(false);
    setTitle("");
    setBody("");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[#1E2A4A]">College Notices</h1>
          <p className="text-sm text-[#33363D]/60 mt-0.5">Publish circulars, deadlines, and official announcements</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          + Publish New Notice
        </Button>
      </div>

      <div className="space-y-3">
        {noticeList.map((n) => (
          <Card key={n.id} className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#E8A33D]">
                  {n.category}
                </span>
                <h3 className="font-heading text-base font-semibold text-[#1E2A4A] mt-0.5">{n.title}</h3>
                <p className="text-xs text-[#33363D]/50 mt-0.5">
                  Published {new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {n.postedBy}
                </p>
              </div>
            </div>
            <p className="text-sm text-[#33363D]/80 leading-relaxed border-t border-[#33363D]/10 pt-2">{n.body}</p>
          </Card>
        ))}
      </div>

      <Drawer open={showCreate} onClose={() => setShowCreate(false)} title="Publish Notice">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Notice Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mid-term Exam Schedule" required />
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#1E2A4A]">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-11 px-3 rounded-lg border border-[#33363D]/25 bg-white text-sm text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]"
            >
              <option value="academic">Academic</option>
              <option value="events">Events</option>
              <option value="fee">Fee & Accounts</option>
              <option value="general">General Circular</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#1E2A4A]">Notice Content *</label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter full notice text here..."
              required
              className="w-full px-3 py-2 rounded-lg border border-[#33363D]/25 bg-white text-sm text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A] resize-none"
            />
          </div>

          <Button type="submit" variant="primary" fullWidth size="lg">
            Broadcast Notice
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
