import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SectionCard from "@/components/ui/SectionCard";

interface ShareCardProps {
  inviteLink: string | null;
}

export default function ShareCard({ inviteLink }: ShareCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const url = inviteLink ? `${window.location.origin}${inviteLink}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this link with friends." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareLink = () => {
    if (typeof navigator.share === "function") {
      navigator.share({ title: "Join ToyX!", text: "Swap toys with your community! Use my invite link:", url }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <SectionCard>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">Share your invite link</h3>
      <div className="flex gap-2 mb-2">
        <input readOnly value={url || "Loading..."} className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-50 border border-gray-200 dark:border-gray-700 truncate" />
        <Button size="sm" onClick={copyLink}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
      </div>
      {typeof navigator.share === "function" && (
        <button onClick={shareLink} className="w-full flex items-center justify-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-xl py-2.5 active:opacity-70">
          <Share2 className="w-3.5 h-3.5" /> Share with friends
        </button>
      )}
    </SectionCard>
  );
}
