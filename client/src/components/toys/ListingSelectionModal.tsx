import { useState, useEffect } from "react";
import { X, Zap, Package, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface ToyInfo {
  id: number;
  name: string;
  imageUrls?: string[];
  isAvailable?: boolean;
  boostedUntil?: string | null;
}

interface ListingSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (toyId: number) => void;
  mode?: "points" | "paid";
}

export default function ListingSelectionModal({ open, onClose, onSelect, mode = "points" }: ListingSelectionModalProps) {
  const { toast } = useToast();
  const [toys, setToys] = useState<ToyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/users/me/toys", { credentials: "include" })
      .then(r => r.json())
      .then(data => setToys(Array.isArray(data) ? data.filter((t: any) => t.isAvailable !== false) : []))
      .catch(() => toast({ title: "Error", description: "Failed to load toys", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Choose a listing to boost</h2>
          <button onClick={onClose} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading your listings...</div>
          ) : toys.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No eligible toys to boost</p>
              <Link href="/">
                <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px]">
                  List a toy
                </button>
              </Link>
            </div>
          ) : (
            toys.map((toy) => {
              const isBoosted = !!(toy.boostedUntil && new Date(toy.boostedUntil) > new Date());
              const remainingH = isBoosted ? Math.floor((new Date(toy.boostedUntil!).getTime() - Date.now()) / 3600000) : 0;
              return (
                <button
                  key={toy.id}
                  onClick={() => onSelect(toy.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[60px]"
                >
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0">
                    {toy.imageUrls?.[0] ? (
                      <img src={toy.imageUrls[0]} alt={toy.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🧸</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{toy.name}</div>
                    {isBoosted ? (
                      <div className="text-xs text-amber-500 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Boosted – {remainingH}h remaining
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">Available</div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-purple-500 shrink-0">
                    {mode === "paid" ? "Boost" : "Select"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
