import { useState, useEffect } from "react";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";

interface LoadingLogoProps {
  label?: string;
  className?: string;
  rotating?: boolean;
}

const LOADING_MESSAGES = [
  "Preparing your ToyX community…",
  "Finding toys nearby…",
  "Loading your exchanges…",
  "Almost there…",
];

export default function LoadingLogo({ label, className, rotating }: LoadingLogoProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!rotating) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [rotating]);

  const displayLabel = label || (rotating ? LOADING_MESSAGES[msgIndex] : "Loading...");

  return (
    <div className={`flex flex-col items-center justify-center ${className || ""}`}>
      <div className="relative">
        <img
          src={toyxLogo}
          alt="ToyX"
          className="h-28 w-auto toyx-pulse dark:brightness-110"
        />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/60 to-purple-500/0 rounded-full" />
      </div>
      {displayLabel && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-5 transition-opacity duration-300" key={msgIndex}>
          {displayLabel}
        </p>
      )}
    </div>
  );
}
