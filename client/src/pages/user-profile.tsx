import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Calendar, Star, Heart, Flag } from "lucide-react";
import { ProfileSkeleton } from "@/components/loading-skeletons";
import type { User, ToyWithOwner, ReviewWithUser } from "@shared/schema";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import EmptyState from "@/components/ui/EmptyState";
import ReportUserModal from "@/components/toys/ReportUserModal";
import FeaturedBadge from "@/components/profile/FeaturedBadge";
import { formatLocation } from "@/lib/formatLocation";

export default function UserProfile() {
  const { userId } = useParams();
  const [selectedToys, setSelectedToys] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"toys" | "reviews">("toys");
  const [showReportModal, setShowReportModal] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: userToys, isLoading: toysLoading } = useQuery<ToyWithOwner[]>({
    queryKey: ["/api/users", userId, "toys"],
    enabled: !!userId && !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: userReviews } = useQuery<ReviewWithUser[]>({
    queryKey: ["/api/users", userId, "reviews"],
    enabled: !!userId && !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: averageRating } = useQuery<{ averageRating: number }>({
    queryKey: ["/api/users", userId, "rating"],
    enabled: !!userId && !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const availableToys = userToys?.filter(toy => toy.isAvailable) || [];
  const reviewCount = userReviews?.length || 0;
  const rating = averageRating?.averageRating || 0;

  const handleToySelection = (toyId: number) => {
    setSelectedToys(prev =>
      prev.includes(toyId) ? prev.filter(id => id !== toyId) : [...prev, toyId]
    );
  };

  const handleRequestExchange = () => {
    if (selectedToys.length === 0) return;
    const toyIds = selectedToys.join(',');
    window.location.assign(`/exchange-request?toys=${toyIds}&owner=${userId}`);
  };

  if (userLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <PageContainer className="pb-24">
        <PageHeader title="Profile" />
        <div className="px-4 py-6 text-center mt-20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">User not found</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">The user you're looking for doesn't exist.</p>
          <Link href="/">
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl font-medium transition-colors min-h-[44px]">Back to Home</button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-24">
      <PageHeader
        title="Profile"
        rightAction={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowReportModal(true)} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Report user">
              <Flag className="text-gray-600 dark:text-gray-300 w-4 h-4" />
            </button>
            <button onClick={() => window.history.back()} className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <svg className="text-gray-600 dark:text-gray-300 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        }
      />

      <div className="px-4 py-6 space-y-4">
        {/* Profile Card */}
        <SectionCard className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center shadow-sm">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Profile" className="w-16 h-16 rounded-2xl object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-0.5">
                {user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : user.email?.split('@')[0] || 'User'}
                {(user as any).featuredBadge && (
                  <FeaturedBadge type={(user as any).featuredBadge} memberNumber={(user as any).memberNumber} />
                )}
              </h2>
              {(user as any).accountType !== "official" && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600"}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{rating.toFixed(1)} ({reviewCount} reviews)</span>
                </div>
              )}
              <div className="flex items-center gap-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Statistics Grid / Educational Banner */}
          {(user as any).accountType === "official" ? (
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-50">📚 Community Guide</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Browse these example listings to learn how to create high-quality ToyX listings and increase your chances of successful exchanges.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { value: availableToys.length, label: "Available Toys", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
                { value: reviewCount, label: "Reviews", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
                { value: rating.toFixed(1), label: "Rating", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} rounded-xl p-3 text-center`}>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className={`text-xs ${stat.color} font-medium`}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Selected Toys Bar */}
        {selectedToys.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {selectedToys.length} toy{selectedToys.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <button
                onClick={handleRequestExchange}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px]"
              >
                Request Exchange
              </button>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <SectionCard>
          <div className="grid grid-cols-2 bg-gray-50 dark:bg-gray-800 rounded-t-2xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("toys")}
              className={`rounded-xl py-3 px-4 text-sm font-medium text-center transition-all min-h-[44px] ${
                activeTab === "toys"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {(user as any).accountType === "official" ? "Example Listings" : "Toys"} ({availableToys.length})
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`rounded-xl py-3 px-4 text-sm font-medium text-center transition-all min-h-[44px] ${
                activeTab === "reviews"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {(user as any).accountType === "official" ? "Community Review Examples" : "Reviews"} ({reviewCount})
            </button>
          </div>

          <div className="p-4">
            {activeTab === "toys" ? (
              <>
                {toysLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl aspect-square animate-pulse" />
                    ))}
                  </div>
                ) : availableToys.length === 0 ? (
                  <EmptyState icon={<span className="text-4xl">🧸</span>} title="No toys available" />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {availableToys.map((toy) => (
                      <div
                        key={toy.id}
                        className="relative cursor-pointer transition-all rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                        onClick={() => window.location.href = `/toy/${toy.id}`}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToySelection(toy.id); }}
                          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-colors ${
                            selectedToys.includes(toy.id)
                              ? 'bg-purple-500'
                              : 'bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600'
                          }`}
                          aria-label={selectedToys.includes(toy.id) ? "Deselect toy" : "Select for exchange"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${selectedToys.includes(toy.id) ? 'text-white fill-current' : 'text-gray-400'}`} />
                        </button>
                        <div className="p-3">
                          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl mb-2 overflow-hidden">
                            {toy.imageUrls?.[0] ? (
                              <img src={toy.imageUrls[0]} alt={toy.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">🧸</div>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1 line-clamp-2">{toy.name}</h3>
                          <div className="flex items-center justify-between gap-1">
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-lg font-medium">{toy.category}</span>
                            <span className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-lg font-medium">{toy.condition}</span>
                          </div>
                          {(toy as any).location && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{formatLocation((toy as any).location)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {userReviews && userReviews.length > 0 ? (
                  <div className="space-y-3">
                    {userReviews.map((review) => (
                      <div key={review.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">{review.reviewer.firstName?.[0] || 'U'}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                            {review.reviewer.firstName || 'Anonymous'}
                          </span>
                          <div className="flex ml-auto">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{review.comment}</p>}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(review.createdAt ?? 0).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<span className="text-4xl">⭐</span>} title="No reviews yet" subtitle="This user hasn't received any reviews yet" />
                )}
              </>
            )}
          </div>
        </SectionCard>
      </div>

      <BottomNav />

      <ReportUserModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedId={user.id}
        reportedName={user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : user.email?.split('@')[0] || 'User'}
        contextType="profile"
      />
    </PageContainer>
  );
}
