import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ModerationMessageNotifier() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const notifiedIdRef = useRef<string | null>(null);

  const { data } = useQuery<{ unreadCount: number; latestUnreadId: number | null }>({
    queryKey: ["/api/me/moderation-messages/unread-count"],
    retry: false,
    refetchInterval: 60000,
  });

  useEffect(() => {
    const latestId = data?.latestUnreadId;
    if (!latestId) return;
    const idStr = String(latestId);
    // Check localStorage to avoid spam
    const lastNotified = localStorage.getItem("toyx:lastNotifiedModerationMessageId");
    if (lastNotified === idStr) return;
    // Also check in-memory ref to avoid double-show in same render
    if (notifiedIdRef.current === idStr) return;

    notifiedIdRef.current = idStr;
    localStorage.setItem("toyx:lastNotifiedModerationMessageId", idStr);

    const target = `/privacy/messages/${latestId}`;
    // Small delay to let the page render first
    const timer = setTimeout(() => {
      toast({
        title: "New message from ToyX",
        description: "You have a new moderation message.",
        duration: 10000,
      });
      // Use a brief confirm-style banner approach - tap the toast area
      // The user can also navigate via Privacy & Safety
    }, 1500);

    return () => clearTimeout(timer);
  }, [data, toast, setLocation]);

  return null;
}
