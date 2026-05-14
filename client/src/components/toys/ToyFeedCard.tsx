import { useState, useRef, useCallback } from "react";
import { Heart, MapPin } from "lucide-react";
import { normalizeList, ChipRow } from "./MetaChip";

interface Toy {
  id: number;
  name: string;
  description?: string;
  category?: string;
  ageGroup?: string;
  condition?: string;
  imageUrls?: string[];
  location?: string;
  isFavorited?: boolean;
  inExchange?: boolean;
  ownerRating?: number;
}

interface ToyFeedCardProps {
  toy: Toy;
  onOpen: () => void;
  onToggleFavorite: () => void;
}

export default function ToyFeedCard({ toy, onOpen, onToggleFavorite }: ToyFeedCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const images = toy.imageUrls?.filter(Boolean) || [];
  const hasCarousel = images.length > 1;
  const ages = normalizeList(toy.ageGroup);
  const categories = normalizeList(toy.category);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveSlide(idx);
  }, []);

  return (
    <div
      data-testid="toy-feed-card"
      onClick={onOpen}
      className="rounded-2xl overflow-hidden border border-gray-200/60 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm cursor-pointer"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
        {images.length > 0 ? (
          <>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar h-full"
            >
              {images.map((url, i) => (
                <div key={i} className="min-w-full snap-center h-full">
                  <img
                    src={url}
                    alt={toy.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            {hasCarousel && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`block rounded-full transition-all duration-200 ${
                      i === activeSlide
                        ? "w-5 h-2 bg-white shadow-sm"
                        : "w-2 h-2 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">🧸</span>
          </div>
        )}

        {toy.condition && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium bg-black/45 text-white backdrop-blur-sm z-10">
            {toy.condition}
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center z-10"
          aria-label={toy.isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <div className="w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/40 transition-colors">
            <Heart
              className={`w-5 h-5 ${toy.isFavorited ? "text-red-500 fill-red-500" : "text-white"}`}
            />
          </div>
        </button>

        {toy.location && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/45 text-white backdrop-blur-sm z-10">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{toy.location}</span>
          </div>
        )}

        {toy.inExchange && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500 text-white z-10">
            In Exchange
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 line-clamp-1">
          {toy.name}
        </h3>
        <div data-testid="toy-meta-chips" className="mt-2 flex flex-wrap gap-1.5">
          <ChipRow ages={ages} categories={categories} />
        </div>
      </div>
    </div>
  );
}
