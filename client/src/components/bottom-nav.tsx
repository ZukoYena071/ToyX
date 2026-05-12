import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUnreadExchanges } from "@/lib/chat-utils";
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
    fetch("/api/exchanges", { credentials: "include" })
      .then(r => r.json())
      .then(data => setUnreadCount(getUnreadExchanges(data, (user as any).id)))
      .catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/exchanges", { credentials: "include" })
        .then(r => r.json())
        .then(data => setUnreadCount(getUnreadExchanges(data, (user as any).id)))
        .catch(() => {});
    }, 15000);
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 max-w-sm mx-auto safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path + item.label}
                className="flex flex-col items-center space-y-1 py-1"
                onClick={() => handleNavClick(item)}
                data-onboarding={item.onboarding}
              >
                {item.action === "upload" ? (
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <Icon className="text-white w-4 h-4" />
                  </div>
                ) : (
                  <div className="relative">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      isActive 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}>
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400 dark:text-gray-300"}`} />
                    </div>
                    {item.icon === MessageCircle && unreadCount > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                        <span className="text-white text-[10px] font-bold leading-none">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <span className={`text-xs ${
                  isActive 
                    ? "font-medium text-purple-500" 
                    : "text-gray-400 dark:text-gray-300"
                }`}>
                  {item.label}
                </span>
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
