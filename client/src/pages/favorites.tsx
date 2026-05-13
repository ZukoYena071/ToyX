import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Heart, MapPin } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PageLoadingSkeleton } from "@/components/loading-skeletons";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import EmptyState from "@/components/ui/EmptyState";
import BadgePill from "@/components/ui/BadgePill";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export default function FavoritesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

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
    <PageContainer className="pb-24">
      <PageHeader
        title="My Favorites"
        rightAction={
          <Link href="/profile">
            <button className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px]">
              <ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" />
            </button>
          </Link>
        }
      />

      <div className="px-4 py-6">
        {favoritesToys.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-16 h-16" />}
            title="No favorites yet"
            subtitle="Start adding toys to your wishlist by tapping the heart icon"
            action={
              <Link href="/search">
                <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-colors min-h-[44px]">
                  Browse Toys
                </button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
              {favoritesToys.length} Saved {favoritesToys.length === 1 ? 'Toy' : 'Toys'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {favoritesToys.map((toy: any) => (
                <Link key={toy.id} href={`/toy/${toy.id}`}>
                  <SectionCard className="overflow-hidden p-0">
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
                            removeFavoriteMutation.mutate(toy.id);
                          }}
                          className="w-7 h-7 bg-white dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Heart className="w-3 h-3 text-red-500 fill-current" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 line-clamp-2">
                        {toy.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <MapPin className="text-purple-500 w-3 h-3" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{toy.location || 'Location not set'}</span>
                      </div>
                      <BadgePill
                        label={toy.condition}
                        variant={toy.condition === 'Like New' ? 'success' : toy.condition === 'Excellent' ? 'info' : 'warning'}
                      />
                    </div>
                  </SectionCard>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </PageContainer>
  );
}
