import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Heart, MessageCircle, MapPin, User, Star, ChevronLeft, ChevronRight, Share2, CheckCircle, Clock, Check } from "lucide-react";
import { useState } from "react";
import BottomNav from "@/components/bottom-nav";

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

  // Get current user's toys for exchange selection
  const { data: userExchanges } = useQuery({
    queryKey: ["/api/exchanges"],
    enabled: !!user,
  });

  const hasExistingRequest = Array.isArray(userExchanges)
    ? userExchanges.some((ex: any) => ex.toyId === parseInt(id!) && ex.requesterId === (user as any)?.id && ex.status !== "canceled")
    : false;

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
        description: (favoriteStatus as any)?.isFavorite 
          ? "Toy removed from your favorites" 
          : "Toy added to your favorites",
      });
    },
  });

  const exchangeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedToyForExchange) {
        throw new Error("Please select a toy to offer in exchange");
      }
      return await apiRequest("POST", "/api/exchanges", {
        toyId: parseInt(id!),
        requestMessage: exchangeMessage || "Hi! I'd love to exchange toys with you. My kid would really enjoy your toy, and I think yours would like mine too!",
      });
    },
    onSuccess: () => {
      toast({
        title: "Exchange request sent!",
        description: "Your exchange request has been sent to the toy owner.",
      });
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
        toast({
          title: "Error",
          description: body?.message || "Failed to send exchange request.",
          variant: "destructive",
        });
      }
    },
  });

  // Image navigation helpers
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

  const handleRequestExchange = () => {
    setShowToySelectionModal(true);
  };

  const handleMessage = () => {
    setShowMessageModal(true);
  };

  const sendMessage = () => {
    // TODO: Implement message sending
    setShowMessageModal(false);
    setMessage('');
  };

  const confirmExchangeRequest = () => {
    exchangeMutation.mutate();
  };

  const handleToySelection = (selectedToy: any) => {
    setSelectedToyForExchange(selectedToy);
    setShowToySelectionModal(false);
    setShowRequestModal(true);
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Invalid toy ID</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">No toy ID provided in the URL.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-pulse">
          <div className="h-80 bg-gray-200 dark:bg-gray-700" />
          <div className="px-4 py-6 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !toy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Toy not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">This toy might have been removed or doesn't exist.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = (user as any)?.id === (toy as any)?.ownerId;
  const imageUrls = (toy as any)?.imageUrls || [];
  const currentImage = imageUrls[currentImageIndex] || imageUrls[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-4 max-w-sm mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/search">
                <button className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </Link>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Toy Details</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/toy/${id}`;
                  navigator.clipboard.writeText(url).then(() => {
                    toast({ title: "Link copied!", description: "Toy listing link copied to clipboard. Share it anywhere!" });
                  }).catch(() => {
                    toast({ title: "Could not copy", description: "Please copy the URL manually.", variant: "destructive" });
                  });
                }}
                className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              {!isOwner && (
                <button 
                  onClick={() => favoriteMutation.mutate()}
                  className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${(favoriteStatus as any)?.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-sm mx-auto">

        {/* Image Gallery */}
        <div className="relative">
          <div className="aspect-square bg-white">
            {currentImage ? (
              <img
                src={currentImage}
                alt={(toy as any)?.name || "Toy"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <div className="text-6xl">🧸</div>
              </div>
            )}
          
          {/* Image Navigation */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </>
          )}

          {/* Image Indicators */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {imageUrls.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Toy Information */}
        <div className="bg-white dark:bg-gray-800 mx-4 mt-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {/* Title and Condition */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{(toy as any)?.name}</h1>
            <div className="flex items-center space-x-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                (toy as any)?.condition === 'Like New' 
                  ? 'bg-green-100 text-green-700'
                  : (toy as any)?.condition === 'Excellent'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {(toy as any)?.condition}
              </span>
              {(toy as any)?.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{(toy as any)?.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Educational</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Creative</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">STEM</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Popular</span>
        </div>

        {/* Description */}
        {(toy as any)?.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{(toy as any)?.description}</p>
          </div>
        )}

        {/* Toy Details */}
        <div className="mb-6">
          <div className="mb-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Categories</div>
            <div className="flex flex-wrap gap-2">
              {((toy as any)?.category || "").split(", ").filter(Boolean).map((cat: string) => (
                <span key={cat} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Age Range</div>
            <div className="flex flex-wrap gap-2">
              {((toy as any)?.ageGroup || "").split(", ").filter(Boolean).map((age: string) => (
                <span key={age} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  Ages {age}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Brand</div>
            <div className="font-medium text-gray-800 dark:text-white">LEGO</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Condition</div>
            <div className="font-medium text-gray-800 dark:text-white">{(toy as any)?.condition}</div>
          </div>
        </div>

          {/* Posted Date */}
          <div className="text-sm text-gray-500 dark:text-gray-400">Posted {(toy as any)?.createdAt ? new Date((toy as any).createdAt).toLocaleDateString() : 'Unknown'}</div>
        </div>

        {/* Owner Information */}
        <Link href={`/users/${(toy as any)?.ownerId}`}>
          <div className="bg-white dark:bg-gray-800 mx-4 mt-4 mb-24 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg transition-all duration-200">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Toy Owner</h3>
            
            <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {(toy as any)?.owner?.firstName?.[0] || (toy as any)?.owner?.email?.[0] || 'U'}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-800 dark:text-white">
                {(toy as any)?.owner?.firstName && (toy as any)?.owner?.lastName 
                  ? `${(toy as any).owner.firstName} ${(toy as any).owner.lastName}`
                  : (toy as any)?.owner?.email
                }
              </h4>
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">@{(toy as any)?.owner?.email?.split('@')[0] || 'user'}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>4.8 (24 reviews)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400 mb-1">Response Time</div>
            <div className="font-medium text-gray-800 dark:text-white">~2 hours</div>
          </div>
          <div>
              <div className="text-gray-500 dark:text-gray-400 mb-1">Member Since</div>
              <div className="font-medium text-gray-800 dark:text-white">{(toy as any)?.owner?.createdAt ? new Date((toy as any).owner.createdAt).toLocaleDateString() : 'Unknown'}</div>
            </div>
          </div>
          </div>
        </Link>

      {/* Action Buttons */}
      {!isOwner && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-40">
          <div className="flex space-x-3">
            <button
              onClick={handleMessage}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Message</span>
            </button>
            {hasExistingRequest ? (
              <div className="flex-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 py-3 rounded-xl font-medium flex items-center justify-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Exchange Requested</span>
              </div>
            ) : (
              <button
                onClick={handleRequestExchange}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm text-center shadow-xl">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Upgrade Required</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{limitModal.message}</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">Redirecting to pricing...</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Toy Selection Modal */}
      {showToySelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col">
            <div className="p-6 pb-0 shrink-0">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Select Your Toy to Offer</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Choose one of your toys to offer in exchange</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6">
              {myToys && Array.isArray(myToys) && myToys.length > 0 ? (
                <div className="space-y-3">
                  {myToys.filter((toy: any) => toy.isAvailable).map((myToy: any) => (
                    <button
                      key={myToy.id}
                      onClick={() => handleToySelection(myToy)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-gray-700 transition-all text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          {myToy.imageUrls && myToy.imageUrls[0] ? (
                            <img
                              src={myToy.imageUrls[0]}
                              alt={myToy.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <span className="text-lg">🧸</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 dark:text-white text-sm">{myToy.name}</h4>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">{myToy.category} • {myToy.condition}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📦</div>
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">No toys available</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">You need to list some toys before making exchange requests.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 shrink-0">
              <button
                onClick={() => setShowToySelectionModal(false)}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && selectedToyForExchange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Confirm Exchange Request</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Offer your <strong>{selectedToyForExchange.name}</strong> in exchange for <strong>{(toy as any)?.name}</strong>
              </p>
              
              {/* Exchange Preview */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg mx-auto mb-2 overflow-hidden">
                      {selectedToyForExchange.imageUrls && selectedToyForExchange.imageUrls[0] ? (
                        <img src={selectedToyForExchange.imageUrls[0]} alt={selectedToyForExchange.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">🧸</div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-800 dark:text-white">Your Toy</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedToyForExchange.name}</p>
                  </div>
                  <div className="px-3">
                    <ChevronRight className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-center flex-1">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg mx-auto mb-2 overflow-hidden">
                      {(toy as any)?.imageUrls && (toy as any).imageUrls[0] ? (
                        <img src={(toy as any).imageUrls[0]} alt={(toy as any).name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">🧸</div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-800 dark:text-white">Their Toy</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{(toy as any)?.name}</p>
                  </div>
                </div>
              </div>
              
              {/* Optional Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add a message (optional)
                </label>
                <textarea
                  value={exchangeMessage}
                  onChange={(e) => setExchangeMessage(e.target.value)}
                  placeholder="Hi! I'd love to exchange toys with you. My kid would really enjoy your toy, and I think yours would like mine too!"
                  className="w-full h-20 p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmExchangeRequest}
                disabled={exchangeMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {exchangeMutation.isPending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Send Message</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Send a message to {(toy as any)?.owner?.firstName || (toy as any)?.owner?.email}</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! I'm interested in this toy..."
                className="w-full h-24 p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
