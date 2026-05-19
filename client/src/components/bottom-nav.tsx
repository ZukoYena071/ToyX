import { useLocation } from "wouter";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import UploadOverlay from "./upload-overlay";

const navItems = [
  { path: "/", icon: Home, label: "Home", onboarding: "" },
  { path: "/search", icon: Search, label: "Search", onboarding: "search-tab" },
  { path: "", icon: Plus, label: "Add Toy", action: "upload", onboarding: "upload-button" },
  { path: "/chat", icon: MessageCircle, label: "Messages", onboarding: "chat-tab" },
  { path: "/profile", icon: User, label: "Profile", onboarding: "profile-tab" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const [showUpload, setShowUpload] = useState(false);
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!(user as any)?.id) return;
    const fetchCount = () => {
      fetch("/api/exchanges", { credentials: "include" })
        .then(r => r.json())
        .then(data => {
          const count = (Array.isArray(data) ? data : []).filter((ex: any) => ex.hasUnread).length;
          setUnreadCount(count);
        })
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.action === "upload") {
      setShowUpload(true);
    } else {
      setLocation(item.path);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-950/70 backdrop-blur-xl border-t border-gray-200/70 dark:border-white/10 px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path + item.label}
                className="flex flex-col items-center justify-center gap-1 py-2 min-w-0 relative"
                onClick={() => handleNavClick(item)}
                data-onboarding={item.onboarding}
              >
                {item.action === "upload" ? (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 flex items-center justify-center -translate-y-3">
                    <Icon className="w-6 h-6" />
                  </div>
                ) : (
                  <>
                    <div className={`rounded-xl px-3 py-2 transition-colors duration-150 ${
                      isActive ? "bg-purple-500/15 dark:bg-purple-400/15" : ""
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors duration-150 ${
                        isActive ? "text-purple-600 dark:text-purple-300" : "text-gray-500 dark:text-gray-400"
                      }`} />
                    </div>
                    {item.icon === MessageCircle && unreadCount > 0 && (
                      <div className="absolute top-1 right-1/2 -translate-x-1/2 ml-6 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                        <span className="text-white text-[10px] font-bold leading-none">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {item.action !== "upload" && (
                  <span className={`text-[11px] leading-none transition-colors duration-150 ${
                    isActive
                      ? "font-semibold text-purple-600 dark:text-purple-300"
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {showUpload && (
        <UploadOverlay onClose={() => setShowUpload(false)} />
      )}
    </>
  );
}
