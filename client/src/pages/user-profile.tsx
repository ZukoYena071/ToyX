import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import StarRating from "@/components/star-rating";
import ReviewCard from "@/components/review-card";
import { ArrowLeft, MapPin, Calendar, Star, MessageCircle, Heart } from "lucide-react";
import { ProfileSkeleton, ToyGridSkeleton } from "@/components/loading-skeletons";
import type { User, ToyWithOwner, ReviewWithUser } from "@shared/schema";
import BottomNav from "@/components/bottom-nav";

export default function UserProfile() {
  const { userId } = useParams();
  const [selectedToys, setSelectedToys] = useState<number[]>([]);

  // Get user profile with optimized settings
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
  });

  // Get user's toys with sequential loading
  const { data: userToys, isLoading: toysLoading } = useQuery<ToyWithOwner[]>({
    queryKey: ["/api/users", userId, "toys"],
    enabled: !!userId && !!user, // Only load after user is loaded
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Get user's reviews with sequential loading
  const { data: userReviews } = useQuery<ReviewWithUser[]>({
    queryKey: ["/api/users", userId, "reviews"],
    enabled: !!userId && !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Get user's average rating with sequential loading
  const { data: averageRating } = useQuery<{ rating: number }>({
    queryKey: ["/api/users", userId, "rating"],
    enabled: !!userId && !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const availableToys = userToys?.filter(toy => toy.isAvailable) || [];
  const reviewCount = userReviews?.length || 0;
  const rating = averageRating?.rating || 0;

  const handleToySelection = (toyId: number) => {
    setSelectedToys(prev => 
      prev.includes(toyId) 
        ? prev.filter(id => id !== toyId)
        : [...prev, toyId]
    );
  };

  const handleRequestExchange = () => {
    if (selectedToys.length === 0) return;
    
    console.log("Requesting exchange for toys:", selectedToys);
    console.log("Owner ID:", userId);
    
    // Navigate to exchange request with selected toys
    const toyIds = selectedToys.join(',');
    const url = `/exchange-request?toys=${toyIds}&owner=${userId}`;
    console.log("Navigating to:", url);
    
    // Force full page navigation to preserve query parameters
    window.location.assign(url);
  };

  if (userLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 pb-24">
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
          <div className="px-4 py-4 max-w-sm mx-auto">
            <div className="flex items-center justify-between">
              <Link href="/">
                <button className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" />
                </button>
              </Link>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Profile</h1>
              <div className="w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="max-w-sm mx-auto p-6 text-center mt-20">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">User not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The user you're looking for doesn't exist.</p>
          <Link href="/">
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-4 max-w-sm mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/search">
              <button className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Profile</h1>
            <div className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-sm mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.email?.split('@')[0] || 'User'
                }
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= rating ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {rating.toFixed(1)} ({reviewCount} reviews)
                </span>
              </div>
              <div className="flex items-center space-x-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{availableToys.length}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Available Toys</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{reviewCount}</div>
              <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Reviews</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{rating.toFixed(1)}</div>
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">Rating</div>
            </div>
          </div>
        </div>

        {/* Selected Toys Bar */}
        {selectedToys.length > 0 && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {selectedToys.length} toy{selectedToys.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <button 
                onClick={handleRequestExchange}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200"
              >
                Request Exchange
              </button>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 bg-gray-50 dark:bg-gray-700 rounded-t-2xl p-1">
            <button className="bg-white dark:bg-gray-600 rounded-xl py-3 px-4 text-sm font-medium text-gray-800 dark:text-white shadow-sm">
              Toys ({availableToys.length})
            </button>
            <button className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              Reviews ({reviewCount})
            </button>
          </div>

          <div className="p-4">
            {toysLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-xl aspect-square animate-pulse" />
                ))}
              </div>
            ) : availableToys.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🧸</div>
                <p className="text-gray-500 dark:text-gray-400">No toys available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {availableToys.map((toy) => (
                  <div 
                    key={toy.id} 
                    className={`relative cursor-pointer transition-all rounded-xl border ${
                      selectedToys.includes(toy.id) 
                        ? 'border-purple-300 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                    }`}
                    onClick={() => handleToySelection(toy.id)}
                  >
                    {selectedToys.includes(toy.id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center z-10">
                        <Heart className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl mb-2 overflow-hidden">
                        {toy.imageUrls?.[0] ? (
                          <img 
                            src={toy.imageUrls[0]} 
                            alt={toy.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🧸
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-gray-800 dark:text-white mb-1 line-clamp-2">
                        {toy.name}
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-lg font-medium">
                          {toy.category}
                        </span>
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-lg font-medium">
                          {toy.condition}
                        </span>
                      </div>
                      {toy.location && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{toy.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}