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
  const [selected, setSelected] = useState<any>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/me/moderation-messages", { credentials: "include" });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Auto-select message if routed via deep link
  useEffect(() => {
    if (!loading && messages.length > 0 && msgId) {
      const found = messages.find((m: any) => String(m.id) === msgId);
      if (found) setSelected(found);
    }
  }, [loading, messages, msgId]);

  const markRead = async (id: number) => {
    await fetch(`/api/me/moderation-messages/${id}/read`, { method: "PATCH", credentials: "include" });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, readAt: new Date().toISOString() } : m));
  };

  if (selected) {
    return (
      <PageContainer className="pb-24">
        <PageHeader title="Message" rightAction={<button onClick={() => { markRead(selected.id); setLocation("/privacy/messages"); }} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"><ArrowLeft className="w-4 h-4 text-gray-600" /></button>} />
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

  return (
    <PageContainer className="pb-24">
      <PageHeader title="Messages from ToyX" rightAction={<Link href="/privacy-safety"><button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"><ArrowLeft className="w-4 h-4 text-gray-600" /></button></Link>} />
      <div className="px-4 py-4">
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No messages from ToyX yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <button key={m.id} onClick={() => { if (!m.readAt) markRead(m.id); setSelected(m); }}
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
