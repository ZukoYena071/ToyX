import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, MapPin, Mail, Phone, MessageCircle, AlertTriangle, Trash2, BookOpen, HelpCircle, Search, X, Flag } from "lucide-react";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import ListItemRow from "@/components/ui/ListItemRow";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ReportUserModal from "@/components/toys/ReportUserModal";

const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors min-h-[44px] min-w-[44px] ${
      enabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
      enabled ? 'translate-x-6' : 'translate-x-1'
    }`} />
  </button>
);

export default function PrivacySafety() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    showLocation: true,
    showEmail: true,
    showPhone: false,
    messagePrivacy: "everyone",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showReportSearch, setShowReportSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedReportUser, setSelectedReportUser] = useState<{ id: string; name: string } | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch("/api/users/privacy", { credentials: "include" })
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = async (key: string, value: boolean | string) => {
    setSaving(key);
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      const res = await fetch("/api/users/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setSettings(data);
    } catch {
      setSettings(settings);
      toast({ title: "Error", description: "Failed to save setting", variant: "destructive" });
    }
    setSaving(null);
  };

  // Search debounce
  useEffect(() => {
    if (!showReportSearch || searchQ.length < 2) { setSearchResults([]); return; }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQ)}&limit=10`, { credentials: "include" });
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [showReportSearch, searchQ]);

  if (loading) {
    return (
      <PageContainer className="pb-24">
        <PageHeader title="Privacy & Safety" />
        <div className="px-4 pt-4 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title="Privacy & Safety"
        rightAction={
          <Link href="/profile">
            <button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" />
            </button>
          </Link>
        }
      />

      <div className="px-4 pt-4 space-y-4">
        <SectionCard>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">Profile Visibility</h3>
          <div className="space-y-1">
            <ListItemRow
              icon={<div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><MapPin className="text-blue-500 w-5 h-5" /></div>}
              title="Show location on listings"
              subtitle="Controls your public profile city"
              right={
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[220px] text-xs">
                      Hide your city from your public profile page. Toy locations on listings are always shown so other parents can find toys near them.
                    </TooltipContent>
                  </Tooltip>
                  <ToggleSwitch enabled={settings.showLocation} onToggle={() => updateSetting("showLocation", !settings.showLocation)} />
                </div>
              }
            />
            <ListItemRow
              icon={<div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"><Mail className="text-purple-500 w-5 h-5" /></div>}
              title="Show email to exchange partners"
              subtitle="Let exchange partners see your email"
              right={<ToggleSwitch enabled={settings.showEmail} onToggle={() => updateSetting("showEmail", !settings.showEmail)} />}
            />
            <ListItemRow
              icon={<div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/30 rounded-xl flex items-center justify-center"><Phone className="text-pink-500 w-5 h-5" /></div>}
              title="Show phone number"
              subtitle="Share your phone after an exchange is confirmed"
              right={<ToggleSwitch enabled={settings.showPhone} onToggle={() => updateSetting("showPhone", !settings.showPhone)} />}
            />
          </div>
        </SectionCard>

        <SectionCard>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">Communication</h3>
          <div className="space-y-1">
            <ListItemRow
              icon={<div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center"><MessageCircle className="text-green-500 w-5 h-5" /></div>}
              title="Who can message you"
              subtitle={settings.messagePrivacy === "everyone" ? "Anyone can send you a message" : "Only exchange partners can message you"}
              onClick={() => updateSetting("messagePrivacy", settings.messagePrivacy === "everyone" ? "exchanges" : "everyone")}
              right={
                <span className="text-xs font-medium text-purple-500 dark:text-purple-400">
                  {settings.messagePrivacy === "everyone" ? "Everyone" : "Exchanges"}
                </span>
              }
            />
          </div>
        </SectionCard>

        <SectionCard>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">Safety</h3>
          <div className="space-y-1">
            <ListItemRow
              icon={<div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center"><BookOpen className="text-amber-500 w-5 h-5" /></div>}
              title="Safety tips"
              subtitle="Learn how to exchange toys safely"
            />
            <ListItemRow
              icon={<div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center"><AlertTriangle className="text-red-500 w-5 h-5" /></div>}
              title="Report a user"
              subtitle="Report inappropriate behavior or safety concerns"
              onClick={() => setShowReportSearch(true)}
            />
          </div>
        </SectionCard>

        <SectionCard>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">Account</h3>
          <div className="space-y-1">
            <ListItemRow
              icon={<div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center"><Trash2 className="text-red-500 w-5 h-5" /></div>}
              title="Delete account"
              subtitle="Permanently delete your account and data"
              className="hover:bg-red-50 dark:hover:bg-red-900/20"
            />
          </div>
        </SectionCard>
      </div>

      <BottomNav />

      {/* Search user modal */}
      {showReportSearch && !selectedReportUser && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Report a user</h3>
              <button onClick={() => setShowReportSearch(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+24px)]">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search by name..." className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]" autoFocus />
              </div>
              {searching && <p className="text-center text-sm text-gray-400 py-4">Searching...</p>}
              {!searching && searchQ.length >= 2 && searchResults.length === 0 && <p className="text-center text-sm text-gray-400 py-4">No users found</p>}
              <div className="space-y-2">
                {searchResults.map((u: any) => (
                  <button key={u.id} onClick={() => setSelectedReportUser({ id: u.id, name: u.firstName || u.email?.split('@')[0] || 'User' })}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[48px]"
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-bold">{u.firstName?.[0] || u.email?.[0] || 'U'}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{u.firstName || u.email}</div>
                      <div className="text-xs text-gray-500 truncate">{u.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ReportUserModal
        open={!!selectedReportUser}
        onClose={() => { setSelectedReportUser(null); setShowReportSearch(false); }}
        reportedId={selectedReportUser?.id || ""}
        reportedName={selectedReportUser?.name || "User"}
        contextType="profile"
      />
    </PageContainer>
  );
}
