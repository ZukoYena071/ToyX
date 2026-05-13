import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, MapPin, Mail, Phone, MessageCircle, AlertTriangle, Trash2, BookOpen } from "lucide-react";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import ListItemRow from "@/components/ui/ListItemRow";

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
              subtitle="Hide your city from your public profile (toy locations are always shown)"
              right={<ToggleSwitch enabled={settings.showLocation} onToggle={() => updateSetting("showLocation", !settings.showLocation)} />}
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
    </PageContainer>
  );
}
