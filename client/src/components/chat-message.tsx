import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { MessageWithSender } from "@shared/schema";

interface ChatMessageProps {
  message: MessageWithSender;
  isOwn: boolean;
}

export default function ChatMessage({ message, isOwn }: ChatMessageProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end space-x-2 max-w-xs ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {!isOwn && (
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {message.sender.firstName?.[0] || message.sender.email?.[0] || 'U'}
            </span>
          </div>
        )}
        <div 
          className={`rounded-2xl px-4 py-2 ${
            isOwn 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-tr-sm' 
              : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
          }`}
        >
          <p className="text-sm">{message.content}</p>
          <p className={`text-xs mt-1 ${
            isOwn ? 'text-purple-100' : 'text-gray-500'
          }`}>
            {new Date(message.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
