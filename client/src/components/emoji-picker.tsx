import { useState } from "react";
import { Smile } from "lucide-react";

const EMOJIS = [
  "😀", "😂", "🥰", "😍", "🤔", "😎", "🙏", "👍",
  "👎", "👏", "🔥", "💯", "❤️", "😂", "🎉", "✅",
  "⭐", "💪", "🙌", "✨", "🥳", "😢", "😤", "🤗",
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-purple-500 transition-colors"
      >
        <Smile className="w-5 h-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 w-72">
            <div className="grid grid-cols-6 gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onEmojiSelect(emoji);
                    setOpen(false);
                  }}
                  className="w-9 h-9 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
