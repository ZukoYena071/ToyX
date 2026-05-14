import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UploadOverlay from "@/components/upload-overlay";
import BottomNav from "@/components/bottom-nav";
import { PageLoadingSkeleton } from "@/components/loading-skeletons";
import PageContainer from "@/components/ui/PageContainer";
import ToyCarouselCard from "@/components/toys/ToyCarouselCard";
import { apiRequest } from "@/lib/queryClient";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";
import { useState } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  const { data: toys, isLoading } = useQuery({ queryKey: ["/api/toys"] });
  const { data: recs } = useQuery({ queryKey: ["/api/recommendations/home"], enabled: !!user });

  const favoriteMutation = useMutation({
    mutationFn: async ({ toyId, isFavorited }: { toyId: number; isFavorited: boolean }) => {
      if (isFavorited) return await apiRequest('DELETE', `/api/favorites/${toyId}`);
      return await apiRequest('POST', '/api/favorites', { toyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/toys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });

  const allToys = Array.isArray(toys) ? toys : [];
  const recsData = (recs as any) || {};
  const forYou = recsData.forYou?.slice(0, 10) || [];
  const nearYou = recsData.nearYou?.slice(0, 10) || [];
  const recentlyAdded = allToys.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 10);

  const CarouselSection = ({ title, subtitle, toys: sectionToys, viewAllHref }: any) => (
    <div>
      <div className="flex items-center justify-between mb-3 px-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref}>
            <span className="text-sm font-medium text-purple-500 hover:text-purple-600 transition-colors shrink-0 ml-2">View All</span>
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth px-4">
        {sectionToys.map((toy: any) => (
          <ToyCarouselCard
            key={toy.id}
            toy={toy}
            onOpen={() => window.location.href = `/toy/${toy.id}`}
            onToggleFavorite={() => favoriteMutation.mutate({ toyId: toy.id, isFavorited: toy.isFavorited || false })}
          />
        ))}
        {sectionToys.length === 0 && (
          <div className="flex-shrink-0 w-[78%] h-40 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">No toys found</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) return <PageLoadingSkeleton />;

  return (
    <PageContainer className="pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-2">
          <img src={toyxLogo} alt="ToyX" className="h-14 w-auto dark:brightness-0 dark:invert" />
          <div className="flex items-center gap-2">
            <button onClick={() => setShowUpload(true)} className="min-w-[44px] min-h-[44px] bg-purple-500 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </button>
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
      </div>

      {/* Search bar — navigates to /search */}
      <Link href="/search">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5 min-h-[44px]">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-400">Search toys, brands, categories...</span>
          </div>
        </div>
      </Link>

      {/* Carousel sections */}
      <div className="py-5 space-y-6">
        {forYou.length > 0 && (
          <CarouselSection
            title="For You"
            subtitle={recsData.meta?.usedLocation ? "Near you, matched to your tastes" : "Matched to your preferences"}
            toys={forYou}
            viewAllHref="/search"
          />
        )}

        <CarouselSection
          title="Nearest to you"
          subtitle="Available toys nearby"
          toys={nearYou.length > 0 ? nearYou : recentlyAdded}
          viewAllHref="/search?nearest=true"
        />

        <CarouselSection
          title="Recently Added"
          subtitle="Fresh listings"
          toys={recentlyAdded}
          viewAllHref="/search?recent=true"
        />
      </div>

      <BottomNav />

      {showUpload && <UploadOverlay onClose={() => setShowUpload(false)} />}
    </PageContainer>
  );
}
