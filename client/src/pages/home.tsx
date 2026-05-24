import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Search, MapPin } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UploadOverlay from "@/components/upload-overlay";
import BottomNav from "@/components/bottom-nav";
import { PageLoadingSkeleton } from "@/components/loading-skeletons";
import PageContainer from "@/components/ui/PageContainer";
import ToyCarouselCard from "@/components/toys/ToyCarouselCard";
import { apiRequest } from "@/lib/queryClient";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";
import { useState, useCallback, useEffect } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [restoreDraft, setRestoreDraft] = useState<any>(null);
  const [enablingLoc, setEnablingLoc] = useState(false);
  const [dismissedCta, setDismissedCta] = useState(false);
  // Open upload modal when redirected from /list-toy or after subscription upgrade
  useEffect(() => {
    console.log("HOME: mounted, checking upgrade context...");
    const upgradeCtx = localStorage.getItem("toyx_upgrade_context") || sessionStorage.getItem("toyx_upgrade_context");
    if (upgradeCtx) {
      console.log("HOME: found upgrade context:", upgradeCtx);
      // Clear immediately so hard refresh never re-triggers with stale data
      localStorage.removeItem("toyx_upgrade_context");
      sessionStorage.removeItem("toyx_upgrade_context");
      try {
        const ctx = JSON.parse(upgradeCtx);
        if (ctx.formDraft) {
          setRestoreDraft(ctx.formDraft);
        }
        if (ctx.action === "open-upload-modal") {
          console.log("RESTORE: upgrade context found, opening upload modal");
          setTimeout(() => {
            console.log("RESTORE: modal trigger executed");
            setShowUpload(true);
          }, 1000);
          return;
        }
      } catch (e) {
        console.log("RESTORE: failed to parse context", e);
      }
    }
    const action = sessionStorage.getItem("toyx_pending_action");
    if (action === "list") {
      console.log("RESTORE: pending action found:", action);
      setTimeout(() => {
        sessionStorage.removeItem("toyx_pending_action");
        console.log("RESTORE: pending action triggered");
        setShowUpload(true);
      }, 1000);
    }
  }, []);

  const u = user as any;
  const hasLocation = !!(u?.locationEnabled && u?.latitude != null && u?.longitude != null);

  const { data: toys, isLoading } = useQuery({ queryKey: ["/api/toys"] });
  const { data: recs } = useQuery({ queryKey: ["/api/recommendations/home"], enabled: !!user });
  const { data: matches } = useQuery({ queryKey: ["/api/me/matches"], enabled: !!user });
  const { data: wishlist } = useQuery({ queryKey: ["/api/me/wishlist"], enabled: !!user });

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

  const handleEnableLocation = useCallback(() => {
    setEnablingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await fetch("/api/users/location", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled: true, latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            credentials: "include",
          });
          toast({ title: "Location enabled", description: "Now you can see how far toys are." });
          queryClient.refetchQueries({ queryKey: ["/api/auth/user"] }).then(() => {
            queryClient.refetchQueries({ queryKey: ["/api/toys"] });
          });
        } catch { toast({ title: "Error", description: "Failed to save location.", variant: "destructive" }); }
        setEnablingLoc(false);
      },
      () => {
        toast({ title: "Location unavailable", description: "Couldn't access location. Check browser permissions.", variant: "destructive" });
        setEnablingLoc(false);
      },
    );
  }, [queryClient, toast]);

  const allToys = Array.isArray(toys) ? toys : [];
  const recsData = (recs as any) || {};
  const forYou = recsData.forYou?.slice(0, 10) || [];
  const recentlyAdded = [...allToys].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 10);

  // Nearest: sort by distance when available, fallback to recently added
  const nearestWithDistance = [...allToys].filter((t: any) => t.distanceKm != null).sort((a: any, b: any) => a.distanceKm - b.distanceKm).slice(0, 10);
  const nearestSectionToys = nearestWithDistance.length > 0 ? nearestWithDistance : recentlyAdded;

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
          <img src={toyxLogo} alt="ToyX" className="h-20 w-auto dark:brightness-0 dark:invert drop-shadow-sm" />
          <Link href="/profile">
            <Avatar className="w-9 h-9 cursor-pointer">
              <AvatarImage src={u?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-purple-500 text-white text-sm">
                {u?.firstName?.[0] || u?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <Link href="/search">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5 min-h-[44px]">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-400">Search toys, brands, categories...</span>
          </div>
        </div>
      </Link>

      {/* Enable Location CTA */}
      {!hasLocation && !dismissedCta && (
        <div className="mx-4 mt-4 p-4 rounded-2xl border bg-white dark:bg-gray-900/60 border-gray-200 dark:border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Enable location</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">See how far toys are from you.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setDismissedCta(true)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[36px] px-2">Not now</button>
              <button onClick={handleEnableLocation} disabled={enablingLoc} className="bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors min-h-[44px] disabled:opacity-50">
                {enablingLoc ? "Enabling..." : "Enable now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carousel sections */}
      <div className="py-5 space-y-6">
        {(matches as any)?.length > 0 && (
          <CarouselSection
            title="Matches for your wishlist"
            subtitle="Toys that match what you're looking for"
            toys={matches as any[] || []}
            viewAllHref="/search"
          />
        )}

        {(!(matches as any)?.length && (wishlist as any)?.categories?.length === 0 && !!user) && (
          <div className="px-4">
            <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl p-4 border border-purple-100 dark:border-purple-900/20">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">Matches for your wishlist</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Add 'Looking for' categories to one of your listings to get matched with other toys.</p>
              <Link href="/profile">
                <span className="text-xs font-medium text-purple-500 hover:text-purple-600 transition-colors">Edit a listing</span>
              </Link>
            </div>
          </div>
        )}

        {(!(matches as any)?.length && (wishlist as any)?.categories?.length > 0 && !!user) && (
          <div className="px-4">
            <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl p-4 border border-purple-100 dark:border-purple-900/20">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">Matches for your wishlist</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">No toys match your wishlist categories yet.</p>
            </div>
          </div>
        )}

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
          subtitle={hasLocation ? "Sorted by distance" : "Enable location to see nearest toys"}
          toys={nearestSectionToys}
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

      {showUpload && <UploadOverlay onClose={() => { setShowUpload(false); setRestoreDraft(null); }} restoreDraft={restoreDraft} />}
    </PageContainer>
  );
}
