import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Heart, MessageCircle, MapPin, ChevronLeft, ChevronRight,
  Share2, CheckCircle, Star, User, Check, ChevronDown
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import BottomNav from "@/components/bottom-nav";
import BoostButton from "@/components/toys/BoostButton";
import { ToyDetailSkeleton } from "@/components/loading-skeletons";
import PageContainer from "@/components/ui/PageContainer";
import SectionCard from "@/components/ui/SectionCard";
import { normalizeList, ChipRow } from "@/components/toys/MetaChip";
import FeaturedBadge from "@/components/profile/FeaturedBadge";

export default function ToyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const mountTime = useRef(performance.now());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showToySelectionModal, setShowToySelectionModal] = useState(false);
  const [selectedToyForExchange, setSelectedToyForExchange] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [exchangeMessage, setExchangeMessage] = useState('');
  const [limitModal, setLimitModal] = useState<{ message: string; upgradeUrl: string } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const heroLoaded = useRef(false);
  const reportLogged = useRef(false);
  const [, forceRender] = useState(0);

  // Lock body scroll when any modal is open
  const anyModalOpen = showRequestModal || showMessageModal || showToySelectionModal || limitModal;
  useEffect(() => {
    if (anyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [anyModalOpen]);

  const { data: toy, isLoading, error } = useQuery({
    queryKey: ["/api/toys", id],
    enabled: !!id,
  });

  // Toy detail performance instrumentation
  useEffect(() => {
    performance.mark("toy-detail-mount");
    const navFrom = sessionStorage.getItem("toyx_nav_timing");
    if (navFrom) {
      try { const d = JSON.parse(navFrom); performance.measure("nav-to-detail", { start: d.cardClick, end: "toy-detail-mount" }); } catch {}
      sessionStorage.removeItem("toyx_nav_timing");
    }
  }, []);
  useEffect(() => {
    if (!toy || reportLogged.current) return;
    const toyFetch = performance.getEntriesByType("resource").find((r: any) => r.name.includes(`/api/toys/${id}`));
    const navMs = (performance.getEntriesByName("nav-to-detail")[0] as any)?.duration;
    console.log(`╔══════════════════════════════════════╗`);
    console.log(`║     TOY DETAIL PERFORMANCE REPORT    ║`);
    console.log(`╚══════════════════════════════════════╝`);
    if (navMs != null) console.log(`  Card click→mount:  ${navMs.toFixed(0)}ms`);
    console.log(`  Query resolve:     ${(performance.now() - mountTime.current).toFixed(0)}ms`);
    if (toyFetch) {
      const f = toyFetch as any;
      console.log(`  API /api/toys/${id}:`);
      console.log(`    TTFB:            ${(f.responseStart - f.requestStart).toFixed(0)}ms`);
      console.log(`    Download:        ${(f.responseEnd - f.responseStart).toFixed(0)}ms`);
      console.log(`    Total:           ${f.duration.toFixed(0)}ms`);
      console.log(`    Size:            ${(f.transferSize || 0).toFixed(0)}B`);
    }
    console.log(`  Hero image: waiting for load…`);
    reportLogged.current = true;
  }, [toy]);
  useEffect(() => {
    if (!heroLoaded.current) return;
    console.log(`  Hero image loaded: ${(performance.now() - mountTime.current).toFixed(0)}ms`);
    console.log(`──`);
    performance.clearMeasures();
  }, [heroLoaded.current]);

  const { data: favoriteStatus } = useQuery({
    queryKey: ["/api/favorites", id, "status"],
    enabled: !!user && !!id,
  });

  const { data: userExchanges } = useQuery({
    queryKey: ["/api/exchanges"],
    enabled: !!user,
  });

  const hasExistingRequest = Array.isArray(userExchanges)
    ? userExchanges.some((ex: any) => ex.toyId === parseInt(id!) && ex.requesterId === (user as any)?.id && ex.status !== "canceled")
    : false;

  const ownerId = (toy as any)?.ownerId;
  const { data: ownerRating } = useQuery({
    queryKey: ["/api/users", ownerId, "rating"],
    enabled: !!ownerId,
  });

  const { data: ownerReviews } = useQuery({
    queryKey: ["/api/users", ownerId, "reviews"],
    enabled: !!ownerId,
  });

  const { data: myToys } = useQuery({
    queryKey: ["/api/users", (user as any)?.id, "toys"],
    enabled: !!(user as any)?.id,
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if ((favoriteStatus as any)?.isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${id}`);
      } else {
        await apiRequest("POST", "/api/favorites", { toyId: parseInt(id!) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      const wasFav = (favoriteStatus as any)?.isFavorite;
      toast({ title: wasFav ? "Removed from favorites" : "Added to favorites", description: wasFav ? "Toy removed from your favorites" : "Toy added to your favorites" });
      fetch("/api/interactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toyId: parseInt(id!), eventType: wasFav ? "TOY_UNFAVORITE" : "TOY_FAVORITE" }), credentials: "include" }).catch(() => {});
    },
  });

  const exchangeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedToyForExchange) throw new Error("Please select a toy to offer in exchange");
      return await apiRequest("POST", "/api/exchanges", {
        toyId: parseInt(id!), offeredToyId: selectedToyForExchange?.id,
        requestMessage: exchangeMessage || "Hi! I'd love to exchange toys with you. My kid would really enjoy your toy, and I think yours would like mine too!",
      });
    },
    onSuccess: () => {
      toast({ title: "Exchange request sent!", description: "Your exchange request has been sent to the toy owner." });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
      setShowRequestModal(false); setShowToySelectionModal(false); setSelectedToyForExchange(null); setExchangeMessage('');
    },
    onError: (error: any) => {
      setShowToySelectionModal(false); setShowRequestModal(false);
      const msg = error?.message || "";
      const body = msg.includes("{") ? JSON.parse(msg.substring(msg.indexOf("{"))) : null;
      if (body?.upgradeUrl && (body?.code === "LIMIT_ACTIVE_EXCHANGES" || body?.code === "LIMIT_MONTHLY_REQUESTS")) {
        sessionStorage.setItem("toyx_upgrade_context", JSON.stringify({ returnTo: `/toy/${id}` }));
        setLimitModal({ message: body.message, upgradeUrl: body.upgradeUrl });
        setTimeout(() => window.location.href = body.upgradeUrl, 4000);
      } else toast({ title: "Error", description: body?.message || "Failed to send exchange request.", variant: "destructive" });
    },
  });

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCurrentImageIndex(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  if (!id) {
    return (
      <PageContainer className="flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Invalid toy ID</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No toy ID provided in the URL.</p>
          <Link href="/"><Button>Back to Home</Button></Link>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <ToyDetailSkeleton />
      </PageContainer>
    );
  }

  if (error || !toy) {
    return (
      <PageContainer className="flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Toy not found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This toy might have been removed or doesn't exist.</p>
          <Link href="/"><Button>Back to Home</Button></Link>
        </div>
      </PageContainer>
    );
  }

  const isUnavailable = (toy as any)?.isAvailable === false;
  const isArchived = isUnavailable && (toy as any)?.deletedAt;

  if (isUnavailable) {
    return (
      <PageContainer className="flex items-center justify-center">
        <div className="text-center px-6 max-w-sm">
          <div className="text-5xl mb-4">{isArchived ? "📦" : "🤝"}</div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
            {isArchived ? "This toy was removed" : "Toy No Longer Available"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isArchived
              ? "This toy has been removed by its owner."
              : "This toy has already been exchanged."}
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = "/chat"}>
              Back to Chat
            </Button>
            <Link href="/"><Button>Browse Toys</Button></Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const isOwner = (user as any)?.id === (toy as any)?.ownerId;
  const imageUrls = (toy as any)?.imageUrls || [];
  const ages = normalizeList((toy as any)?.ageGroup);
  const categories = normalizeList((toy as any)?.category);
  const desc = (toy as any)?.description || "";
  const descLong = desc.length > 140;
  const rating = (ownerRating as any)?.averageRating || 0;
  const reviewCount = (ownerReviews as any)?.length || 0;

  const OverlayBtn = ({ onClick, children, className }: any) => (
    <button onClick={onClick} className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${className}`}>{children}</button>
  );

  return (
    <PageContainer className="pb-40">
      {/* Hero image carousel */}
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
        {/* Hero scrims */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 via-black/15 to-transparent z-[1]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 via-black/10 to-transparent z-[1]" />

        {imageUrls.length > 0 ? (
          <>
            <div ref={scrollRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar h-full">
              {imageUrls.map((url: string, i: number) => (
                <div key={i} className="min-w-full snap-center h-full relative overflow-hidden">
                  <img src={url} alt={(toy as any)?.name} className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-60" loading="lazy" />
                  <img src={url} alt={(toy as any)?.name} className="absolute inset-0 w-full h-full object-contain" loading="lazy" onLoad={() => { if (i === 0 && !heroLoaded.current) { heroLoaded.current = true; performance.mark("hero-image-loaded"); forceRender(n => n + 1); } }} />
                </div>
              ))}
            </div>
            {imageUrls.length > 1 && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/25 px-2 py-1 rounded-full backdrop-blur-sm">
                {imageUrls.map((_: any, i: number) => (
                  <span key={i} className={`block rounded-full transition-all duration-200 shadow-sm ${
                    i === currentImageIndex
                      ? "w-6 h-1.5 bg-white/90"
                      : "w-1.5 h-1.5 bg-white/50"
                  }`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center"><span className="text-6xl">🧸</span></div>
        )}

        {/* Overlay buttons */}
        <div className="absolute top-3 left-3 z-10">
          <OverlayBtn onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = "/search"} className="bg-white/60 dark:bg-black/40 backdrop-blur-sm rounded-full active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
          </OverlayBtn>
        </div>

        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <OverlayBtn onClick={() => {
            const shareUrl = `https://app.toyxchange.online/toy/${id}`;
            if (typeof navigator !== "undefined" && navigator.share) {
              navigator.share({ title: (toy as any)?.name || "ToyX Listing", url: shareUrl }).catch(() => {});
            } else {
              navigator.clipboard.writeText(shareUrl).catch(() => {});
            }
          }} className="bg-white/60 dark:bg-black/40 backdrop-blur-sm rounded-full active:scale-95 transition-transform">
            <Share2 className="w-5 h-5 text-gray-900 dark:text-white" />
          </OverlayBtn>
          {!isOwner && (
            <OverlayBtn onClick={() => favoriteMutation.mutate()} className="bg-white/60 dark:bg-black/40 backdrop-blur-sm rounded-full active:scale-95 transition-transform">
              <Heart className={`w-5 h-5 ${(favoriteStatus as any)?.isFavorite ? "fill-red-500 text-red-500" : "text-gray-900 dark:text-white"}`} />
            </OverlayBtn>
          )}
        </div>

        {(toy as any)?.condition && (
          <span className="absolute top-3 left-16 px-3 py-1 rounded-full text-xs font-medium bg-black/45 text-white backdrop-blur-sm z-10">
            {(toy as any)?.condition}
          </span>
        )}
        {isOwner && (toy as any)?.boostedUntil && new Date((toy as any).boostedUntil) > new Date() && (
          <span className="absolute top-3 left-36 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/80 text-white backdrop-blur-sm z-10 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Boosted
          </span>
        )}
        {(toy as any)?.location && (
          <div className="absolute bottom-3 left-3 right-16 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/45 text-white backdrop-blur-sm z-10 truncate whitespace-nowrap">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{(toy as any)?.location}</span>
          </div>
        )}
      </div>

      {/* Info content - floating sheet */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="rounded-2xl border bg-white/80 backdrop-blur-xl border-gray-200 dark:bg-gray-900/70 dark:border-white/10 shadow-sm p-5 space-y-3">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {(toy as any)?.name}
          </h1>
          <ChipRow ages={ages} categories={categories} />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Posted {(toy as any)?.createdAt ? new Date((toy as any).createdAt).toLocaleDateString() : "Unknown"}
          </p>

          {/* Description */}
          {desc && (
            <div>
              <p className={`text-sm text-gray-600 dark:text-gray-300 leading-relaxed ${descLong && !descExpanded ? "line-clamp-3" : ""}`}>
                {desc}
              </p>
              {descLong && (
                <button onClick={() => setDescExpanded(!descExpanded)} className="text-xs font-medium text-purple-500 hover:text-purple-600 mt-1 min-h-[36px]">
                  {descExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Looking For section */}
        {((toy as any)?.lookingForCategories?.length > 0 || (toy as any)?.lookingForDetails) && (
          <div className="px-4 mt-3">
            <SectionCard className="p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">Looking for</h4>
              {(toy as any)?.lookingForCategories?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(toy as any).lookingForCategories.map((cat: string) => (
                    <span key={cat} className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
              {(toy as any)?.lookingForDetails && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{(toy as any).lookingForDetails}</p>
              )}
            </SectionCard>
          </div>
        )}

        {/* Owner card */}
        {isOwner && (
        <div className="px-4 mt-2">
          <BoostButton toyId={(toy as any)?.id} isBoosted={(toy as any)?.isBoosted} boostedUntil={(toy as any)?.boostedUntil} disabled={(toy as any)?.isAvailable === false} />
        </div>
        )}
        <Link href={`/users/${(toy as any)?.ownerId}`}>
          <SectionCard className="p-4 cursor-pointer hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={(toy as any)?.owner?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-purple-500 text-white text-sm font-bold">
                  {(toy as any)?.owner?.firstName?.[0] || (toy as any)?.owner?.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                    {(toy as any)?.owner?.firstName && (toy as any)?.owner?.lastName
                      ? `${(toy as any).owner.firstName} ${(toy as any).owner.lastName}`
                      : (toy as any)?.owner?.email}
                  </h4>
                  {(toy as any)?.owner?.featuredBadge && (
                    <FeaturedBadge type={(toy as any).owner.featuredBadge} />
                  )}
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {rating > 0 ? (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  ) : (toy as any)?.owner?.featuredBadge ? (
                    <span className="text-amber-600 font-medium">Founding Member</span>
                  ) : (
                    <span>New member</span>
                  )}
                  <span>·</span>
                  <span>View profile</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
          </SectionCard>
        </Link>
      </div>

      {/* Sticky action bar */}
        <div className="fixed bottom-16 left-0 right-0 bg-white/80 dark:bg-gray-950/70 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 py-2.5 z-40 rounded-t-2xl">
          <div className="max-w-lg mx-auto flex gap-2">
            {/* Share — secondary */}
            <button onClick={() => {
              const shareUrl = `https://app.toyxchange.online/toy/${id}`;
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({ title: (toy as any)?.name || "ToyX Listing", url: shareUrl }).catch(() => {});
              } else {
                navigator.clipboard.writeText(shareUrl).catch(() => {});
              }
            }}
              className="flex-[0.9] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[40px]">
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>Share</span>
            </button>
            {/* Post to Social — owner only */}
            {isOwner && (
              <button onClick={() => setShowShareModal(true)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[40px]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>Post</span>
              </button>
            )}
            {/* Non-owner actions */}
            {!isOwner && (
              <>
                <button onClick={() => setShowMessageModal(true)}
                  className="flex-[0.9] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[40px]">
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Message</span>
                </button>
                {(toy as any)?.isAvailable === false ? (
                  <div className="flex-[1.2] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 min-h-[40px]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>In Progress</span>
                  </div>
                ) : hasExistingRequest ? (
                  <div className="flex-[1.2] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 min-h-[40px]">
                    <Check className="w-3.5 h-3.5" />
                    <span>Requested</span>
                  </div>
                ) : (
                  <button onClick={() => setShowToySelectionModal(true)}
                    className="flex-[1.2] bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[40px]">
                    <User className="w-3.5 h-3.5" />
                    <span>Request Exchange</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      {/* Modals — unchanged from original */}
      {limitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SectionCard className="p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-white" /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-3">Upgrade Required</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{limitModal.message}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Redirecting to pricing...</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4"><div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }} /></div>
          </SectionCard>
        </div>
      )}

      {showToySelectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-overlay">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col shadow-lg modal-content">
            <div className="p-6 pb-0 shrink-0">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"><User className="w-6 h-6 text-white" /></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Select Your Toy to Offer</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose one of your toys to offer in exchange</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6">
              {myToys && Array.isArray(myToys) && myToys.length > 0 ? (
                <div className="space-y-3">
                  {myToys.filter((t: any) => t.isAvailable).map((myToy: any) => (
                    <button key={myToy.id} onClick={() => { setSelectedToyForExchange(myToy); setShowToySelectionModal(false); setShowRequestModal(true); }}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-800 transition-all text-left min-h-[44px]">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          {myToy.imageUrls && myToy.imageUrls[0] ? <img src={myToy.imageUrls[0]} alt={myToy.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🧸</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">{myToy.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{myToy.category} • {myToy.condition}</p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8"><div className="text-4xl mb-4">📦</div><h4 className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">No toys available</h4><p className="text-xs text-gray-500 dark:text-gray-400">You need to list some toys before making exchange requests.</p></div>
              )}
            </div>
            <div className="p-6 shrink-0">
              <button onClick={() => setShowToySelectionModal(false)} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && selectedToyForExchange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-overlay">
          <SectionCard className="p-6 w-full max-w-sm mx-4 modal-content">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"><User className="w-6 h-6 text-white" /></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Confirm Exchange Request</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Offer your <strong>{selectedToyForExchange.name}</strong> in exchange for <strong>{(toy as any)?.name}</strong></p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-2 overflow-hidden">
                      {selectedToyForExchange.imageUrls && selectedToyForExchange.imageUrls[0] ? <img src={selectedToyForExchange.imageUrls[0]} alt={selectedToyForExchange.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🧸</div>}
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-50">Your Toy</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedToyForExchange.name}</p>
                  </div>
                  <div className="px-3"><ChevronLeft className="w-4 h-4 text-purple-500 rotate-180" /></div>
                  <div className="text-center flex-1">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-2 overflow-hidden">
                      {(toy as any)?.imageUrls && (toy as any).imageUrls[0] ? <img src={(toy as any).imageUrls[0]} alt={(toy as any).name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🧸</div>}
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-50">Their Toy</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{(toy as any)?.name}</p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add a message (optional)</label>
                <textarea value={exchangeMessage} onChange={(e) => setExchangeMessage(e.target.value)} placeholder="Hi! I'd love to exchange toys with you..." className="w-full h-20 p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRequestModal(false)} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]">Cancel</button>
              <button onClick={() => exchangeMutation.mutate()} disabled={exchangeMutation.isPending} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 min-h-[44px]">{exchangeMutation.isPending ? 'Sending...' : 'Send Request'}</button>
            </div>
          </SectionCard>
        </div>
      )}

      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SectionCard className="p-6 w-full max-w-sm mx-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Send Message</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Send a message to {(toy as any)?.owner?.firstName || (toy as any)?.owner?.email}</p>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi! I'm interested in this toy..." className="w-full h-24 p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowMessageModal(false)} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]">Cancel</button>
              <button onClick={async () => {
                setShowMessageModal(false);
                if (!message.trim()) { toast({ title: "Error", description: "Please enter a message.", variant: "destructive" }); return; }
                try {
                  // Check for existing exchange with this toy owner
                  const exchRes = await fetch("/api/exchanges", { credentials: "include" });
                  const exchanges = await exchRes.json().catch(() => []);
                  const existing = (Array.isArray(exchanges) ? exchanges : []).find(
                    (ex: any) => ex.toyId === parseInt(id!) && ex.requesterId === (user as any)?.id
                  );
                  if (existing) {
                    // Send message to existing exchange
                    await fetch(`/api/exchanges/${existing.id}/messages`, {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ content: message.trim(), messageType: "text" }),
                      credentials: "include",
                    });
                    queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
                    setMessage('');
                    window.location.href = `/chat/${existing.id}`;
                    return;
                  }
                  // No existing exchange — create one
                  const res = await fetch("/api/exchanges", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ toyId: parseInt(id!), requestMessage: message.trim() }),
                    credentials: "include",
                  });
                  if (res.ok) {
                    const data = await res.json();
                    toast({ title: "Message sent!", description: "Your message has been sent to the toy owner." });
                    queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
                    setMessage('');
                    window.location.href = `/chat/${data.id}`;
                  } else {
                    const data = await res.json().catch(() => ({}));
                    if (data?.upgradeUrl && (data?.code === "LIMIT_ACTIVE_EXCHANGES" || data?.code === "LIMIT_MONTHLY_REQUESTS")) {
                      sessionStorage.setItem("toyx_upgrade_context", JSON.stringify({ returnTo: `/toy/${id}` }));
                      setLimitModal({ message: data.message, upgradeUrl: data.upgradeUrl });
                      setTimeout(() => window.location.href = data.upgradeUrl, 4000);
                    } else {
                      toast({ title: "Error", description: data?.message || "Failed to send message.", variant: "destructive" });
                    }
                  }
                } catch { toast({ title: "Error", description: "Failed to send message.", variant: "destructive" }); }
              }} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium transition-colors min-h-[44px]">Send Message</button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-xl modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 text-center mb-1">Share this toy</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">{(toy as any)?.name}</p>
              <div className="grid grid-cols-5 gap-3">
                {/* Facebook */}
                <button onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://app.toyxchange.online/toy/${id}`)}`, "_blank", "width=600,height=400"); setShowShareModal(false); }}
                  className="flex flex-col items-center gap-1.5 min-h-[44px] justify-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">Facebook</span>
                </button>
                {/* WhatsApp */}
                <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this toy on ToyX: https://app.toyxchange.online/toy/${id}`)}`, "_blank"); setShowShareModal(false); }}
                  className="flex flex-col items-center gap-1.5 min-h-[44px] justify-center">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">WhatsApp</span>
                </button>
                {/* X / Twitter */}
                <button onClick={() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this toy on ToyX: https://app.toyxchange.online/toy/${id}`)}`, "_blank", "width=600,height=400"); setShowShareModal(false); }}
                  className="flex flex-col items-center gap-1.5 min-h-[44px] justify-center">
                  <div className="w-12 h-12 bg-black dark:bg-gray-700 rounded-xl flex items-center justify-center"><svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">X</span>
                </button>
                {/* Telegram */}
                <button onClick={() => { window.open(`https://t.me/share/url?url=${encodeURIComponent(`https://app.toyxchange.online/toy/${id}`)}&text=${encodeURIComponent("Check out this toy on ToyX")}`, "_blank"); setShowShareModal(false); }}
                  className="flex flex-col items-center gap-1.5 min-h-[44px] justify-center">
                  <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">Telegram</span>
                </button>
                {/* Copy Link */}
                <button onClick={() => {
                  navigator.clipboard.writeText(`https://app.toyxchange.online/toy/${id}`).then(() => {
                    console.log("Copy link fallback");
                    toast({ title: "Link copied", description: "Toy listing URL copied to clipboard." });
                    setShowShareModal(false);
                  }).catch(() => {
                    console.log("Copy link fallback");
                    const ta = document.createElement("textarea");
                    ta.value = `https://app.toyxchange.online/toy/${id}`;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    document.body.removeChild(ta);
                    toast({ title: "Link copied", description: "Toy listing URL copied to clipboard." });
                    setShowShareModal(false);
                  });
                }}
                  className="flex flex-col items-center gap-1.5 min-h-[44px] justify-center">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">Copy</span>
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowShareModal(false)} className="w-full py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </PageContainer>
  );
}
