import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { ChatMessageSkeleton } from "@/components/loading-skeletons";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ChatMessage from "@/components/chat-message";
import ReviewForm from "@/components/review-form";
import EmojiPicker from "@/components/emoji-picker";
import BottomNav from "@/components/bottom-nav";
import { ArrowLeft, Send, Paperclip, Star } from "lucide-react";
import type { ExchangeWithDetails, MessageWithSender } from "@shared/schema";
import { isExchangeUnread, markExchangeRead, getUnreadExchanges } from "@/lib/chat-utils";

export default function Chat() {
  const { exchangeId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get exchanges if no specific exchangeId
  const { data: exchanges } = useQuery<ExchangeWithDetails[]>({
    queryKey: ["/api/exchanges"],
    enabled: !exchangeId,
  });

  // Get specific exchange if exchangeId provided
  const { data: exchange } = useQuery<ExchangeWithDetails>({
    queryKey: ["/api/exchanges", exchangeId],
    enabled: !!exchangeId,
  });

  // Get messages for the exchange
  const { data: messages } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/exchanges", exchangeId, "messages"],
    enabled: !!exchangeId,
  });

  // Check if user can review this exchange
  const { data: canReviewData } = useQuery<{ canReview: boolean }>({
    queryKey: ["/api/exchanges", exchangeId, "can-review"],
    enabled: !!exchangeId && !!user,
  });

  // Mark exchange as read when viewing
  useEffect(() => {
    if (exchangeId) {
      markExchangeRead(parseInt(exchangeId));
    }
  }, [exchangeId]);

  // WebSocket for real-time messaging
  useWebSocket((data) => {
    if (data.type === 'new_message' && data.data.exchangeId === parseInt(exchangeId!)) {
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges", exchangeId, "messages"] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/exchanges/${exchangeId}/messages`, {
        content,
        messageType: "text",
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges", exchangeId, "messages"] });
    },
  });

  // Set window userId for reaction highlighting
  useEffect(() => {
    (window as any).__userId = (user as any)?.id;
  }, [user]);

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
      toast({
        title: "Confirmation Recorded",
        description: "Your completion confirmation has been saved. Waiting for the other party to confirm.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges", exchangeId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm exchange completion",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (message.trim() && exchangeId) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show exchange list if no specific exchange selected
  if (!exchangeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 pb-24">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
          <div className="px-4 py-4 max-w-sm mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/">
                  <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <ArrowLeft className="w-4 h-4 text-gray-600" />
                  </button>
                </Link>
                <h1 className="text-xl font-bold text-gray-800">Messages</h1>
              </div>
              <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="max-w-sm mx-auto">
          <div className="p-4">
            {exchanges?.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="font-semibold text-gray-800 mb-2">No conversations yet</h3>
                <p className="text-gray-500 text-sm">
                  Start by requesting an exchange for a toy you're interested in
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...(exchanges || [])].sort((a, b) => {
                  const aTime = a.messages?.length ? new Date(a.messages[a.messages.length - 1].createdAt).getTime() : new Date(a.createdAt).getTime();
                  const bTime = b.messages?.length ? new Date(b.messages[b.messages.length - 1].createdAt).getTime() : new Date(b.createdAt).getTime();
                  return bTime - aTime;
                }).map((exchange) => {
                  const otherUser = exchange.requesterId === (user as any)?.id ? exchange.owner : exchange.requester;
                  const lastMessage = exchange.messages?.[exchange.messages.length - 1];
                  
                  return (
                    <Link key={exchange.id} href={`/chat/${exchange.id}`}>
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <div className="flex items-center space-x-3 p-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">
                                {otherUser.firstName?.[0] || otherUser.email?.[0] || 'U'}
                              </span>
                            </div>
                            {isExchangeUnread(exchange, (user as any)?.id) && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-800 truncate">
                                {otherUser.firstName && otherUser.lastName 
                                  ? `${otherUser.firstName} ${otherUser.lastName}`
                                  : otherUser.email
                                }
                              </h3>
                              <span className="text-xs text-gray-500">
                                {lastMessage && lastMessage.createdAt && new Date(lastMessage.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-purple-600 mb-1 font-medium">
                              {exchange.toy.name}
                            </p>
                            {lastMessage && (
                              <p className="text-sm text-gray-600 truncate">
                                {lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    );
  }

  if (!exchange || !messages) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
          <div className="px-4 py-4 max-w-sm mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="animate-pulse h-6 w-24 bg-gray-200 rounded-full"></div>
              </div>
              <div className="w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="max-w-sm mx-auto p-4">
          <ChatMessageSkeleton />
        </div>
      </div>
    );
  }

  const otherUser = exchange.requesterId === (user as any)?.id ? exchange.owner : exchange.requester;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 py-4 max-w-sm mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/chat">
                <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {otherUser.firstName?.[0] || otherUser.email?.[0] || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {otherUser.firstName && otherUser.lastName 
                      ? `${otherUser.firstName} ${otherUser.lastName}`
                      : otherUser.email
                    }
                  </h3>
                  <p className="text-xs text-purple-600">
                    {exchange.toy.name}
                  </p>
                </div>
              </div>
            </div>
            <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-sm mx-auto p-4 space-y-4">
          {messages.map((msg) => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              isOwn={msg.senderId === (user as any)?.id} 
              onReact={(messageId, emoji) => reactionMutation.mutate({ messageId, emoji })}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-sm mx-auto p-4">
          <div className="space-y-3">
          {/* Exchange Completion Buttons */}
          {exchange?.status === "pending" && (
            (() => {
              const userIsRequester = exchange.requesterId === (user as any)?.id;
              const userIsOwner = exchange.ownerId === (user as any)?.id;
              const userConfirmed = (userIsRequester && exchange.requesterConfirmed) || (userIsOwner && exchange.ownerConfirmed);
              
              if (userConfirmed) {
                return (
                  <div className="flex justify-center">
                    <div className="text-sm text-gray-500 dark:text-muted-foreground bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-2xl border border-blue-200 dark:border-blue-700">
                      ⏳ Waiting for the other party to confirm completion
                    </div>
                  </div>
                );
              }
              
              return (
                <div className="flex justify-center">
                  <Button
                    onClick={() => confirmExchangeMutation.mutate(exchange.id)}
                    disabled={confirmExchangeMutation.isPending}
                    className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white rounded-2xl px-6"
                  >
                    {confirmExchangeMutation.isPending ? "Confirming..." : "Mark Exchange Complete"}
                  </Button>
                </div>
              );
            })()
          )}

          {/* Review Button for Completed Exchanges */}
          {exchange?.status === "completed" && canReviewData?.canReview === true && (
            <div className="flex justify-center">
              <Button
                onClick={() => setShowReviewForm(true)}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-2xl px-6"
              >
                <Star className="w-4 h-4 mr-2" />
                Leave a Review
              </Button>
            </div>
          )}
          
          {/* Show message if already reviewed */}
          {exchange?.status === "completed" && canReviewData?.canReview === false && (
            <div className="flex justify-center">
              <div className="text-sm text-gray-500 dark:text-muted-foreground bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl">
                ✅ You have already reviewed this exchange
              </div>
            </div>
          )}

            <div className="flex items-center space-x-3">
              <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <Paperclip className="w-5 h-5 text-gray-500" />
              </button>
              <EmojiPicker onEmojiSelect={(emoji) => setMessage(prev => prev + emoji)} />
              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 text-sm border-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-all"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          exchangeId={parseInt(exchangeId!)}
          revieweeId={otherUser.id}
          revieweeName={otherUser.firstName && otherUser.lastName 
            ? `${otherUser.firstName} ${otherUser.lastName}`
            : otherUser.email || 'User'
          }
          onClose={() => {
            setShowReviewForm(false);
            // Refresh review eligibility after form closes
            queryClient.invalidateQueries({ queryKey: ["/api/exchanges", exchangeId, "can-review"] });
          }}
        />
      )}
    </div>
  );
}
