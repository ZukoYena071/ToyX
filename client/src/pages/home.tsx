import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Plus, Search, Bell, Settings, ChevronRight, Heart, MessageCircle, User, Home, MapPin, ChevronLeft, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UploadOverlay from "@/components/upload-overlay";
import BottomNav from "@/components/bottom-nav";
import { PageLoadingSkeleton } from "@/components/loading-skeletons";
import { apiRequest } from "@/lib/queryClient";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";

export default function HomePage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: toys, isLoading } = useQuery({
    queryKey: ["/api/toys"],
  });

  // Mutation for favoriting toys
  const favoriteMutation = useMutation({
    mutationFn: async ({ toyId, isFavorited }: { toyId: number; isFavorited: boolean }) => {
      console.log('Favoriting toy:', { toyId, isFavorited });
      if (isFavorited) {
        // Remove from favorites
        return await apiRequest('DELETE', `/api/favorites/${toyId}`);
      } else {
        // Add to favorites
        return await apiRequest('POST', '/api/favorites', { toyId });
      }
    },
    onSuccess: () => {
      console.log('Favorite mutation successful');
      queryClient.invalidateQueries({ queryKey: ["/api/toys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: (error) => {
      console.error('Favorite mutation error:', error);
    },
  });

  const categories = ['All', 'Action Figures', 'Dolls', 'Building', 'Educational', 'Outdoor'];

  // Process toys for different sections
  const allToys = Array.isArray(toys) ? toys : [];
  
  // Filter by search and category
  const baseFilteredToys = allToys.filter((toy: any) => {
    const matchesCategory = activeCategory === 'All' || toy.category === activeCategory;
    const matchesSearch = toy.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Available toys (nearest) - first 6 toys
  const nearestToys = baseFilteredToys.slice(0, 6);
  
  // Recently added toys - different toys from the nearest ones
  const recentlyAddedToys = allToys
    .filter((toy: any) => {
      const matchesCategory = activeCategory === 'All' || toy.category === activeCategory;
      const matchesSearch = toy.name.toLowerCase().includes(searchQuery.toLowerCase());
      // Exclude toys already shown in nearest section
      const notInNearest = !nearestToys.some((nearestToy: any) => nearestToy.id === toy.id);
      return matchesCategory && matchesSearch && notInNearest;
    })
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Sticky Header - Logo and Profile Only */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-2 max-w-sm mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src={toyxLogo} 
                alt="ToyX" 
                className="h-20 w-auto dark:brightness-0 dark:invert"
              />
            </div>
            <Link href="/profile">
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">
                  {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-sm mx-auto">
        {/* Search Bar and Filters */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <div className="px-4 py-4">
            {/* Search Bar */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400 w-4 h-4" />
              </div>
              <Input
                type="text"
                placeholder="Search for toys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 w-4 h-4 transition-colors" />
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200 ${
                    activeCategory === category
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 space-y-8">
          {/* Available Toys Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Available Toys</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Nearest to you</p>
              </div>
              <Link href="/search?nearest=true">
                <button className="text-purple-500 dark:text-purple-400 text-sm font-medium hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
                  View All
                </button>
              </Link>
            </div>

            {/* Horizontal Scrolling Toys */}
            <div className="relative">
              {/* Left Arrow Indicator */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-700 rounded-full shadow-lg p-2 opacity-70">
                <ChevronLeft className="w-4 h-4 text-purple-500" />
              </div>
              
              {/* Right Arrow Indicator */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-700 rounded-full shadow-lg p-2 opacity-70">
                <ChevronRight className="w-4 h-4 text-purple-500" />
              </div>
              
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide px-8">
                {nearestToys.map((toy: any) => (
                <Link key={`nearest-${toy.id}`} href={`/toy/${toy.id}`}>
                  <div className="flex-shrink-0 w-40 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300">
                    {/* Toy Image */}
                    <div className="aspect-square bg-gray-50 dark:bg-gray-700 relative">
                      {toy.imageUrls && toy.imageUrls[0] ? (
                        <img
                          src={toy.imageUrls[0]}
                          alt={toy.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                          <span className="text-3xl">🧸</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Heart clicked (nearest):', toy.id, toy.isFavorited);
                            favoriteMutation.mutate({ toyId: toy.id, isFavorited: toy.isFavorited || false });
                          }}
                          className="w-6 h-6 bg-white dark:bg-gray-600 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                          disabled={favoriteMutation.isPending}
                        >
                          <Heart className={`w-3 h-3 ${toy.isFavorited ? 'text-red-500 fill-current' : 'text-gray-400 dark:text-gray-300'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Toy Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800 dark:text-white text-xs mb-1 line-clamp-2">
                        {toy.name}
                      </h3>
                      <div className="flex items-center space-x-1 mb-2">
                        <MapPin className="text-purple-500 w-2.5 h-2.5" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{toy.location || 'Unknown location'}</span>

                      </div>
                      <div className="flex flex-col space-y-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                          toy.condition === 'Like New' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : toy.condition === 'Excellent'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {toy.condition}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/users/${toy.ownerId}`;
                          }}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-1.5 rounded-full text-xs font-medium hover:shadow-lg transition-all duration-200 w-full"
                        >
                          Request
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              
                {nearestToys.length === 0 && (
                  <div className="flex-shrink-0 w-40 h-60 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                    <p className="text-gray-400 dark:text-gray-500 text-sm text-center px-4">No toys found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recently Added Section - Only show if we have different toys */}
          {recentlyAddedToys.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Recently Added</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Fresh listings in your area</p>
                </div>
                <Link href="/search?recent=true">
                  <button className="text-purple-500 dark:text-purple-400 text-sm font-medium hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
                    View All
                  </button>
                </Link>
              </div>

            {/* Horizontal Scrolling Toys */}
            <div className="relative">
              {/* Left Arrow Indicator */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-lg p-2 opacity-70">
                <ChevronLeft className="w-4 h-4 text-purple-500" />
              </div>
              
              {/* Right Arrow Indicator */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-lg p-2 opacity-70">
                <ChevronRight className="w-4 h-4 text-purple-500" />
              </div>
              
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide px-8">
                {recentlyAddedToys.map((toy: any) => (
                <Link key={`recent-${toy.id}`} href={`/toy/${toy.id}`}>
                  <div className="flex-shrink-0 w-40 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                    {/* Toy Image */}
                    <div className="aspect-square bg-gray-50 relative">
                      {toy.imageUrls && toy.imageUrls[0] ? (
                        <img
                          src={toy.imageUrls[0]}
                          alt={toy.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-3xl">🧸</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Heart clicked (recent):', toy.id, toy.isFavorited);
                            favoriteMutation.mutate({ toyId: toy.id, isFavorited: toy.isFavorited || false });
                          }}
                          className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                          disabled={favoriteMutation.isPending}
                        >
                          <Heart className={`w-3 h-3 ${toy.isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                        </button>
                      </div>
                      {/* New Badge for recently added */}
                      <div className="absolute top-2 left-2">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          New
                        </span>
                      </div>
                    </div>

                    {/* Toy Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800 text-xs mb-1 line-clamp-2">
                        {toy.name}
                      </h3>
                      <div className="flex items-center space-x-1 mb-2">
                        <MapPin className="text-purple-500 w-2.5 h-2.5" />
                        <span className="text-xs text-gray-500 truncate">{toy.location || 'Unknown location'}</span>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                          toy.condition === 'Like New' 
                            ? 'bg-green-100 text-green-700'
                            : toy.condition === 'Excellent'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {toy.condition}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/users/${toy.ownerId}`;
                          }}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-1.5 rounded-full text-xs font-medium hover:shadow-lg transition-all duration-200 w-full"
                        >
                          Request
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              
                {recentlyAddedToys.length === 0 && (
                  <div className="flex-shrink-0 w-40 h-60 bg-gray-50 rounded-2xl flex items-center justify-center">
                    <p className="text-gray-400 text-sm text-center px-4">No recent toys</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Use the shared BottomNav component */}
      <BottomNav />
    </div>
  );
}