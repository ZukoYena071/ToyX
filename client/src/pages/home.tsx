import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Search, Heart, MapPin, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UploadOverlay from "@/components/upload-overlay";
import BottomNav from "@/components/bottom-nav";
import { PageLoadingSkeleton } from "@/components/loading-skeletons";
import PageContainer from "@/components/ui/PageContainer";
import SectionCard from "@/components/ui/SectionCard";
import BadgePill from "@/components/ui/BadgePill";
import ToyFeedCard from "@/components/toys/ToyFeedCard";
import { apiRequest } from "@/lib/queryClient";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";

export default function HomePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: toys, isLoading } = useQuery({
    queryKey: ["/api/toys"],
  });

  const { data: recs } = useQuery({
    queryKey: ["/api/recommendations/home"],
    enabled: !!user,
  });

  const favoriteMutation = useMutation({
    mutationFn: async ({ toyId, isFavorited }: { toyId: number; isFavorited: boolean }) => {
      if (isFavorited) {
        return await apiRequest('DELETE', `/api/favorites/${toyId}`);
      } else {
        return await apiRequest('POST', '/api/favorites', { toyId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/toys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: (error) => {
      console.error('Favorite mutation error:', error);
    },
  });

  const categories = ['All', 'Action Figures', 'Dolls', 'Building', 'Educational', 'Outdoor'];

  const allToys = Array.isArray(toys) ? toys : [];

  const baseFilteredToys = allToys.filter((toy: any) => {
    const matchesCategory = activeCategory === 'All' || toy.category === activeCategory;
    const matchesSearch = toy.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const nearestToys = baseFilteredToys.slice(0, 6);

  const recentlyAddedToys = allToys
    .filter((toy: any) => {
      const matchesCategory = activeCategory === 'All' || toy.category === activeCategory;
      const matchesSearch = toy.name.toLowerCase().includes(searchQuery.toLowerCase());
      const notInNearest = !nearestToys.some((nearestToy: any) => nearestToy.id === toy.id);
      return matchesCategory && matchesSearch && notInNearest;
    })
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <PageContainer className="pb-24">
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-2">
          <img
            src={toyxLogo}
            alt="ToyX"
            className="h-16 w-auto dark:brightness-0 dark:invert"
          />
          <Link href="/profile">
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-purple-500 text-white text-sm">
                {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400 w-4 h-4" />
            </div>
            <Input
              type="text"
              placeholder="Search for toys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-[44px]"
              >
                <X className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors duration-150 min-h-[44px] ${
                  activeCategory === category
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* For You section */}
        {!!((recs as any)?.forYou?.length) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">For You</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(recs as any).meta?.usedLocation ? "Near you, matched to your tastes" : "Matched to your preferences"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(recs as any).forYou.slice(0, 6).map((toy: any) => (
                <ToyFeedCard
                  key={toy.id}
                  toy={toy}
                  onOpen={() => window.location.href = `/toy/${toy.id}`}
                  onToggleFavorite={() => favoriteMutation.mutate({ toyId: toy.id, isFavorited: toy.isFavorited || false })}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Available Toys</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nearest to you</p>
            </div>
            <Link href="/search?nearest=true">
              <span className="text-sm font-medium text-purple-500 hover:text-purple-600 transition-colors">
                View All
              </span>
            </Link>
          </div>

          <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-900 rounded-full shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-purple-500" />
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-900 rounded-full shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-purple-500" />
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-8">
              {nearestToys.map((toy: any) => (
                <Link key={`nearest-${toy.id}`} href={`/toy/${toy.id}`}>
                  <div className="flex-shrink-0 w-40 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-sm transition-all duration-200">
                    <div className="aspect-square bg-gray-50 dark:bg-gray-800 relative">
                      {toy.imageUrls && toy.imageUrls[0] ? (
                        <img
                          src={toy.imageUrls[0]}
                          alt={toy.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <span className="text-3xl">🧸</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            favoriteMutation.mutate({ toyId: toy.id, isFavorited: toy.isFavorited || false });
                          }}
                          className="w-7 h-7 bg-white dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          disabled={favoriteMutation.isPending}
                        >
                          <Heart className={`w-3 h-3 ${toy.isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 line-clamp-2">
                        {toy.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <MapPin className="text-purple-500 w-2.5 h-2.5" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{toy.location || 'Unknown location'}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <BadgePill
                          label={toy.condition}
                          variant={toy.condition === 'Like New' ? 'success' : toy.condition === 'Excellent' ? 'info' : 'warning'}
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/users/${toy.ownerId}`;
                          }}
                          className="bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-xl text-xs font-medium transition-colors w-full min-h-[44px]"
                        >
                          Request
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {nearestToys.length === 0 && (
                <div className="flex-shrink-0 w-40 h-60 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                  <p className="text-gray-400 dark:text-gray-500 text-sm text-center px-4">No toys found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {recentlyAddedToys.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Recently Added</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fresh listings in your area</p>
              </div>
              <Link href="/search?recent=true">
                <span className="text-sm font-medium text-purple-500 hover:text-purple-600 transition-colors">
                  View All
                </span>
              </Link>
            </div>

            <div className="relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-900 rounded-full shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center">
                <ChevronLeft className="w-4 h-4 text-purple-500" />
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-900 rounded-full shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-purple-500" />
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-8">
                {recentlyAddedToys.map((toy: any) => (
                  <Link key={`recent-${toy.id}`} href={`/toy/${toy.id}`}>
                    <div className="flex-shrink-0 w-40 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-sm transition-all duration-200">
                      <div className="aspect-square bg-gray-50 dark:bg-gray-800 relative">
                        {toy.imageUrls && toy.imageUrls[0] ? (
                          <img
                            src={toy.imageUrls[0]}
                            alt={toy.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <span className="text-3xl">🧸</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="bg-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">New</span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              favoriteMutation.mutate({ toyId: toy.id, isFavorited: toy.isFavorited || false });
                            }}
                            className="min-w-[44px] min-h-[44px] bg-white dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            disabled={favoriteMutation.isPending}
                          >
                            <Heart className={`w-4 h-4 ${toy.isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                          </button>
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 line-clamp-2">
                          {toy.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          <MapPin className="text-purple-500 w-2.5 h-2.5" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{toy.location || 'Unknown location'}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <BadgePill
                            label={toy.condition}
                            variant={toy.condition === 'Like New' ? 'success' : toy.condition === 'Excellent' ? 'info' : 'warning'}
                          />
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/users/${toy.ownerId}`;
                            }}
                            className="bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-xl text-xs font-medium transition-colors w-full min-h-[44px]"
                          >
                            Request
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {recentlyAddedToys.length === 0 && (
                  <div className="flex-shrink-0 w-40 h-60 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                    <p className="text-gray-400 dark:text-gray-500 text-sm text-center px-4">No recent toys</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </PageContainer>
  );
}
