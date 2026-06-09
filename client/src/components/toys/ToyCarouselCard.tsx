import { Heart, Star } from "lucide-react";
import { normalizeList, ChipRow } from "./MetaChip";
import { formatDistanceAway } from "@/lib/formatDistance";
import ToyImage from "@/components/ToyImage";

interface Toy {
  id: number;
  name: string;
  category?: string;
  ageGroup?: string;
  condition?: string;
  imageUrls?: string[];
  location?: string;
  isFavorited?: boolean;
  inExchange?: boolean;
  distanceKm?: number;
  ownerRating?: number;
}

interface ToyCarouselCardProps {
  toy: Toy;
  onOpen: () => void;
  onToggleFavorite: () => void;
}

export default function ToyCarouselCard({ toy, onOpen, onToggleFavorite }: ToyCarouselCardProps) {
  const images = toy.imageUrls?.filter(Boolean) || [];
  const ages = normalizeList(toy.ageGroup);
  const categories = normalizeList(toy.category);

  return (
    <div
      onClick={onOpen}
      className="flex-shrink-0 w-[78%] sm:w-[340px] rounded-2xl overflow-hidden border border-gray-200/60 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm cursor-pointer"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {images.length > 0 ? (
          <ToyImage src={images[0]} alt={toy.name} className="absolute inset-0 w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">🧸</span></div>
        )}

        {toy.condition && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium bg-black/45 text-white backdrop-blur-sm z-10">
            {toy.condition}
          </span>
        )}
        {(toy as any).isBoosted && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/80 text-white backdrop-blur-sm z-10 flex items-center gap-1 ml-[72px]">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Boosted
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center z-10"
          aria-label={toy.isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <div className="w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/40 transition-colors">
            <Heart className={`w-5 h-5 ${toy.isFavorited ? "text-red-500 fill-red-500" : "text-white"}`} />
          </div>
        </button>

        {toy.location && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/45 text-white backdrop-blur-sm z-10">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="truncate max-w-[100px]">{toy.distanceKm != null ? formatDistanceAway(toy.distanceKm) : toy.location}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        {(toy as any).isExample && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
            <span>⭐</span>
            ToyX Example
          </span>
        )}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 line-clamp-1">{toy.name}</h3>
        {(ages.length > 0 || categories.length > 0) && <ChipRow ages={ages} categories={categories} />}
        {toy.ownerRating != null && toy.ownerRating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{toy.ownerRating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
