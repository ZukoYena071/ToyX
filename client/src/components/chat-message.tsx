import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import type { MessageWithSender } from "@shared/schema";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface ChatMessageProps {
  message: MessageWithSender;
  isOwn: boolean;
  onReact: (messageId: number, emoji: string) => void;
}

export default function ChatMessage({ message, isOwn, onReact }: ChatMessageProps) {
  const [showReactions, setShowReactions] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const reactions: Array<{ userId: string; emoji: string }> = (message as any).reactions || [];

  const grouped = reactions.reduce((acc: Record<string, string[]>, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r.userId);
    return acc;
  }, {} as Record<string, string[]>);

  useEffect(() => {
    if (!showReactions || !pickerRef.current) return;
    const rect = pickerRef.current.getBoundingClientRect();
    if (rect.top < 60) {
      pickerRef.current.style.top = "auto";
      pickerRef.current.style.bottom = "100%";
      pickerRef.current.style.marginBottom = "4px";
    }
  }, [showReactions]);

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} relative group`}>
      <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shrink-0 mb-1">
          <span className="text-white text-xs font-bold">
            {message.sender.firstName?.[0] || message.sender.email?.[0] || 'U'}
          </span>
        </div>

        {/* Message + Reactions */}
        <div className="flex flex-col min-w-0">
          {/* Bubble */}
          <div className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-purple-500 text-white rounded-tr-sm'
              : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 rounded-tl-sm shadow-sm border border-gray-200 dark:border-gray-800'
          }`}>
            <p className={`text-xs mb-1 font-medium ${
              isOwn ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {message.sender.firstName || message.sender.email}
            </p>
            <p className="text-sm">{message.content}</p>
            <p className={`text-xs mt-1 ${
              isOwn ? 'text-purple-200' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Reaction badges */}
          {Object.entries(grouped).length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {Object.entries(grouped).map(([emoji, users]) => (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                    users.some(u => u === (window as any).__userId)
                      ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-700'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-gray-600 dark:text-gray-300">{users.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reaction button on hover */}
      <div className={`absolute bottom-0 ${isOwn ? 'right-[calc(100%+4px)]' : 'left-[calc(100%+4px)]'} opacity-0 group-hover:opacity-100 transition-opacity`}>
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="min-w-[36px] min-h-[36px] bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Smile className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {showReactions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowReactions(false)} />
              <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg px-2.5 py-1.5 flex gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(message.id, emoji);
                      setShowReactions(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
