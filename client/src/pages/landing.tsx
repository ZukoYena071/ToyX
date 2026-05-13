import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";

const CARDS = [
  {
    title: "Browse Toys",
    desc: "Discover amazing toys shared by families in your community",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    darkImg: "/assets/landing/browse-dark.png",
    lightImg: "/assets/landing/browse-light.png",
  },
  {
    title: "Share Your Toys",
    desc: "List toys your children have outgrown for other families to enjoy",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    darkImg: "/assets/landing/share-dark.png",
    lightImg: "/assets/landing/share-light.png",
  },
  {
    title: "Connect & Exchange",
    desc: "Chat with other parents and arrange safe toy exchanges",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    darkImg: "/assets/landing/exchange-dark.png",
    lightImg: "/assets/landing/exchange-light.png",
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-slate-950 dark:to-indigo-950 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img
            src={toyxLogo}
            alt="ToyX"
            className="h-40 w-auto mx-auto mb-4 drop-shadow-[0_12px_34px_rgba(168,85,247,0.35)] dark:brightness-110"
          />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">
            Welcome to ToyX!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Share toys, spread joy
          </p>
        </div>

        {/* Feature cards */}
        <div className="w-full space-y-4 mb-8">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="relative rounded-2xl overflow-hidden h-[280px] sm:h-[300px]"
            >
              <img
                src={isDark ? card.darkImg : card.lightImg}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Readability scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/35 to-transparent dark:from-black/75 dark:via-black/30 dark:to-transparent" />
              {/* Glass panel at bottom */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-white/70 dark:bg-gray-950/40 border-t border-gray-200 dark:border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {card.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {card.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="w-full">
          <button
            onClick={() => setLocation("/welcome")}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base font-semibold hover:from-purple-600 hover:to-pink-600 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Get Started with ToyX
          </button>
          <div className="text-center mt-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
            </span>
            <Link
              href="/login"
              className="text-xs font-semibold text-purple-500 hover:text-purple-600"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
