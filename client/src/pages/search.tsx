import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Search, 
  Filter, 
  X, 
  ArrowLeft, 
  Grid3X3, 
  List, 
  Heart, 
  MapPin, 
  Star,
  Home,
  MessageCircle,
  User,
  Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PageLoadingSkeleton } from "@/components/loading-skeletons";
import BottomNav from "@/components/bottom-nav";
import { apiRequest } from "@/lib/queryClient";

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
    return (localStorage.getItem('search-view-mode') as 'grid' | 'list') || 'grid';
  });

  // Check URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nearestFilter = urlParams.get('nearest');
    const recentFilter = urlParams.get('recent');
    
    if (nearestFilter === 'true') {
      setSelectedDistance('1-5km'); // Set to show nearest toys (Under 1km and 1-5km)
      setShowFilters(true); // Show filters so user can see the applied filter
    }
    
    if (recentFilter === 'true') {
      setSelectedDateAdded('Past 2 days'); // Set to show recently added toys
      setShowFilters(true); // Show filters so user can see the applied filter
    }
  }, []);

  // Handle view mode change with persistence
  const handleViewModeChange = (newViewMode: 'grid' | 'list') => {
    setViewMode(newViewMode);
    localStorage.setItem('search-view-mode', newViewMode);
  };

  // Mutation for favoriting toys
  const favoriteMutation = useMutation({
    mutationFn: async ({ toyId, isFavorited }: { toyId: number; isFavorited: boolean }) => {
      console.log('Search: Favoriting toy:', { toyId, isFavorited });
      if (isFavorited) {
        // Remove from favorites
        return await apiRequest('DELETE', `/api/favorites/${toyId}`);
      } else {
        // Add to favorites
        return await apiRequest('POST', '/api/favorites', { toyId });
      }
    },
    onSuccess: () => {
      console.log('Search: Favorite mutation successful');
      queryClient.invalidateQueries({ queryKey: ["/api/toys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: (error) => {
      console.error('Search: Favorite mutation error:', error);
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
    
    // Enhanced distance filtering logic
    let matchesDistance = selectedDistance === 'All';
    if (!matchesDistance) {
      const toyDistance = parseFloat(toy.distance || '0');
      if (selectedDistance === 'Under 1km') {
        matchesDistance = toyDistance < 1;
      } else if (selectedDistance === '1-5km') {
        // When "nearest" filter is applied, show both Under 1km AND 1-5km
        const urlParams = new URLSearchParams(window.location.search);
        const nearestFilter = urlParams.get('nearest');
        if (nearestFilter === 'true') {
          matchesDistance = toyDistance <= 5; // Include both Under 1km and 1-5km
        } else {
          matchesDistance = toyDistance >= 1 && toyDistance <= 5;
        }
      } else if (selectedDistance === '5-10km') {
        matchesDistance = toyDistance > 5 && toyDistance <= 10;
      } else if (selectedDistance === '10km+') {
        matchesDistance = toyDistance > 10;
      }
    }

    // Date filtering logic
    let matchesDate = selectedDateAdded === 'All';
    if (!matchesDate && toy.createdAt) {
      const toyDate = new Date(toy.createdAt);
      const now = new Date();
      const daysDiff = (now.getTime() - toyDate.getTime()) / (1000 * 3600 * 24);
      
      if (selectedDateAdded === 'Past 2 days') {
        matchesDate = daysDiff <= 2;
      } else if (selectedDateAdded === 'Past week') {
        matchesDate = daysDiff <= 7;
      } else if (selectedDateAdded === 'Past month') {
        matchesDate = daysDiff <= 30;
      }
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

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Sticky Header - Logo and Profile Only */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-4 max-w-sm mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <ArrowLeft className="text-gray-600 w-4 h-4" />
                </button>
              </Link>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Browse Toys</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
                className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {viewMode === 'grid' ? (
                  <List className="text-gray-600 dark:text-gray-300 w-4 h-4" />
                ) : (
                  <Grid3X3 className="text-gray-600 dark:text-gray-300 w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-sm mx-auto">
        {/* Search Bar and Filters */}
<div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <div className="px-4 py-4">
            {/* Search Bar */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400 w-4 h-4" />
              </div>
              <Input
                type="text"
                placeholder="Search toys, brands, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-white text-purple-500 text-xs px-2 py-1 rounded-full font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredToys.length} toys found
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <div className="py-4 space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          selectedCategory === category
                            ? 'bg-purple-500 text-white'
                            : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Condition</label>
                  <div className="flex flex-wrap gap-2">
                    {conditions.map((condition) => (
                      <button
                        key={condition}
                        onClick={() => setSelectedCondition(condition)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          selectedCondition === condition
                            ? 'bg-purple-500 text-white'
                            : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500'
                        }`}
                      >
                        {condition}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Distance</label>
                  <div className="flex flex-wrap gap-2">
                    {distances.map((distance) => (
                      <button
                        key={distance}
                        onClick={() => setSelectedDistance(distance)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          selectedDistance === distance
                            ? 'bg-purple-500 text-white'
                            : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500'
                        }`}
                      >
                        {distance}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Added Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Added</label>
                  <div className="flex flex-wrap gap-2">
                    {dateOptions.map((dateOption) => (
                      <button
                        key={dateOption}
                        onClick={() => setSelectedDateAdded(dateOption)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          selectedDateAdded === dateOption
                            ? 'bg-purple-500 text-white'
                            : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500'
                        }`}
                      >
                        {dateOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={clearFilters}
                    className="text-gray-500 dark:text-gray-400 text-sm font-medium hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="px-4 py-6">
          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 gap-4 mb-8">
              {filteredToys.map((toy: any) => (
                <Link key={toy.id} href={`/toy/${toy.id}`}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="aspect-square bg-gray-50 relative">
                      {toy.imageUrls && toy.imageUrls[0] ? (
                        <img
                          src={toy.imageUrls[0]}
                          alt={toy.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-4xl">🧸</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Search heart clicked (grid):', toy.id, toy.isFavorited);
                            favoriteMutation.mutate({ toyId: toy.id, isFavorited: toy.isFavorited || false });
                          }}
                          className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                          disabled={favoriteMutation.isPending}
                        >
                          <Heart className={`w-4 h-4 ${toy.isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-1 line-clamp-2">
                        {toy.name}
                      </h3>
                      <div className="flex items-center space-x-1 mb-2">
                        <MapPin className="text-purple-500 w-3 h-3" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{toy.location || 'Unknown location'}</span>
                      </div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              toy.condition === 'Like New' 
                                ? 'bg-green-100 text-green-700'
                                : toy.condition === 'Excellent'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {toy.condition}
                            </span>
                            {toy.inExchange && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                In Exchange
                              </span>
                            )}
                          </div>
                        <div className="flex items-center space-x-1">
                          <Star className="text-yellow-400 w-3 h-3 fill-current" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{(toy.ownerRating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/toy/${toy.id}`;
                        }}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4 mb-8">
              {filteredToys.map((toy: any) => (
                <Link key={toy.id} href={`/toy/${toy.id}`}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
                    <div className="flex space-x-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                        {toy.imageUrls && toy.imageUrls[0] ? (
                          <img
                            src={toy.imageUrls[0]}
                            alt={toy.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <span className="text-2xl">🧸</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-800 dark:text-white text-sm line-clamp-1">
                            {toy.name}
                          </h3>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Search heart clicked (list):', toy.id, toy.isFavorited);
                              favoriteMutation.mutate({ toyId: toy.id, isFavorited: toy.isFavorited || false });
                            }}
                            className="ml-2"
                            disabled={favoriteMutation.isPending}
                          >
                            <Heart className={`w-4 h-4 ${toy.isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{toy.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <MapPin className="text-purple-500 w-3 h-3" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">{toy.location || 'Unknown location'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="text-yellow-400 w-3 h-3 fill-current" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">{(toy.ownerRating || 0).toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              toy.condition === 'Like New' 
                                ? 'bg-green-100 text-green-700'
                                : toy.condition === 'Excellent'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {toy.condition}
                            </span>
                            {toy.inExchange && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                In Exchange
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/toy/${toy.id}`;
                          }}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {filteredToys.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-gray-400 dark:text-gray-500 w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No toys found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Try adjusting your search or filters</p>
              <button
                onClick={clearFilters}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Use the shared BottomNav component */}
      <BottomNav />
    </div>
  );
}