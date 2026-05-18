import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";
import type { User } from "@shared/schema";

export default function AppHeader() {
  const { user } = useAuth();
  const profile = user as User | undefined;

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg px-6 py-5 flex items-center justify-between relative z-10 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="w-6"></div>

      <Link href="/">
        <div className="cursor-pointer group">
          <img
            src={toyxLogo}
            alt="ToyX"
            className="h-16 w-auto transform group-hover:scale-110 transition-transform duration-300 dark:brightness-0 dark:invert"
          />
        </div>
      </Link>

      <Link href="/profile">
        <Avatar className="w-10 h-10 cursor-pointer hover:scale-110 transition-transform">
          <AvatarImage src={profile?.profileImageUrl || undefined} />
          <AvatarFallback className="bg-purple-500 text-white text-sm font-bold">
            {profile?.firstName?.[0] || profile?.email?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}
