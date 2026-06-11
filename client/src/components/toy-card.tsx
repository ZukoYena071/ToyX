import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Heart, MapPin } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { formatLocation } from "@/lib/formatLocation";
import type { ToyWithOwner } from "@shared/schema";

interface ToyCardProps {
  toy: ToyWithOwner & { distance?: number };
}

export default function ToyCard({ toy }: ToyCardProps) {
  const { settings } = useSettings();
  
  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'like new':
      case 'excellent':
        return 'bg-mint text-white';
      case 'good':
        return 'bg-peach text-white';
      case 'fair':
        return 'bg-powder text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <Card className="bg-white dark:bg-card rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border-0 hover:scale-105 transform">
      <Link href={`/toy/${toy.id}`}>
        <div className="cursor-pointer">
          <div className="relative">
            {toy.imageUrls && toy.imageUrls[0] ? (
              <img 
                src={toy.imageUrls[0]} 
                alt={toy.name}
                className="w-full h-44 object-cover"
              />
            ) : (
              <div className="w-full h-44 bg-gradient-to-br from-cream via-peach/30 to-mint/30 dark:from-muted dark:to-card flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent"></div>
                <div className="w-24 h-24 bg-gradient-to-br from-peach via-mint to-lilac rounded-full flex items-center justify-center shadow-xl transform rotate-12 hover:rotate-0 transition-transform">
                  <span className="text-4xl">🧸</span>
                </div>
              </div>
            )}
            {/* Favorite heart icon overlay */}
            <div className="absolute top-4 right-4">
              <div className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Heart className="w-5 h-5 text-gray-400 hover:text-red-400 transition-colors" />
              </div>
            </div>
            {/* User avatar overlay */}
            <div className="absolute bottom-4 left-4">
              <div 
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Navigating to user profile:", toy.ownerId);
                  window.location.href = `/users/${toy.ownerId}`;
                }}
              >
                <Avatar className="w-10 h-10 border-3 border-white shadow-lg hover:scale-110 transition-transform">
                  <AvatarImage src={toy.owner?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-royal to-powder text-white text-sm font-bold">
                    {toy.owner?.firstName?.[0] || toy.owner?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
          <CardContent className="p-5">
            <h3 className="font-bold text-lg text-charcoal dark:text-foreground mb-2 line-clamp-2 leading-tight">
              {toy.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-muted-foreground mb-3">
              Ages {toy.ageGroup}
            </p>
            <div className="flex items-center justify-between">
              <Badge className={`text-xs px-3 py-1 rounded-full font-medium ${getConditionColor(toy.condition)}`}>
                {toy.condition}
              </Badge>
              <div className="flex items-center text-xs text-gray-500 dark:text-muted-foreground font-medium">
                <MapPin className="w-3 h-3 mr-1" />
                {toy.distance !== undefined 
                  ? `${toy.distance.toFixed(1)}${settings.distanceUnit === 'miles' ? 'mi' : 'km'}`
                  : formatLocation(toy.location) || 'Nearby'
                }
              </div>
            </div>
          </CardContent>
        </div>
      </Link>
      
      {/* Clickable owner info at bottom */}
      <div className="border-t dark:border-border">
        <div 
          className="p-3 hover:bg-gray-50 dark:hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => {
            console.log("Bottom profile click for user:", toy.ownerId);
            window.location.href = `/users/${toy.ownerId}`;
          }}
        >
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={toy.owner?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-royal text-white text-xs">
                {toy.owner?.firstName?.[0] || toy.owner?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600 dark:text-muted-foreground truncate">
              {toy.owner?.firstName
                ? `${toy.owner.firstName}${toy.owner.lastName ? ` ${toy.owner.lastName}` : ''}`
                : toy.owner?.email?.split('@')[0] || 'Unknown'
              }
            </span>
            <span className="text-xs text-gray-400 ml-auto">View Profile →</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
