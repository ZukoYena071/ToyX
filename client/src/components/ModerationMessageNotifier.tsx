import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";

let sessionToastShown = false;

export default function ModerationMessageNotifier() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const notifiedIdRef = useRef<string | null>(null);

  const { data } = useQuery<{ unreadCount: number; latestUnreadId: number | null }>({
    queryKey: ["/api/me/moderation-messages/unread-count"],
    retry: false,
    refetchInterval: 60000,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const count = data?.unreadCount ?? 0;
    if (count <= 0) return;

    const latestId = data?.latestUnreadId;
    const idStr = latestId ? String(latestId) : null;

    // Suppression: prefer latestUnreadId, fallback to once-per-session
    if (idStr) {
      if (localStorage.getItem("toyx:lastNotifiedModerationMessageId") === idStr) return;
      if (notifiedIdRef.current === idStr) return;
      notifiedIdRef.current = idStr;
    } else {
      if (sessionToastShown) return;
      sessionToastShown = true;
    }

    const target = idStr ? `/privacy/messages/${latestId}` : "/privacy/messages";

    toast({
      title: "New message from ToyX",
      description: "You have an unread moderation message.",
      action: <ToastAction altText="View message" onClick={() => setLocation(target)}>View</ToastAction>,
      duration: 10000,
    });

    if (idStr) {
      localStorage.setItem("toyx:lastNotifiedModerationMessageId", idStr);
    }
  }, [data, toast, setLocation]);

  return null;
}
