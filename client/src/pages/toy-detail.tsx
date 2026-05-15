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
import PageContainer from "@/components/ui/PageContainer";
import SectionCard from "@/components/ui/SectionCard";
import { normalizeList, ChipRow } from "@/components/toys/MetaChip";

export default function ToyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showToySelectionModal, setShowToySelectionModal] = useState(false);
  const [selectedToyForExchange, setSelectedToyForExchange] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [exchangeMessage, setExchangeMessage] = useState('');
  const [limitModal, setLimitModal] = useState<{ message: string; upgradeUrl: string } | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: toy, isLoading, error } = useQuery({
    queryKey: ["/api/toys", id],
    enabled: !!id,
  });

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
        <div className="animate-pulse">
          <div className="h-80 bg-gray-200 dark:bg-gray-800" />
          <div className="px-4 py-6 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
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

  const isOwner = (user as any)?.id === (toy as any)?.ownerId;
  const imageUrls = (toy as any)?.imageUrls || [];
  const ages = normalizeList((toy as any)?.ageGroup);
  const categories = normalizeList((toy as any)?.category);
  const desc = (toy as any)?.description || "";
  const descLong = desc.length > 140;
  const rating = (ownerRating as any)?.rating || 0;
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
                  <img src={url} alt={(toy as any)?.name} className="absolute inset-0 w-full h-full object-contain" loading="lazy" />
                </div>
              ))}
            </div>
            {imageUrls.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/25 px-2 py-1 rounded-full backdrop-blur-sm">
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
          <Link href="/search">
            <OverlayBtn className="bg-white/60 dark:bg-black/40 backdrop-blur-sm rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
            </OverlayBtn>
          </Link>
        </div>

        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <OverlayBtn onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/toy/${id}`).then(() => toast({ title: "Link copied!" }));
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

        {(toy as any)?.location && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/45 text-white backdrop-blur-sm z-10 max-w-[55%] truncate whitespace-nowrap">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[160px]">{(toy as any)?.location}</span>
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

        {/* Owner card */}
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
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {rating > 0 ? (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                    </span>
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
      {!isOwner && (
        <div className="fixed bottom-16 left-0 right-0 bg-white/80 dark:bg-gray-950/70 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-4 py-3 z-40 rounded-t-2xl">
          <div className="max-w-lg mx-auto flex gap-3">
            <button onClick={() => setShowMessageModal(true)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
              <MessageCircle className="w-4 h-4" />
              <span>Message</span>
            </button>
            {(toy as any)?.isAvailable === false ? (
              <div className="flex-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 py-3 rounded-xl font-medium flex items-center justify-center gap-2 min-h-[44px]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>In Progress</span>
              </div>
            ) : hasExistingRequest ? (
              <div className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 py-3 rounded-xl font-medium flex items-center justify-center gap-2 min-h-[44px]">
                <Check className="w-4 h-4" />
                <span>Requested</span>
              </div>
            ) : (
              <button onClick={() => setShowToySelectionModal(true)}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px]">
                <User className="w-4 h-4" />
                <span>Request Exchange</span>
              </button>
            )}
          </div>
        </div>
      )}

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col shadow-lg">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SectionCard className="p-6 w-full max-w-sm mx-4">
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
              <button onClick={() => { setShowMessageModal(false); setMessage(''); }} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium transition-colors min-h-[44px]">Send Message</button>
            </div>
          </SectionCard>
        </div>
      )}

      <BottomNav />
    </PageContainer>
  );
}
