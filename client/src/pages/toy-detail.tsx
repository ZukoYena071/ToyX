import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Heart, MessageCircle, MapPin, ChevronLeft, ChevronRight, Share2, CheckCircle, Star, User, Check } from "lucide-react";
import { useState } from "react";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import BadgePill from "@/components/ui/BadgePill";

export default function ToyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showToySelectionModal, setShowToySelectionModal] = useState(false);
  const [selectedToyForExchange, setSelectedToyForExchange] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [exchangeMessage, setExchangeMessage] = useState('');
  const [limitModal, setLimitModal] = useState<{ message: string; upgradeUrl: string } | null>(null);

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
      toast({
        title: (favoriteStatus as any)?.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: (favoriteStatus as any)?.isFavorite ? "Toy removed from your favorites" : "Toy added to your favorites",
      });
    },
  });

  const exchangeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedToyForExchange) throw new Error("Please select a toy to offer in exchange");
      return await apiRequest("POST", "/api/exchanges", {
        toyId: parseInt(id!),
        offeredToyId: selectedToyForExchange?.id,
        requestMessage: exchangeMessage || "Hi! I'd love to exchange toys with you. My kid would really enjoy your toy, and I think yours would like mine too!",
      });
    },
    onSuccess: () => {
      toast({ title: "Exchange request sent!", description: "Your exchange request has been sent to the toy owner." });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
      setShowRequestModal(false);
      setShowToySelectionModal(false);
      setSelectedToyForExchange(null);
      setExchangeMessage('');
    },
    onError: (error: any) => {
      setShowToySelectionModal(false);
      setShowRequestModal(false);
      const msg = error?.message || "";
      const body = msg.includes("{") ? JSON.parse(msg.substring(msg.indexOf("{"))) : null;
      if (body?.upgradeUrl && (body?.code === "LIMIT_ACTIVE_EXCHANGES" || body?.code === "LIMIT_MONTHLY_REQUESTS")) {
        setLimitModal({ message: body.message, upgradeUrl: body.upgradeUrl });
        setTimeout(() => window.location.href = body.upgradeUrl, 4000);
      } else {
        toast({ title: "Error", description: body?.message || "Failed to send exchange request.", variant: "destructive" });
      }
    },
  });

  const nextImage = () => {
    if ((toy as any)?.imageUrls && (toy as any).imageUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % (toy as any).imageUrls.length);
    }
  };

  const prevImage = () => {
    if ((toy as any)?.imageUrls && (toy as any).imageUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + (toy as any).imageUrls.length) % (toy as any).imageUrls.length);
    }
  };

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
  const currentImage = imageUrls[currentImageIndex] || imageUrls[0];

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title="Toy Details"
        rightAction={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const url = `${window.location.origin}/toy/${id}`;
                navigator.clipboard.writeText(url).then(() => {
                  toast({ title: "Link copied!", description: "Toy listing link copied to clipboard. Share it anywhere!" });
                }).catch(() => {
                  toast({ title: "Could not copy", description: "Please copy the URL manually.", variant: "destructive" });
                });
              }}
              className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px]"
            >
              <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            {!isOwner && (
              <button
                onClick={() => favoriteMutation.mutate()}
                className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px]"
              >
                <Heart className={`w-4 h-4 ${(favoriteStatus as any)?.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}`} />
              </button>
            )}
            <Link href="/search">
              <button className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px]">
                <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </Link>
          </div>
        }
      />

      {/* Image Gallery */}
      <div className="relative">
        <div className="aspect-square bg-white dark:bg-gray-900">
          {currentImage ? (
            <img src={currentImage} alt={(toy as any)?.name || "Toy"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-6xl">🧸</div>
            </div>
          )}

          {imageUrls.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px]">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px]">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </>
          )}

          {imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {imageUrls.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toy Information */}
      <div className="px-4 mt-4 space-y-4">
        <SectionCard className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">{(toy as any)?.name}</h1>
              <div className="flex items-center gap-3 mb-3">
                <BadgePill
                  label={(toy as any)?.condition}
                  variant={(toy as any)?.condition === 'Like New' ? 'success' : (toy as any)?.condition === 'Excellent' ? 'info' : 'warning'}
                />
                {(toy as any)?.location && (
                  <div className="flex items-center gap-1 min-w-0">
                    <MapPin className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{(toy as any)?.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(toy as any)?.description && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-2">Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{(toy as any)?.description}</p>
            </div>
          )}

          <div className="mb-6 space-y-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {((toy as any)?.category || "").split(", ").filter(Boolean).map((cat: string) => (
                  <span key={cat} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">{cat}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Age Range</p>
              <div className="flex flex-wrap gap-2">
                {((toy as any)?.ageGroup || "").split(", ").filter(Boolean).map((age: string) => (
                  <span key={age} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">Ages {age}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Condition</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{(toy as any)?.condition}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">Posted {(toy as any)?.createdAt ? new Date((toy as any).createdAt).toLocaleDateString() : 'Unknown'}</p>
        </SectionCard>

        {/* Owner Information */}
        <Link href={`/users/${(toy as any)?.ownerId}`}>
          <SectionCard className="p-6 cursor-pointer hover:shadow-sm transition-all duration-200">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">Toy Owner</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={(toy as any)?.owner?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-purple-500 text-white text-lg font-bold">
                    {(toy as any)?.owner?.firstName?.[0] || (toy as any)?.owner?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {(toy as any)?.owner?.firstName && (toy as any)?.owner?.lastName
                      ? `${(toy as any).owner.firstName} ${(toy as any).owner.lastName}`
                      : (toy as any)?.owner?.email
                    }
                  </h4>
                  <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">@{(toy as any)?.owner?.email?.split('@')[0] || 'user'}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span>{((ownerRating as any)?.rating || 0).toFixed(1)} ({(ownerReviews as any)?.length || 0} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{(toy as any)?.owner?.createdAt ? new Date((toy as any).owner.createdAt).toLocaleDateString() : 'Unknown'}</p>
              </div>
            </div>
          </SectionCard>
        </Link>
      </div>

      {/* Action Buttons */}
      {!isOwner && (
        <div className="fixed bottom-20 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 z-40">
          <div className="max-w-lg mx-auto flex gap-3">
            <button
              onClick={() => setShowMessageModal(true)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Message</span>
            </button>
            {(toy as any)?.isAvailable === false ? (
              <div className="flex-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 py-3 rounded-xl font-medium flex items-center justify-center gap-2 min-h-[44px]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Exchange In Progress</span>
              </div>
            ) : hasExistingRequest ? (
              <div className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 py-3 rounded-xl font-medium flex items-center justify-center gap-2 min-h-[44px]">
                <Check className="w-4 h-4" />
                <span>Exchange Requested</span>
              </div>
            ) : (
              <button
                onClick={() => setShowToySelectionModal(true)}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                <User className="w-4 h-4" />
                <span>Request Exchange</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Limit Reached Modal */}
      {limitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SectionCard className="p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-3">Upgrade Required</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{limitModal.message}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Redirecting to pricing...</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
          </SectionCard>
        </div>
      )}

      {/* Toy Selection Modal */}
      {showToySelectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col shadow-lg">
            <div className="p-6 pb-0 shrink-0">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Select Your Toy to Offer</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose one of your toys to offer in exchange</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6">
              {myToys && Array.isArray(myToys) && myToys.length > 0 ? (
                <div className="space-y-3">
                  {myToys.filter((t: any) => t.isAvailable).map((myToy: any) => (
                    <button
                      key={myToy.id}
                      onClick={() => { setSelectedToyForExchange(myToy); setShowToySelectionModal(false); setShowRequestModal(true); }}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-800 transition-all text-left min-h-[44px]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          {myToy.imageUrls && myToy.imageUrls[0] ? (
                            <img src={myToy.imageUrls[0]} alt={myToy.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                              <span className="text-lg">🧸</span>
                            </div>
                          )}
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
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📦</div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">No toys available</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">You need to list some toys before making exchange requests.</p>
                </div>
              )}
            </div>
            <div className="p-6 shrink-0">
              <button
                onClick={() => setShowToySelectionModal(false)}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && selectedToyForExchange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SectionCard className="p-6 w-full max-w-sm mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Confirm Exchange Request</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Offer your <strong>{selectedToyForExchange.name}</strong> in exchange for <strong>{(toy as any)?.name}</strong>
              </p>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-2 overflow-hidden">
                      {selectedToyForExchange.imageUrls && selectedToyForExchange.imageUrls[0] ? (
                        <img src={selectedToyForExchange.imageUrls[0]} alt={selectedToyForExchange.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">🧸</div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-50">Your Toy</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedToyForExchange.name}</p>
                  </div>
                  <div className="px-3">
                    <ChevronLeft className="w-4 h-4 text-purple-500 rotate-180" />
                  </div>
                  <div className="text-center flex-1">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-2 overflow-hidden">
                      {(toy as any)?.imageUrls && (toy as any).imageUrls[0] ? (
                        <img src={(toy as any).imageUrls[0]} alt={(toy as any).name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">🧸</div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-50">Their Toy</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{(toy as any)?.name}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add a message (optional)</label>
                <textarea
                  value={exchangeMessage}
                  onChange={(e) => setExchangeMessage(e.target.value)}
                  placeholder="Hi! I'd love to exchange toys with you. My kid would really enjoy your toy, and I think yours would like mine too!"
                  className="w-full h-20 p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRequestModal(false)} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]">Cancel</button>
              <button onClick={() => exchangeMutation.mutate()} disabled={exchangeMutation.isPending} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 min-h-[44px]">
                {exchangeMutation.isPending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SectionCard className="p-6 w-full max-w-sm mx-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Send Message</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Send a message to {(toy as any)?.owner?.firstName || (toy as any)?.owner?.email}</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! I'm interested in this toy..."
                className="w-full h-24 p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
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
