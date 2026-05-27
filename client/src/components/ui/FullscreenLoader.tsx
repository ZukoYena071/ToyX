import { useState, useEffect, useRef } from "react";

const MESSAGES = [
  "Preparing your ToyX community…",
  "Finding toys nearby…",
  "Loading your exchanges…",
  "Almost there…",
];

export default function FullscreenLoader() {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    // Simulated progress: 0→65% fast, 65→88% slower, 88→99% held until unmount
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const target = elapsed < 400 ? 65 : elapsed < 900 ? 88 : 99;
      setProgress((prev) => Math.min(prev + (target - prev) * 0.08 + 0.3, target));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Rotate messages every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-slate-950 to-indigo-950 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Logo */}
      <div className="relative mb-8">
        <img
          src="https://toyxchange.online/assets/toyx-logo.png"
          alt="ToyX"
          className="h-36 w-auto toyx-pulse dark:brightness-110"
        />
      </div>

      {/* Loading message */}
      <p className="text-sm text-gray-400 mb-8 h-5 transition-opacity duration-300" key={msgIndex}>
        {MESSAGES[msgIndex]}
      </p>

      {/* Progress bar */}
      <div className="w-48 h-0.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-200 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
