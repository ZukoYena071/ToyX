import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Mail, MessageCircle, CheckCircle, Clock } from "lucide-react";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

export default function PrivacyMessages() {
  const { id: msgId } = useParams();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = msgId ? messages.find((m: any) => String(m.id) === String(msgId)) || null : null;

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/me/moderation-messages", { credentials: "include" });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const markRead = async (id: number) => {
    try { await fetch(`/api/me/moderation-messages/${id}/read`, { method: "PATCH", credentials: "include" }); } catch {}
    setMessages(prev => prev.map(m => m.id === id ? { ...m, readAt: new Date().toISOString() } : m));
  };

  // Auto-mark read when opening detail
  useEffect(() => {
    if (selected && !selected.readAt) {
      markRead(selected.id);
    }
  }, [selected?.id]);

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/privacy/messages");
    }
  };

  // Detail view
  if (msgId) {
    if (loading && !selected) {
      return (
        <PageContainer className="pb-24">
          <PageHeader title="Message" rightAction={<button onClick={goBack} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4 text-gray-600" /></button>} />
          <div className="px-4 py-8 text-center text-sm text-gray-400"><div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          <BottomNav />
        </PageContainer>
      );
    }
    if (!selected) {
      return (
        <PageContainer className="pb-24">
          <PageHeader title="Message" rightAction={<button onClick={goBack} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4 text-gray-600" /></button>} />
          <div className="px-4 py-4 text-center text-sm text-gray-500">Message not found.</div>
          <BottomNav />
        </PageContainer>
      );
    }
    return (
      <PageContainer className="pb-24">
        <PageHeader title="Message" rightAction={<button onClick={goBack} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4 text-gray-600" /></button>} />
        <div className="px-4 py-4">
          <SectionCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {selected.readAt ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-blue-500" />}
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{selected.subject || "Message from ToyX"}</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{new Date(selected.createdAt).toLocaleString()}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selected.body}</p>
          </SectionCard>
        </div>
        <BottomNav />
      </PageContainer>
    );
  }

  // List view
  return (
    <PageContainer className="pb-24">
      <PageHeader title="Messages from ToyX" rightAction={<Link href="/privacy-safety"><button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ArrowLeft className="w-4 h-4 text-gray-600" /></button></Link>} />
      <div className="px-4 py-4">
        {loading ? (
          <div className="text-center py-12"><div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No messages from ToyX yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <button key={m.id} onClick={() => setLocation(`/privacy/messages/${m.id}`)}
                className="w-full text-left bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1">
                  {!m.readAt && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  <span className={`text-sm font-medium truncate ${!m.readAt ? 'text-gray-900 dark:text-gray-50' : 'text-gray-600 dark:text-gray-400'}`}>
                    {m.subject || "Message from ToyX"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{m.body}</p>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(m.createdAt).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </PageContainer>
  );
}
