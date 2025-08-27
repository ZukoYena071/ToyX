interface OnboardingCharacterProps {
  emotion: "happy" | "excited" | "pointing" | "waving" | "thumbsup";
  size?: "small" | "medium" | "large";
}

export default function OnboardingCharacter({ emotion, size = "medium" }: OnboardingCharacterProps) {
  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-16 h-16", 
    large: "w-24 h-24"
  };

  const getCharacterEmoji = () => {
    switch (emotion) {
      case "happy":
        return "😊";
      case "excited":
        return "🤩";
      case "pointing":
        return "👉";
      case "waving":
        return "👋";
      case "thumbsup":
        return "👍";
      default:
        return "😊";
    }
  };

  const getAnimationClass = () => {
    switch (emotion) {
      case "waving":
        return "animate-pulse";
      case "excited":
        return "animate-bounce";
      case "pointing":
        return "animate-pulse";
      default:
        return "";
    }
  };

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-peach via-mint to-lilac rounded-full flex items-center justify-center shadow-lg ${getAnimationClass()}`}>
      <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
        <span className="text-2xl">🧸</span>
      </div>
      {/* Emotion indicator */}
      <div className="absolute -top-1 -right-1 text-lg">
        {getCharacterEmoji()}
      </div>
    </div>
  );
}