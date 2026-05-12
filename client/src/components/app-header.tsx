import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";

export default function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="bg-white/95 dark:bg-background/95 backdrop-blur-lg px-6 py-5 flex items-center justify-between relative z-10 shadow-sm border-b border-gray-100 dark:border-border">
      <div className="w-6"></div>
      
      {/* ToyX Logo */}
      <Link href="/">
        <div className="cursor-pointer group">
          <img 
            src={toyxLogo} 
            alt="ToyX" 
            className="h-20 w-auto transform group-hover:scale-110 transition-transform duration-300 drop-shadow-lg"
          />
        </div>
      </Link>
      
      <Link href="/profile">
        <Avatar className="w-12 h-12 cursor-pointer border-3 border-white shadow-xl hover:scale-110 transition-transform">
          <AvatarImage src={user?.profileImageUrl || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-royal via-powder to-mint text-white text-lg font-bold">
            {user?.firstName?.[0] || user?.email?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}
