import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Search, Filter, Heart, MapPin, Star, ArrowLeft, Grid3X3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/loading-skeletons";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import BadgePill from "@/components/ui/BadgePill";
import EmptyState from "@/components/ui/EmptyState";
import ToyFeedCard from "@/components/toys/ToyFeedCard";
import { apiRequest } from "@/lib/queryClient";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";

function goToToy(toyId: number) {
  if (typeof window !== "undefined" && window.scrollY > 0) {
    sessionStorage.setItem("toyx_search_scroll", String(window.scrollY));
  }
  window.location.href = `/toy/${toyId}`;
}

export default function BrowsePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedDistance, setSelectedDistance] = useState('All');
  const [selectedDateAdded, setSelectedDateAdded] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('search-view-mode') as 'grid' | 'list') || 'list';
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nearestFilter = urlParams.get('nearest');
    const recentFilter = urlParams.get('recent');
    if (nearestFilter === 'true') {
      setSelectedDistance('1-5km');
      setShowFilters(true);
    }
    if (recentFilter === 'true') {
      setSelectedDateAdded('Past 2 days');
      setShowFilters(true);
    }
  }, []);

  const handleViewModeChange = (newViewMode: 'grid' | 'list') => {
    setViewMode(newViewMode);
    localStorage.setItem('search-view-mode', newViewMode);
  };

  const favoriteMutation = useMutation({
    mutationFn: async ({ toyId, isFavorited }: { toyId: number; isFavorited: boolean }) => {
      if (isFavorited) {
        return await apiRequest('DELETE', `/api/favorites/${toyId}`);
      } else {
        return await apiRequest('POST', '/api/favorites', { toyId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/toys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });

  const categories = ['All', 'Action Figures', 'Dolls', 'Building', 'Educational', 'Outdoor', 'Board Games'];
  const conditions = ['All', 'Like New', 'Excellent', 'Good', 'Fair'];
  const distances = ['All', 'Under 1km', '1-5km', '5-10km', '10km+'];
  const dateOptions = ['All', 'Past 2 days', 'Past week', 'Past month'];

  const { data: toys, isLoading } = useQuery({
    queryKey: ["/api/toys"],
  });

  const filteredToys = Array.isArray(toys) ? toys.filter((toy: any) => {
    const matchesSearch = toy.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || toy.category === selectedCategory;
    const matchesCondition = selectedCondition === 'All' || toy.condition === selectedCondition;
    let matchesDistance = selectedDistance === 'All';
    if (!matchesDistance) {
      const toyDistance = parseFloat(toy.distance || '0');
      if (selectedDistance === 'Under 1km') matchesDistance = toyDistance < 1;
      else if (selectedDistance === '1-5km') matchesDistance = toyDistance <= 5;
      else if (selectedDistance === '5-10km') matchesDistance = toyDistance > 5 && toyDistance <= 10;
      else if (selectedDistance === '10km+') matchesDistance = toyDistance > 10;
    }
    let matchesDate = selectedDateAdded === 'All';
    if (!matchesDate && toy.createdAt) {
      const toyDate = new Date(toy.createdAt);
      const daysDiff = (Date.now() - toyDate.getTime()) / (1000 * 3600 * 24);
      if (selectedDateAdded === 'Past 2 days') matchesDate = daysDiff <= 2;
      else if (selectedDateAdded === 'Past week') matchesDate = daysDiff <= 7;
      else if (selectedDateAdded === 'Past month') matchesDate = daysDiff <= 30;
    }
    return matchesSearch && matchesCategory && matchesCondition && matchesDistance && matchesDate;
  }) : [];

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedCondition('All');
    setSelectedDistance('All');
    setSelectedDateAdded('All');
  };

  const activeFiltersCount = [selectedCategory, selectedCondition, selectedDistance, selectedDateAdded].filter(f => f !== 'All').length;

  // Restore scroll position when returning from toy detail (after data loads so page is full height)
  useEffect(() => {
    const saved = sessionStorage.getItem("toyx_search_scroll");
    if (saved && !isLoading && filteredToys.length > 0) {
      sessionStorage.removeItem("toyx_search_scroll");
      const pos = parseInt(saved, 10);
      // Small timeout to ensure layout is fully settled
      setTimeout(() => window.scrollTo(0, pos), 50);
    }
  }, [isLoading, filteredToys]);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  const FilterPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 min-h-[36px] ${
        active ? 'bg-purple-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title="Browse Toys"
        rightAction={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
              className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px]"
            >
              {viewMode === 'grid' ? <List className="text-gray-600 dark:text-gray-300 w-4 h-4" /> : <Grid3X3 className="text-gray-600 dark:text-gray-300 w-4 h-4" />}
            </button>
            <Link href="/">
              <button className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px]">
                <ArrowLeft className="text-gray-600 dark:text-gray-300 w-4 h-4" />
              </button>
            </Link>
          </div>
        }
      />

      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400 w-4 h-4" />
            </div>
            <Input
              type="text"
              placeholder="Search toys, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-medium transition-colors min-h-[44px]"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-purple-500 text-xs px-2 py-0.5 rounded-full font-bold">{activeFiltersCount}</span>
              )}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">{filteredToys.length} toys found</span>
          </div>
        </div>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => <FilterPill key={c} label={c} active={selectedCategory === c} onClick={() => setSelectedCategory(c)} />)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Condition</label>
                <div className="flex flex-wrap gap-2">
                  {conditions.map((c) => <FilterPill key={c} label={c} active={selectedCondition === c} onClick={() => setSelectedCondition(c)} />)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Distance</label>
                <div className="flex flex-wrap gap-2">
                  {distances.map((d) => <FilterPill key={d} label={d} active={selectedDistance === d} onClick={() => setSelectedDistance(d)} />)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Added</label>
                <div className="flex flex-wrap gap-2">
                  {dateOptions.map((d) => <FilterPill key={d} label={d} active={selectedDateAdded === d} onClick={() => setSelectedDateAdded(d)} />)}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <button onClick={clearFilters} className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors min-h-[44px]">
                  Clear All
                </button>
                <button onClick={() => setShowFilters(false)} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px]">
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

          <div className="px-4 py-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {filteredToys.map((toy: any) => (
              <Link key={toy.id} href={`/toy/${toy.id}`}>
                <SectionCard className="overflow-hidden p-0">
                  <div className="aspect-square bg-gray-50 dark:bg-gray-800 relative overflow-hidden">
                    {toy.imageUrls && toy.imageUrls[0] ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img src={toy.imageUrls[0]} alt={toy.name} className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-60" />
                        <img src={toy.imageUrls[0]} alt={toy.name} className="absolute inset-0 w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-4xl">🧸</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); favoriteMutation.mutate({ toyId: toy.id, isFavorited: toy.isFavorited || false }); }}
                        className="w-7 h-7 bg-white dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        disabled={favoriteMutation.isPending}
                      >
                        <Heart className={`w-3 h-3 ${toy.isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 line-clamp-2">{toy.name}</h3>
                    <div className="flex items-center gap-1">
                      <MapPin className="text-purple-500 w-3 h-3" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{toy.location || 'Unknown location'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <BadgePill label={toy.condition} variant={toy.condition === 'Like New' ? 'success' : toy.condition === 'Excellent' ? 'info' : 'warning'} />
                        {toy.inExchange && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                            In Exchange
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-400 w-3 h-3 fill-current" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{(toy.ownerRating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToToy(toy.id); }}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px]"
                    >
                      View Details
                    </button>
                  </div>
                </SectionCard>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {filteredToys.map((toy: any) => (
              <ToyFeedCard
                key={toy.id}
                toy={toy}
                onOpen={() => goToToy(toy.id)}
                onToggleFavorite={() => favoriteMutation.mutate({ toyId: toy.id, isFavorited: toy.isFavorited || false })}
              />
            ))}
          </div>
        )}

        {filteredToys.length === 0 && (
          <EmptyState
            icon={<div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center"><Search className="text-gray-400 w-6 h-6" /></div>}
            title="No toys found"
            subtitle="Try adjusting your search or filters"
            action={
              <button onClick={clearFilters} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl font-medium transition-colors min-h-[44px]">
                Clear Filters
              </button>
            }
          />
        )}
      </div>

      <BottomNav />
    </PageContainer>
  );
}
