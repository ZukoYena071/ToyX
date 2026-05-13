import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ExchangeFormSkeleton } from "@/components/loading-skeletons";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Heart, MessageCircle, MapPin } from "lucide-react";
import type { ToyWithOwner, User } from "@shared/schema";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

export default function ExchangeRequest() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMyToys, setSelectedMyToys] = useState<number[]>([]);
  const [requestMessage, setRequestMessage] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const toyIds = urlParams.get('toys')?.split(',').map(Number).filter(Boolean) || [];
  const ownerId = urlParams.get('owner') || '';

  useEffect(() => { console.log("ExchangeRequest component mounted"); }, []);

  const { data: selectedToys, isLoading: toysLoading, error: toysError } = useQuery<ToyWithOwner[]>({
    queryKey: ["/api/toys/multiple", toyIds],
    queryFn: async () => {
      return await Promise.all(toyIds.map(async id => {
        return await apiRequest("GET", `/api/toys/${id}`, {});
      }));
    },
    enabled: toyIds.length > 0,
  });

  const { data: owner, isLoading: ownerLoading, error: ownerError } = useQuery<User>({
    queryKey: ["/api/users", ownerId],
    enabled: !!ownerId,
  });

  const { data: myToys, isLoading: myToysLoading, error: myToysError } = useQuery<ToyWithOwner[]>({
    queryKey: ["/api/users", (user as any)?.id || "", "toys"],
    enabled: !!(user as any)?.id,
  });

  const availableMyToys = myToys?.filter(toy => toy.isAvailable) || [];

  const createExchangeMutation = useMutation({
    mutationFn: async () => {
      if (selectedMyToys.length === 0) throw new Error("Please select at least one toy to offer");
      if (!toyIds || toyIds.length === 0) throw new Error("No target toy selected");

      const defaultMessage = "Hi! I'd love to exchange toys with you. My kid would really enjoy your toy, and I think yours would like mine too!";
      return await apiRequest("POST", "/api/exchanges", {
        toyId: toyIds[0],
        requestMessage: requestMessage.trim() || defaultMessage,
      });
    },
    onSuccess: (exchange) => {
      toast({ title: "Exchange Request Sent!", description: "Your request has been sent to the toy owner." });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
      setTimeout(() => { window.location.href = `/chat/${exchange.id}`; }, 1000);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to send exchange request", variant: "destructive" });
    },
  });

  const handleToySelection = (toyId: number) => {
    setSelectedMyToys(prev => prev.includes(toyId) ? prev.filter(id => id !== toyId) : [...prev, toyId]);
  };

  if (toysLoading || ownerLoading || myToysLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/search">
            <Button variant="ghost" size="icon" className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
          </Link>
          <div className="animate-pulse h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div className="w-10 h-10" />
        </div>
        <ExchangeFormSkeleton />
      </PageContainer>
    );
  }

  if (toysError || ownerError || myToysError) {
    return (
      <PageContainer className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-500">Error loading exchange details</p>
          <p className="text-xs text-gray-400 mt-2">
            {toysError?.message || ownerError?.message || myToysError?.message}
          </p>
        </div>
      </PageContainer>
    );
  }

  if (!selectedToys || !owner) {
    return (
      <PageContainer className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❓</div>
          <p className="text-gray-500">No data available</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col">
      <PageHeader
        title="Request Exchange"
        rightAction={
          <Link href="/search">
            <button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" />
            </button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={owner.profileImageUrl || undefined} />
              <AvatarFallback className="bg-purple-500 text-white">
                {owner.firstName?.[0] || owner.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-50">
                Exchange with {owner.firstName || owner.email?.split('@')[0]}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedToys.length} toy{selectedToys.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">You want:</h3>
          <div className="grid grid-cols-2 gap-2">
            {selectedToys.map((toy) => (
              <SectionCard key={toy.id} className="p-3">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-2 overflow-hidden">
                  {toy.imageUrls?.[0] ? (
                    <img src={toy.imageUrls[0]} alt={toy.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🧸</div>
                  )}
                </div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50 line-clamp-2">{toy.name}</h4>
                <span className="inline-block mt-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">{toy.category}</span>
              </SectionCard>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Select Your Toys</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">{selectedMyToys.length} selected</span>
          </div>

          {availableMyToys.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You don't have any available toys to exchange</p>
              <Link href="/profile">
                <Button>Add Some Toys</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableMyToys.map((toy) => (
                <SectionCard
                  key={toy.id}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedMyToys.includes(toy.id) ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/10' : 'hover:shadow-sm'
                  }`}
                  onClick={() => handleToySelection(toy.id)}
                >
                  {selectedMyToys.includes(toy.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center z-10">
                      <Heart className="w-3 h-3 text-white fill-current" />
                    </div>
                  )}
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-2 overflow-hidden">
                    {toy.imageUrls?.[0] ? (
                      <img src={toy.imageUrls[0]} alt={toy.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🧸</div>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-1 line-clamp-2">{toy.name}</h4>
                  <div className="flex items-center justify-between gap-1">
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">{toy.category}</span>
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">{toy.condition}</span>
                  </div>
                  {toy.location && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{toy.location}</span>
                    </div>
                  )}
                </SectionCard>
              ))}
            </div>
          )}
        </div>

        <div className="px-4">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-2 block">Message (Optional)</label>
          <Textarea
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            placeholder="Hi! I'd love to exchange toys with you. My kid would really enjoy your toy, and I think yours would like mine too!"
            className="rounded-2xl"
            rows={3}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            💬 {requestMessage.trim() ? "This message" : "The default message"} will appear as your first chat message
          </p>
        </div>

        <div className="p-4 mt-4">
          <div className="space-y-3">
            <Button
              onClick={() => createExchangeMutation.mutate()}
              disabled={createExchangeMutation.isPending || selectedMyToys.length === 0 || !user}
              className="w-full py-3 rounded-2xl text-base font-semibold"
            >
              {createExchangeMutation.isPending ? "Sending Request..." :
               !user ? "Please log in to request exchange" :
               selectedMyToys.length === 0 ? "Select toys to exchange" :
               "Send Exchange Request"}
            </Button>

            <Button
              variant="outline"
              className="w-full border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 py-3 rounded-2xl"
              onClick={() => window.location.href = `/users/${ownerId}`}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              View More Toys
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </PageContainer>
  );
}
