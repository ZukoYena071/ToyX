import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ExchangeFormSkeleton, ToyCardSkeleton } from "@/components/loading-skeletons";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Heart, MessageCircle, MapPin } from "lucide-react";
import type { ToyWithOwner, User } from "@shared/schema";
import BottomNav from "@/components/bottom-nav";

export default function ExchangeRequest() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMyToys, setSelectedMyToys] = useState<number[]>([]);
  const [requestMessage, setRequestMessage] = useState("");

  // Parse URL parameters with more robust parsing
  const urlParams = new URLSearchParams(window.location.search);
  const toyIds = urlParams.get('toys')?.split(',').map(Number).filter(Boolean) || [];
  const ownerId = urlParams.get('owner') || '';
  
  console.log("URL parsing debug:", {
    fullLocation: window.location.href,
    search: window.location.search,
    pathname: window.location.pathname,
    wouter_location: location,
    parsed_toyIds: toyIds,
    parsed_ownerId: ownerId
  });

  console.log("ExchangeRequest page loaded with:", {
    location,
    toyIds,
    ownerId,
    user: (user as any)?.id,
    searchParams: urlParams.toString()
  });

  // Add effect to log when component mounts
  useEffect(() => {
    console.log("ExchangeRequest component mounted");
  }, []);

  // Get selected toys to exchange for
  const { data: selectedToys, isLoading: toysLoading, error: toysError } = useQuery<ToyWithOwner[]>({
    queryKey: ["/api/toys/multiple", toyIds],
    queryFn: async () => {
      console.log("Fetching toys:", toyIds);
      const toys = await Promise.all(
        toyIds.map(async id => {
          console.log("Fetching toy:", id);
          const toy = await apiRequest("GET", `/api/toys/${id}`, {});
          console.log("Received toy:", toy);
          return toy;
        })
      );
      console.log("All toys fetched:", toys);
      return toys;
    },
    enabled: toyIds.length > 0,
  });

  // Get owner information
  const { data: owner, isLoading: ownerLoading, error: ownerError } = useQuery<User>({
    queryKey: ["/api/users", ownerId],
    enabled: !!ownerId,
  });

  // Get current user's toys
  const { data: myToys, isLoading: myToysLoading, error: myToysError } = useQuery<ToyWithOwner[]>({
    queryKey: ["/api/users", (user as any)?.id || "", "toys"],
    enabled: !!(user as any)?.id,
  });

  const availableMyToys = myToys?.filter(toy => toy.isAvailable) || [];

  const createExchangeMutation = useMutation({
    mutationFn: async () => {
      console.log("=== EXCHANGE CREATION START ===");
      console.log("Selected my toys:", selectedMyToys);
      console.log("Target toy IDs:", toyIds);
      console.log("Owner ID:", ownerId);
      console.log("Request message:", requestMessage);
      
      if (selectedMyToys.length === 0) {
        throw new Error("Please select at least one toy to offer");
      }
      
      if (!toyIds || toyIds.length === 0) {
        throw new Error("No target toy selected");
      }
      
      const defaultMessage = "Hi! I'd love to exchange toys with you. My kid would really enjoy your toy, and I think yours would like mine too!";
      const finalMessage = requestMessage.trim() || defaultMessage;
      
      const requestData = {
        toyId: toyIds[0],
        requestMessage: finalMessage,
      };
      
      console.log("Request message being sent:", finalMessage);
      
      console.log("Sending API request with data:", requestData);
      
      try {
        const response = await apiRequest("POST", "/api/exchanges", requestData);
        console.log("API response received:", response);
        return response;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (exchange) => {
      console.log("=== EXCHANGE CREATION SUCCESS ===");
      console.log("Exchange created:", exchange);
      toast({
        title: "Exchange Request Sent!",
        description: "Your request has been sent to the toy owner. You can chat with them to coordinate the exchange.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
      // Redirect to chat
      setTimeout(() => {
        window.location.href = `/chat/${exchange.id}`;
      }, 1000);
    },
    onError: (error: Error) => {
      console.error("=== EXCHANGE CREATION ERROR ===");
      console.error("Error details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send exchange request",
        variant: "destructive",
      });
    },
  });

  const handleToySelection = (toyId: number) => {
    setSelectedMyToys(prev => 
      prev.includes(toyId) 
        ? prev.filter(id => id !== toyId)
        : [...prev, toyId]
    );
  };

  // Add debug logging for loading states
  console.log("Loading states:", {
    toysLoading,
    ownerLoading, 
    myToysLoading,
    selectedToys: !!selectedToys,
    owner: !!owner,
    myToys: !!myToys,
    toysError,
    ownerError,
    myToysError
  });

  if (toysLoading || ownerLoading || myToysLoading) {
    return (
      <div className="max-w-sm mx-auto bg-white dark:bg-background min-h-screen">
        <div className="flex items-center justify-between p-4 border-b dark:border-border">
          <Link href="/search">
            <Button variant="ghost" size="icon" className="w-10 h-10 bg-gray-100 dark:bg-muted rounded-full">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-muted-foreground" />
            </Button>
          </Link>
          <div className="animate-pulse h-6 w-32 bg-gray-200 dark:bg-muted rounded-full"></div>
          <div className="w-10 h-10" />
        </div>
        <ExchangeFormSkeleton />
      </div>
    );
  }

  if (toysError || ownerError || myToysError) {
    return (
      <div className="max-w-sm mx-auto bg-white dark:bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-toy-bounce">❌</div>
          <p className="text-red-500">Error loading exchange details</p>
          <p className="text-xs text-gray-400 mt-2">
            {toysError?.message || ownerError?.message || myToysError?.message}
          </p>
        </div>
      </div>
    );
  }

  if (!selectedToys || !owner) {
    return (
      <div className="max-w-sm mx-auto bg-white dark:bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-toy-roll">❓</div>
          <p className="text-gray-500">No data available</p>
          <p className="text-xs text-gray-400 mt-2">
            Toys: {selectedToys ? 'loaded' : 'missing'}, Owner: {owner ? 'loaded' : 'missing'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-white dark:bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-border">
        <Link href={`/users/${ownerId}`}>
          <Button variant="ghost" size="icon" className="w-10 h-10 bg-gray-100 dark:bg-muted rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-muted-foreground" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold text-charcoal dark:text-foreground">Request Exchange</h1>
        <div className="w-10 h-10" />
      </div>

      {/* Owner & Selected Toys */}
      <div className="p-4 bg-gradient-to-br from-powder/20 to-mint/20 dark:from-powder/10 dark:to-mint/10">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={owner.profileImageUrl || undefined} />
            <AvatarFallback className="bg-royal text-white">
              {owner.firstName?.[0] || owner.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-bold text-charcoal dark:text-foreground">
              Exchange with {owner.firstName || owner.email?.split('@')[0]}
            </h2>
            <p className="text-sm text-gray-600 dark:text-muted-foreground">
              {selectedToys.length} toy{selectedToys.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>

        {/* Selected Toys */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-charcoal dark:text-foreground">You want:</h3>
          <div className="grid grid-cols-2 gap-2">
            {selectedToys.map((toy) => (
              <Card key={toy.id} className="bg-white dark:bg-card">
                <CardContent className="p-3">
                  <div className="aspect-square bg-gray-100 dark:bg-muted rounded-lg mb-2 overflow-hidden">
                    {toy.imageUrls?.[0] ? (
                      <img 
                        src={toy.imageUrls[0]} 
                        alt={toy.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🧸</div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-charcoal dark:text-foreground line-clamp-2">
                    {toy.name}
                  </h4>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {toy.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* My Toys Selection */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-charcoal dark:text-foreground">Select Your Toys</h3>
          <span className="text-sm text-gray-500 dark:text-muted-foreground">
            {selectedMyToys.length} selected
          </span>
        </div>

        {availableMyToys.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-gray-500 dark:text-muted-foreground mb-4">
              You don't have any available toys to exchange
            </p>
            <Link href="/profile">
              <Button className="bg-royal hover:bg-royal/90 text-white rounded-2xl">
                Add Some Toys
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {availableMyToys.map((toy) => (
              <Card 
                key={toy.id} 
                className={`relative cursor-pointer transition-all ${
                  selectedMyToys.includes(toy.id) 
                    ? 'ring-2 ring-royal bg-royal/5' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleToySelection(toy.id)}
              >
                {selectedMyToys.includes(toy.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-royal rounded-full flex items-center justify-center z-10">
                    <Heart className="w-3 h-3 text-white fill-current" />
                  </div>
                )}
                <CardContent className="p-3">
                  <div className="aspect-square bg-gray-100 dark:bg-muted rounded-lg mb-2 overflow-hidden">
                    {toy.imageUrls?.[0] ? (
                      <img 
                        src={toy.imageUrls[0]} 
                        alt={toy.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🧸</div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-charcoal dark:text-foreground mb-1 line-clamp-2">
                    {toy.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {toy.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {toy.condition}
                    </Badge>
                  </div>
                  {toy.location && (
                    <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500 dark:text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{toy.location}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Request Message */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-charcoal dark:text-foreground mb-2 block">
              Message (Optional)
            </label>
            <Textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Hi! I'd love to exchange toys with you. My kid would really enjoy your toy, and I think yours would like mine too!"
              className="rounded-2xl border-gray-200 dark:border-border"
              rows={3}
            />
            <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
              💬 {requestMessage.trim() ? "This message" : "The default message"} will appear as your first chat message
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => {
                console.log("Button clicked, starting exchange creation...");
                console.log("Selected toys:", selectedMyToys);
                console.log("Available toys:", availableMyToys.length);
                console.log("Request message:", requestMessage);
                console.log("User authenticated:", !!user);
                console.log("User ID:", (user as any)?.id);
                createExchangeMutation.mutate();
              }}
              disabled={createExchangeMutation.isPending || selectedMyToys.length === 0 || !user}
              className="w-full bg-royal hover:bg-royal/90 text-white py-3 rounded-2xl text-lg font-semibold"
            >
              {createExchangeMutation.isPending ? "Sending Request..." : 
               !user ? "Please log in to request exchange" :
               selectedMyToys.length === 0 ? "Select toys to exchange" :
               "Send Exchange Request"
              }
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full border-royal text-royal hover:bg-royal hover:text-white py-3 rounded-2xl"
              onClick={() => window.location.href = `/users/${ownerId}`}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              View More Toys
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}