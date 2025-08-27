import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Heart, 
  MapPin, 
  Grid3X3, 
  List,
  Home,
  Search,
  MessageCircle,
  User,
  Plus
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PageLoadingSkeleton } from "@/components/loading-skeletons";
import BottomNav from "@/components/bottom-nav";
import { apiRequest } from "@/lib/queryClient";

export default function FavoritesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  // Mutation for removing favorites
  const removeFavoriteMutation = useMutation({
    mutationFn: async (toyId: number) => {
      return await apiRequest(`/api/favorites/${toyId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/toys"] });
    },
  });

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  const favoritesToys = Array.isArray(favorites) ? favorites : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-4 max-w-sm mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/profile">
                <button className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" />
                </button>
              </Link>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">My Favorites</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {viewMode === 'grid' ? (
                  <List className="text-gray-600 dark:text-gray-300 w-4 h-4" />
                ) : (
                  <Grid3X3 className="text-gray-600 dark:text-gray-300 w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-sm mx-auto px-4 py-6">
        {favoritesToys.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No favorites yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Start adding toys to your wishlist by tapping the heart icon</p>
            <Link href="/search">
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200">
                Browse Toys
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {favoritesToys.length} Saved {favoritesToys.length === 1 ? 'Toy' : 'Toys'}
              </h2>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-4">
                {favoritesToys.map((toy: any) => (
                  <Link key={toy.id} href={`/toy/${toy.id}`}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300">
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
                              removeFavoriteMutation.mutate(toy.id);
                            }}
                            className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Heart className="w-3 h-3 text-red-500 fill-current" />
                          </button>
                        </div>
                      </div>

                      {/* Toy Info */}
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-2 line-clamp-2">
                          {toy.name}
                        </h3>
                        <div className="flex items-center space-x-1 mb-2">
                          <MapPin className="text-purple-500 w-3 h-3" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{toy.location || 'Location not set'}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          toy.condition === 'Like New' 
                            ? 'bg-green-100 text-green-700'
                            : toy.condition === 'Excellent'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {toy.condition}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {favoritesToys.map((toy: any) => (
                  <Link key={toy.id} href={`/toy/${toy.id}`}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-lg transition-all duration-300">
                      <div className="flex space-x-4">
                        {/* Toy Image */}
                        <div className="w-20 h-20 bg-gray-50 rounded-xl relative flex-shrink-0">
                          {toy.imageUrls && toy.imageUrls[0] ? (
                            <img
                              src={toy.imageUrls[0]}
                              alt={toy.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-xl">
                              <span className="text-2xl">🧸</span>
                            </div>
                          )}
                          <div className="absolute -top-1 -right-1">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeFavoriteMutation.mutate(toy.id);
                              }}
                              className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Heart className="w-2.5 h-2.5 text-red-500 fill-current" />
                            </button>
                          </div>
                        </div>

                        {/* Toy Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
                            {toy.name}
                          </h3>
                          <div className="flex items-center space-x-1 mb-2">
                            <MapPin className="text-purple-500 w-3 h-3" />
                            <span className="text-xs text-gray-500">{toy.location || 'Location not set'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              toy.condition === 'Like New' 
                                ? 'bg-green-100 text-green-700'
                                : toy.condition === 'Excellent'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {toy.condition}
                            </span>
                            {toy.owner && (
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={toy.owner.profileImageUrl || undefined} />
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                                  {toy.owner.firstName?.[0] || toy.owner.email?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}