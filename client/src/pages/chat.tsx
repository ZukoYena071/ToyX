import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { ChatMessageSkeleton } from "@/components/loading-skeletons";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ChatMessage from "@/components/chat-message";
import ReviewForm from "@/components/review-form";
import ReportUserModal from "@/components/toys/ReportUserModal";
import EmojiPicker from "@/components/emoji-picker";
import ToyImage from "@/components/ToyImage";
import BottomNav from "@/components/bottom-nav";
import SafetyChecklist from "@/components/SafetyChecklist";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import EmptyState from "@/components/ui/EmptyState";
import { ArrowLeft, Send, Star, Flag, Ban } from "lucide-react";
import type { ExchangeWithDetails, MessageWithSender } from "@shared/schema";
import { isExchangeUnread, markExchangeRead } from "@/lib/chat-utils";

export default function Chat() {
  const { exchangeId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: exchanges } = useQuery<ExchangeWithDetails[]>({
    queryKey: ["/api/exchanges"],
    enabled: !exchangeId,
  });

  const isSystemThread = exchangeId === "system";

  const { data: exchange } = useQuery<ExchangeWithDetails>({
    queryKey: ["/api/exchanges", exchangeId],
    enabled: !!exchangeId && !isSystemThread,
  });

  const { data: messages } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/exchanges", exchangeId, "messages"],
    enabled: !!exchangeId && !isSystemThread,
  });

  // Moderation messages for the system thread
  const { data: modMessages } = useQuery({
    queryKey: ["/api/me/moderation-messages"],
    enabled: exchangeId === "system",
  });

  const { data: modUnreadData } = useQuery({
    queryKey: ["/api/me/moderation-messages/unread-count"],
    enabled: !exchangeId,
    refetchInterval: 60000,
  });
  const modUnreadCount = (modUnreadData as any)?.unreadCount || 0;

  const { data: canReviewData } = useQuery<{ canReview: boolean }>({
    queryKey: ["/api/exchanges", exchangeId, "can-review"],
    enabled: !!exchangeId && !!user && !isSystemThread,
  });

  const blockStatusQueryKey = [`/api/exchanges/${exchangeId}/block-status`] as const;

  const { data: blockStatus } = useQuery<{ blockedByMe: boolean; blockedMe: boolean }>({
    queryKey: blockStatusQueryKey,
    enabled: !!exchangeId && !isSystemThread,
  });

  // Auto-mark moderation messages as read when viewing the system thread
  useEffect(() => {
    if (isSystemThread && modMessages) {
      const msgs: any[] = Array.isArray(modMessages) ? modMessages : (modMessages as any)?.messages || [];
      msgs.forEach((msg: any) => {
        if (!msg.readAt) {
          fetch(`/api/me/moderation-messages/${msg.id}/read`, { method: "PATCH", credentials: "include" }).catch(() => {});
        }
      });
    }
  }, [exchangeId, modMessages]);

  useEffect(() => {
    if (exchangeId) {
      const eid = parseInt(exchangeId);
      markExchangeRead(eid);
      // Also mark read server-side so hasUnread updates on refetch
      fetch(`/api/exchanges/${eid}/read`, { method: "POST", credentials: "include" }).catch(() => {});
    }
  }, [exchangeId]);

  // Refetch exchanges list when returning to refresh indicators
  const prevExchangeRef = useRef(exchangeId);
  useEffect(() => {
    if (prevExchangeRef.current && !exchangeId) {
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
    }
    prevExchangeRef.current = exchangeId;
  }, [exchangeId]);

  useWebSocket((data) => {
    if (data.type === 'new_message' && data.data.exchangeId === parseInt(exchangeId!)) {
      markExchangeRead(parseInt(exchangeId!));
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges", exchangeId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/exchanges/${exchangeId}/messages`, { content, messageType: "text" });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges", exchangeId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
    },
  });

  useEffect(() => { (window as any).__userId = (user as any)?.id; }, [user]);

  const reactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: number; emoji: string }) => {
      return await apiRequest("POST", `/api/exchanges/${exchangeId}/messages/${messageId}/react`, { emoji });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges", exchangeId, "messages"] });
    },
  });

  const confirmExchangeMutation = useMutation({
    mutationFn: async (exchangeId: number) => {
      return await apiRequest("POST", `/api/exchanges/${exchangeId}/confirm`, {});
    },
    onSuccess: () => {
      toast({ title: "Confirmation Recorded", description: "Your completion confirmation has been saved. Waiting for the other party to confirm." });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges", exchangeId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to confirm exchange completion", variant: "destructive" });
    },
  });

  const cancelExchangeMutation = useMutation({
    mutationFn: async (exchangeId: number) => {
      return await apiRequest("PATCH", `/api/exchanges/${exchangeId}/status`, { status: "canceled" });
    },
    onSuccess: () => {
      toast({
        title: "Exchange Canceled",
        description: "The exchange request has been canceled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges", exchangeId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel exchange",
        variant: "destructive",
      });
    },
  });

  const acceptExchangeMutation = useMutation({
    mutationFn: async (exchangeId: number) => {
      return await apiRequest("PATCH", `/api/exchanges/${exchangeId}/status`, { status: "accepted" });
    },
    onSuccess: () => {
      toast({
        title: "Exchange Accepted",
        description: "You've accepted the exchange request. The conversation now includes a safety reminder.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges", exchangeId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept exchange",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (isBlocked) {
      toast({ title: "Messaging disabled", description: "Messaging is disabled because this user is blocked.", variant: "destructive" });
      return;
    }
    if (message.trim() && exchangeId) sendMessageMutation.mutate(message.trim());
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Show exchange list if no specific exchange selected
  if (!exchangeId) {
    return (
      <PageContainer className="pb-24">
        <PageHeader
          title="Messages"
          rightAction={
            <Link href="/">
              <button className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px]">
                <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </Link>
          }
        />

        <div className="px-4 py-6">
          {exchanges?.length === 0 ? (
            <EmptyState icon={<span className="text-6xl">💬</span>} title="No conversations yet" subtitle="Start by requesting an exchange for a toy you're interested in" />
          ) : (
            <div className="space-y-3">
              {/* System thread — ToyX Safety Team */}
              <Link href="/chat/system">
                <SectionCard className={`p-4 hover:shadow-sm transition-all duration-200 ${modUnreadCount > 0 ? 'ring-2 ring-purple-300 dark:ring-purple-700' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-lg">🛡️</span>
                      </div>
                      {modUnreadCount > 0 && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">{modUnreadCount > 9 ? '9+' : modUnreadCount}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">ToyX Safety Team</h3>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Official ToyX Communication</p>
                    </div>
                    {modUnreadCount > 0 && (
                      <div className="bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">{modUnreadCount}</div>
                    )}
                  </div>
                </SectionCard>
              </Link>

              {[...(exchanges || [])].sort((a, b) => {
                const aUnread = (a as any).hasUnread ? 1 : 0;
                const bUnread = (b as any).hasUnread ? 1 : 0;
                if (aUnread !== bUnread) return bUnread - aUnread;
                const aTime = a.messages?.length ? new Date(a.messages[a.messages.length - 1].createdAt ?? 0).getTime() : new Date(a.createdAt ?? 0).getTime();
                const bTime = b.messages?.length ? new Date(b.messages[b.messages.length - 1].createdAt ?? 0).getTime() : new Date(b.createdAt ?? 0).getTime();
                return bTime - aTime;
              }).map((exchange) => {
                const otherUser = exchange.requesterId === (user as any)?.id ? exchange.owner : exchange.requester;
                const lastMessage = exchange.messages?.[exchange.messages.length - 1];

                return (
                  <Link key={exchange.id} href={`/chat/${exchange.id}`}>
                    <SectionCard className="p-4 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">{otherUser.firstName?.[0] || otherUser.email?.[0] || 'U'}</span>
                          </div>
                          {(exchange as any).hasUnread && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                              {otherUser.firstName && otherUser.lastName ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser.email}
                            </h3>
                            <span className="text-xs text-gray-500 shrink-0 ml-2">
                              {lastMessage?.createdAt && new Date(lastMessage.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1 font-medium">{exchange.toy.name}</p>
                          {lastMessage && <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{lastMessage.content}</p>}
                        </div>
                      </div>
                    </SectionCard>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <BottomNav />
      </PageContainer>
    );
  }

  // System conversation — moderation messages thread
  if (exchangeId === "system") {
    const msgs: any[] = Array.isArray(modMessages) ? modMessages : (modMessages as any)?.messages || [];

    return (
      <PageContainer className="pb-24">
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
            <button onClick={() => setLocation("/chat")} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-50">ToyX Safety Team</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg mx-auto min-h-[60vh]">
          {msgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <span className="text-lg mb-2">🛡️</span>
              <p className="text-xs text-gray-400">Messages from the ToyX Safety Team will appear here</p>
            </div>
          ) : (
            msgs.map((msg: any) => (
              <div key={msg.id} className="flex justify-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 max-w-md w-full">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm">🛡️</span>
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {msg.subject || "ToyX Safety Team"}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  <p className="text-[10px] text-blue-400 dark:text-blue-500 mt-1.5">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <BottomNav />
      </PageContainer>
    );
  }

  if (!exchange || !messages) {
    return (
      <PageContainer className="pb-24">
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-3 flex items-center justify-between">
            <button className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center min-h-[44px] min-w-[44px]">
              <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="animate-pulse h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-full" />
            <div className="w-8 h-8" />
          </div>
        </div>
        <div className="px-4 py-6">
          <ChatMessageSkeleton />
        </div>
      </PageContainer>
    );
  }

  const otherUser = exchange.requesterId === (user as any)?.id ? exchange.owner : exchange.requester;
  const isBlocked = !!(blockStatus?.blockedByMe || blockStatus?.blockedMe);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/chat">
              <button className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] shrink-0">
                <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </Link>
            <button
              onClick={() => setLocation(`/users/${otherUser.id}`)}
              className="flex items-center gap-2 min-w-0 min-h-[44px] active:scale-[0.99] transition-transform"
              aria-label="View user profile"
            >
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">{otherUser.firstName?.[0] || otherUser.email?.[0] || 'U'}</span>
              </div>
              <div className="min-w-0 text-left">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                  {otherUser.firstName && otherUser.lastName ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser.email}
                </h3>
                <p className="text-xs text-purple-600 dark:text-purple-400 truncate">{exchange.toy.name}</p>
              </div>
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] shrink-0"
              aria-label="More options"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-50 w-52 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setLocation(`/users/${otherUser.id}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
                  >
                    <Ban className="w-4 h-4 text-gray-400" />
                    View Profile
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-800" />
                  <button
                    onClick={async () => {
                      setShowMenu(false);
                      const action = blockStatus?.blockedByMe ? "unblock" : "block";
                      try {
                        const res = await fetch(`/api/users/${otherUser.id}/${action}`, { method: "POST", credentials: "include" });
                        if (res.ok) {
                          queryClient.setQueryData(blockStatusQueryKey, (old) => ({
                            ...(old ?? { blockedByMe: false, blockedMe: false }),
                            blockedByMe: action === "block",
                          }));
                          queryClient.invalidateQueries({ queryKey: blockStatusQueryKey });
                          toast({ title: blockStatus?.blockedByMe ? "User Unblocked" : "User Blocked", description: blockStatus?.blockedByMe ? "You can now receive messages from this user." : "You have blocked this user." });
                        } else {
                          const err = await res.json();
                          toast({ title: "Error", description: err.message || `Failed to ${action} user`, variant: "destructive" });
                        }
                      } catch {
                        toast({ title: "Error", description: `Failed to ${action} user`, variant: "destructive" });
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[44px]"
                  >
                    <Ban className="w-4 h-4" />
                    {blockStatus?.blockedByMe ? "Unblock User" : "Block User"}
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setShowReportModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[44px]"
                  >
                    <Flag className="w-4 h-4" />
                    Report User
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Exchange toy comparison cards */}
      {exchange && (exchange.offeredToyId || exchange.offeredToy) && (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Their toy (requested) */}
              <button onClick={() => { const url = `/toy/${exchange.toy.id}`; history.pushState(null, "", url); window.location.href = url; }} className="flex-1 min-w-0 text-left cursor-pointer">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                    {exchange.toy.imageUrls?.[0] ? (
                      <ToyImage src={exchange.toy.imageUrls[0]} alt={exchange.toy.name} className="w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><span className="text-2xl">🧸</span></div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">They want</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{exchange.toy.name}</p>
                  </div>
                </div>
              </button>

              {/* Arrow */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
                </div>
                <span className="text-[10px] text-purple-500 font-medium">swap</span>
              </div>

              {/* Their offered toy */}
              <button onClick={() => { const url = `/toy/${(exchange.offeredToyId || exchange.offeredToy?.id)}`; history.pushState(null, "", url); window.location.href = url; }} className="flex-1 min-w-0 text-left cursor-pointer">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                    {(exchange.offeredToy?.imageUrls?.[0] || exchange.toy.imageUrls?.[0]) ? (
                      <ToyImage src={exchange.offeredToy?.imageUrls?.[0] || exchange.toy.imageUrls?.[0]} alt={exchange.offeredToy?.name || exchange.toy.name} className="w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><span className="text-2xl">🧸</span></div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 truncate">They offer</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{exchange.offeredToy?.name || exchange.toy.name}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} isOwn={msg.senderId === (user as any)?.id} onReact={(messageId, emoji) => reactionMutation.mutate({ messageId, emoji })} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Blocked banner */}
      {isBlocked && (
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
              <div className="flex items-start gap-3">
                <Ban className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                    {blockStatus?.blockedByMe ? "User blocked" : "You can't message this user"}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                    {blockStatus?.blockedByMe
                      ? "You won't be able to send or receive messages in this chat."
                      : "Messaging is unavailable for this chat."}
                  </p>
                  {blockStatus?.blockedByMe && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/users/${otherUser.id}/unblock`, { method: "POST", credentials: "include" });
                          if (res.ok) {
                            queryClient.setQueryData(blockStatusQueryKey, (old) => ({
                              ...(old ?? { blockedByMe: false, blockedMe: false }),
                              blockedByMe: false,
                            }));
                            queryClient.invalidateQueries({ queryKey: blockStatusQueryKey });
                            toast({ title: "User Unblocked", description: "You can now send messages in this chat." });
                          }
                        } catch {}
                      }}
                      className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 underline active:opacity-70 min-h-[44px]"
                    >
                      Unblock
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety checklist */}
      <div className="max-w-lg mx-auto px-4 pt-3 pb-1">
        <SafetyChecklist compact />
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="space-y-2">
            {(() => {
              if (!exchange) return null;
              const userIsRequester = exchange.requesterId === (user as any)?.id;
              const userIsOwner = exchange.ownerId === (user as any)?.id;
              const userConfirmed = (userIsRequester && exchange.requesterConfirmed) || (userIsOwner && exchange.ownerConfirmed);

              // ── Pending state: Accept (owner) + Cancel ──
              if (exchange?.status === "pending" && !userConfirmed) {
                return (
                  <div className="flex gap-2">
                    {userIsOwner && (
                      <Button size="sm" onClick={() => acceptExchangeMutation.mutate(exchange.id)} disabled={acceptExchangeMutation.isPending}
                        className="!bg-green-500 hover:!bg-green-600 !text-white">
                        {acceptExchangeMutation.isPending ? "Accepting..." : "Accept"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { if (window.confirm("Are you sure you want to cancel this exchange request?")) { cancelExchangeMutation.mutate(exchange.id); } }}
                      disabled={cancelExchangeMutation.isPending}
                      className="text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20">
                      {cancelExchangeMutation.isPending ? "Cancelling..." : "Cancel"}
                    </Button>
                  </div>
                );
              }

              // ── Accepted state: banner + Mark Complete + Cancel ──
              if (exchange?.status === "accepted" && !userConfirmed) {
                return (
                  <>
                    <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-2xl border border-green-200 dark:border-green-700 text-center">
                      ✅ Exchange accepted — coordinate your meetup safely
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => confirmExchangeMutation.mutate(exchange.id)} disabled={confirmExchangeMutation.isPending}>
                        {confirmExchangeMutation.isPending ? "Confirming..." : "Mark Complete"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { if (window.confirm("Are you sure you want to cancel this exchange request?")) { cancelExchangeMutation.mutate(exchange.id); } }}
                        disabled={cancelExchangeMutation.isPending}
                        className="text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20">
                        {cancelExchangeMutation.isPending ? "Cancelling..." : "Cancel"}
                      </Button>
                    </div>
                  </>
                );
              }

              // ── User has already confirmed — waiting for the other party ──
              if (userConfirmed && exchange?.status !== "completed" && exchange?.status !== "canceled") {
                return (
                  <div className="flex justify-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-2xl border border-blue-200 dark:border-blue-700">
                      ⏳ Waiting for the other party to confirm completion
                    </div>
                  </div>
                );
              }

              return null;
            })()}

            {exchange?.status === "canceled" && (
              <div className="flex justify-center">
                <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:dark:bg-red-900/20 px-3 py-1.5 rounded-2xl border border-red-200 dark:border-red-700">
                  ✕ This exchange has been canceled
                </div>
              </div>
            )}

            {exchange?.status === "completed" && canReviewData?.canReview === true && (
              <div className="flex justify-center">
                <Button size="sm" onClick={() => setShowReviewForm(true)} className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-4">
                  <Star className="w-3 h-3 mr-1" />
                  Leave a Review
                </Button>
              </div>
            )}

            {exchange?.status === "completed" && canReviewData?.canReview === false && (
              <div className="flex justify-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-2xl">
                  ✅ You have already reviewed this exchange
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <EmojiPicker onEmojiSelect={(emoji) => setMessage(prev => prev + emoji)} />
              <input
                type="text"
                placeholder={isBlocked ? "Messaging disabled" : "Type a message..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isBlocked}
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-900 transition-all min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending || isBlocked}
                className="w-10 h-10 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] shrink-0"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReviewForm && (
        <ReviewForm
          exchangeId={parseInt(exchangeId!)}
          revieweeId={otherUser.id}
          revieweeName={otherUser.firstName && otherUser.lastName ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser.email || 'User'}
          onClose={() => {
            setShowReviewForm(false);
            queryClient.invalidateQueries({ queryKey: ["/api/exchanges", exchangeId, "can-review"] });
          }}
        />
      )}

      <ReportUserModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedId={otherUser.id}
        reportedName={otherUser.firstName && otherUser.lastName ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser.email || 'User'}
        contextType="chat"
        contextId={exchangeId}
      />
    </div>
  );
}
