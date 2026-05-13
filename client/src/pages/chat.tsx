import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
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
import EmojiPicker from "@/components/emoji-picker";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import EmptyState from "@/components/ui/EmptyState";
import { ArrowLeft, Send, Star } from "lucide-react";
import type { ExchangeWithDetails, MessageWithSender } from "@shared/schema";
import { isExchangeUnread, markExchangeRead } from "@/lib/chat-utils";

export default function Chat() {
  const { exchangeId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: exchanges } = useQuery<ExchangeWithDetails[]>({
    queryKey: ["/api/exchanges"],
    enabled: !exchangeId,
  });

  const { data: exchange } = useQuery<ExchangeWithDetails>({
    queryKey: ["/api/exchanges", exchangeId],
    enabled: !!exchangeId,
  });

  const { data: messages } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/exchanges", exchangeId, "messages"],
    enabled: !!exchangeId,
  });

  const { data: canReviewData } = useQuery<{ canReview: boolean }>({
    queryKey: ["/api/exchanges", exchangeId, "can-review"],
    enabled: !!exchangeId && !!user,
  });

  useEffect(() => {
    if (exchangeId) markExchangeRead(parseInt(exchangeId));
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

  const handleSendMessage = () => {
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
              {[...(exchanges || [])].sort((a, b) => {
                const aUnread = isExchangeUnread(a, (user as any)?.id) ? 1 : 0;
                const bUnread = isExchangeUnread(b, (user as any)?.id) ? 1 : 0;
                if (aUnread !== bUnread) return bUnread - aUnread;
                const aTime = a.messages?.length ? new Date(a.messages[a.messages.length - 1].createdAt).getTime() : new Date(a.createdAt).getTime();
                const bTime = b.messages?.length ? new Date(b.messages[b.messages.length - 1].createdAt).getTime() : new Date(b.createdAt).getTime();
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
                          {isExchangeUnread(exchange, (user as any)?.id) && (
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
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">{otherUser.firstName?.[0] || otherUser.email?.[0] || 'U'}</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                  {otherUser.firstName && otherUser.lastName ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser.email}
                </h3>
                <p className="text-xs text-purple-600 dark:text-purple-400 truncate">{exchange.toy.name}</p>
              </div>
            </div>
          </div>
          <button className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] shrink-0">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} isOwn={msg.senderId === (user as any)?.id} onReact={(messageId, emoji) => reactionMutation.mutate({ messageId, emoji })} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="space-y-2">
            {exchange?.status === "pending" && (
              (() => {
                const userIsRequester = exchange.requesterId === (user as any)?.id;
                const userIsOwner = exchange.ownerId === (user as any)?.id;
                const userConfirmed = (userIsRequester && exchange.requesterConfirmed) || (userIsOwner && exchange.ownerConfirmed);
                if (userConfirmed) {
                  return (
                    <div className="flex justify-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-2xl border border-blue-200 dark:border-blue-700">
                        ⏳ Waiting for the other party to confirm completion
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => confirmExchangeMutation.mutate(exchange.id)} disabled={confirmExchangeMutation.isPending}>
                      {confirmExchangeMutation.isPending ? "Confirming..." : "Mark Complete"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to cancel this exchange request?")) {
                          cancelExchangeMutation.mutate(exchange.id);
                        }
                      }}
                      disabled={cancelExchangeMutation.isPending}
                      className="text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {cancelExchangeMutation.isPending ? "Cancelling..." : "Cancel"}
                    </Button>
                  </div>
                );
              })()
            )}

            {exchange?.status === "canceled" && (
              <div className="flex justify-center">
                <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-2xl border border-red-200 dark:border-red-700">
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
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-900 transition-all min-h-[44px]"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
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
    </div>
  );
}
