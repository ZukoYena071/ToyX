import { cn } from "@/lib/utils";

// Base skeleton component with toy-themed animations
const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-muted/40 dark:via-muted/60 dark:to-muted/40 bg-[length:200%_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  );
};

// Toy card skeleton with cute animations
export const ToyCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-4 shadow-sm">
      {/* Image skeleton */}
      <div className="aspect-square bg-gradient-to-br from-peach/20 via-mint/20 to-powder/20 rounded-2xl mb-3 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl animate-bounce">🧸</div>
        </div>
        <Skeleton className="absolute inset-0 rounded-2xl opacity-30" />
      </div>
      
      {/* Title skeleton */}
      <Skeleton className="h-5 w-3/4 mb-2 rounded-full" />
      
      {/* Description skeleton */}
      <Skeleton className="h-3 w-full mb-1 rounded-full" />
      <Skeleton className="h-3 w-2/3 mb-3 rounded-full" />
      
      {/* Badges skeleton */}
      <div className="flex gap-2 mb-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      
      {/* Location skeleton */}
      <div className="flex items-center gap-1">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-20 rounded-full" />
      </div>
    </div>
  );
};

// Profile skeleton with toy-themed elements
export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 bg-white dark:bg-card rounded-2xl">
        <div className="relative">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl animate-pulse">👤</div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center p-4 bg-white dark:bg-card rounded-2xl">
            <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
            <Skeleton className="h-4 w-12 mx-auto rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Chat message skeleton with playful animations
export const ChatMessageSkeleton = ({ isOwn = false }: { isOwn?: boolean }) => {
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <div className="relative">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-sm animate-spin">🎭</div>
        </div>
      </div>
      <div className={`flex-1 max-w-xs ${isOwn ? 'text-right' : ''}`}>
        <div className={`p-3 rounded-2xl ${isOwn ? 'bg-royal/10' : 'bg-gray-100 dark:bg-muted'}`}>
          <Skeleton className="h-4 w-full mb-1 rounded-full" />
          <Skeleton className="h-4 w-3/4 rounded-full" />
        </div>
        <Skeleton className="h-3 w-12 mt-1 rounded-full" />
      </div>
    </div>
  );
};

// Exchange request form skeleton
export const ExchangeFormSkeleton = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Selected toys section */}
      <div>
        <Skeleton className="h-6 w-32 mb-4 rounded-full" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="relative">
              <ToyCardSkeleton />
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-gradient-to-r from-royal to-royal/80 rounded-full flex items-center justify-center animate-pulse">
                  <div className="text-xs">💝</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Your toys section */}
      <div>
        <Skeleton className="h-6 w-28 mb-4 rounded-full" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <ToyCardSkeleton key={i} />
          ))}
        </div>
      </div>
      
      {/* Message area */}
      <div>
        <Skeleton className="h-5 w-20 mb-2 rounded-full" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
      
      {/* Button */}
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
};

// Toy grid skeleton for search/browse pages
export const ToyGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ToyCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Search results skeleton with cute loading state
export const SearchSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Search header */}
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-card rounded-2xl">
        <div className="animate-spin text-2xl">🔍</div>
        <div className="flex-1">
          <Skeleton className="h-5 w-48 mb-1 rounded-full" />
          <Skeleton className="h-3 w-32 rounded-full" />
        </div>
      </div>
      
      {/* Results */}
      <ToyGridSkeleton count={8} />
    </div>
  );
};

// Loading spinner with toy theme
export const ToySpinner = ({ size = "md", className }: { size?: "sm" | "md" | "lg", className?: string }) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-lg",
    md: "w-8 h-8 text-xl", 
    lg: "w-12 h-12 text-3xl"
  };
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("animate-spin", sizeClasses[size])}>
        🎪
      </div>
    </div>
  );
};

// Page loading skeleton with brand elements
export const PageLoadingSkeleton = ({ title }: { title?: string }) => {
  return (
    <div className="min-h-screen bg-cream dark:bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-sm border-b border-gray-100 dark:border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="animate-bounce text-2xl">🎯</div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-6">
        {title && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 animate-pulse">🏰</div>
            <Skeleton className="h-8 w-48 mx-auto rounded-full" />
          </div>
        )}
        
        <ToyGridSkeleton count={6} />
      </div>
      
      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background border-t border-gray-100 dark:border-border p-4">
        <div className="flex justify-around">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-8 h-8 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
};

export { Skeleton };