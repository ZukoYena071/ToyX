import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useTheme } from "@/components/ui/theme-provider";
import {
  Settings,
  LogOut,
  Heart,
  Package,
  Star,
  MapPin,
  Bell,
  Moon,
  Sun,
  Shield,
  FileText,
  HelpCircle,
  Gift,
  History,
  ChevronRight,
  Check,
  X,
  Camera,
  Save,
  Navigation,
  Edit3,
  Trash2,
  Loader2,
  MoreHorizontal
} from "lucide-react";
import ProfileBadges from "@/components/profile/ProfileBadges";
import FeaturedBadge from "@/components/profile/FeaturedBadge";
import AchievementCard from "@/components/profile/AchievementCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PageLoadingSkeleton } from "@/components/loading-skeletons";
import BottomNav from "@/components/bottom-nav";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import ListItemRow from "@/components/ui/ListItemRow";
import StatCard from "@/components/ui/StatCard";
import { apiRequest, clearWasAuthenticated } from "@/lib/queryClient";
import UploadOverlay from "@/components/upload-overlay";
import BoostButton from "@/components/toys/BoostButton";
import { searchLocations } from "@/lib/location";

export default function Profile() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Lock body scroll when edit modal is open
  useEffect(() => {
    if (showEditModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showEditModal]);
  const [showEditToy, setShowEditToy] = useState<any>(null);
  const [confirmDeleteToyId, setConfirmDeleteToyId] = useState<number | null>(null);
  const [showToyMenu, setShowToyMenu] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    phone: '',
    profileImageUrl: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<{ displayName: string; lat: number; lng: number }[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (showEditModal && user) {
      setEditForm({
        firstName: (user as any)?.firstName || '',
        lastName: (user as any)?.lastName || '',
        bio: (user as any)?.bio || '',
        location: (user as any)?.location || 'San Francisco, CA',
        phone: (user as any)?.phone || '',
        profileImageUrl: (user as any)?.profileImageUrl || ''
      });
      setImagePreview((user as any)?.profileImageUrl || null);
      setSelectedImage(null);
    }
  }, [showEditModal, user]);

  const isDarkMode = theme === 'dark';

  const toggleDarkMode = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const toggleLocation = () => {
    const newVal = !locationEnabled;
    setLocationEnabled(newVal);
    if (!newVal) {
      fetch("/api/users/location", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: false }), credentials: "include" }).catch(() => {});
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetch("/api/users/location", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: true, latitude: pos.coords.latitude, longitude: pos.coords.longitude }), credentials: "include" }).catch(() => {});
        },
        () => {
          setLocationEnabled(false);
          toast({ title: "Location Error", description: "Couldn't access location. Check browser permissions.", variant: "destructive" });
        }
      );
    }
  };

  const { data: userToys } = useQuery({
    queryKey: ["/api/users", (user as any)?.id, "toys"],
    enabled: !!user,
  });

  const { data: exchanges } = useQuery({
    queryKey: ["/api/exchanges"],
    enabled: !!user,
  });

  const { data: userRating } = useQuery({
    queryKey: ["/api/users", (user as any)?.id, "rating"],
    enabled: !!user,
  });

  const { data: favorites } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  const { data: userReviews } = useQuery({
    queryKey: ["/api/users", (user as any)?.id, "reviews"],
    enabled: !!user,
  });

  const { data: rewardsData } = useQuery({
    queryKey: ["/api/rewards/me"],
    enabled: !!user,
  });

  const completedExchanges = Array.isArray(exchanges) ? exchanges.filter((e: any) => e.status === 'completed') : [];
  const activeExchanges = Array.isArray(exchanges) ? exchanges.filter((e: any) => e.status === 'pending' || e.status === 'accepted') : [];

  const getToyExchangeStatus = (toyId: number) => {
    const ex = activeExchanges.find((e: any) => e.toyId === toyId);
    return ex ? ex.status : null;
  };

  const userStats = {
    toysShared: Array.isArray(userToys) ? userToys.length : 0,
    toysReceived: completedExchanges.length,
    rating: (userRating as any)?.averageRating || 0,
    reviewCount: Array.isArray(userReviews) ? userReviews.length : 0,
    joinDate: (user as any)?.createdAt
      ? new Date((user as any).createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Unknown'
  };

  const activityItems = [
    {
      icon: Package,
      title: 'My Toys',
      subtitle: `${userStats.toysShared} listings`,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-50 dark:bg-purple-900/30',
      section: 'toys'
    },
    {
      icon: History,
      title: 'Exchanges',
      subtitle: `${userStats.toysReceived} completed exchanges`,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50 dark:bg-blue-900/30',
      section: 'history'
    },
    {
      icon: Heart,
      title: 'Favorites',
      subtitle: `${Array.isArray(favorites) ? favorites.length : 0} saved toys`,
      iconColor: 'text-pink-500',
      iconBg: 'bg-pink-50 dark:bg-pink-900/30',
      href: '/favorites'
    },
    {
      icon: Star,
      title: 'Reviews',
      subtitle: `${userStats.rating.toFixed(1)} ⭐ (${userStats.reviewCount} reviews)`,
      iconColor: 'text-yellow-500',
      iconBg: 'bg-yellow-50 dark:bg-yellow-900/30',
      section: 'reviews'
    }
  ];

  const handleMenuClick = (item: any) => {
    if (item.href) {
      window.location.href = item.href;
    } else if (item.section) {
      setActiveSection(activeSection === item.section ? null : item.section);
    }
  };

  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors min-h-[44px] min-w-[44px] ${
        enabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const handleLogout = () => {
    clearWasAuthenticated();
    window.location.href = "/api/logout";
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return await apiRequest('PATCH', '/api/users/profile', profileData);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteToyMutation = useMutation({
    mutationFn: async (toyId: number) => {
      return await apiRequest('DELETE', `/api/toys/${toyId}`);
    },
    onSuccess: () => {
      toast({ title: "Toy Deleted", description: "Your toy listing has been removed." });
      setConfirmDeleteToyId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users", (user as any)?.id, "toys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/toys"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete toy.", variant: "destructive" });
    },
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let profileData = { ...editForm };
    if (selectedImage) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedImage);
        });
        const base64Image = await base64Promise;
        profileData.profileImageUrl = base64Image;
      } catch (error) {
        toast({ title: "Upload Failed", description: "Failed to process the image. Please try again.", variant: "destructive" });
        return;
      }
    }
    updateProfileMutation.mutate(profileData);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Please select an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        const maxWidth = 400;
        const maxHeight = 400;
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width = (width * maxHeight) / height; height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImagePreview(compressedDataUrl);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
            setSelectedImage(compressedFile);
          }
        }, 'image/jpeg', 0.8);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleLocationChange = async (value: string) => {
    handleEditChange('location', value);
    if (value.length > 1) {
      if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
      locationDebounceRef.current = setTimeout(async () => {
        setSearchingLocation(true);
        const results = await searchLocations(value);
        setLocationSuggestions(results);
        setSearchingLocation(false);
        setShowLocationSuggestions(results.length > 0);
      }, 300);
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  };

  const selectLocation = (loc: { displayName: string; lat: number; lng: number }) => {
    handleEditChange('location', loc.displayName);
    setShowLocationSuggestions(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let locationString = '';
          if (latitude >= -35 && latitude <= -22 && longitude >= 16 && longitude <= 33) {
            if (latitude >= -26.3 && latitude <= -26.0 && longitude >= 27.8 && longitude <= 28.3) {
              locationString = 'Johannesburg, Gauteng, South Africa';
            } else if (latitude >= -34.0 && latitude <= -33.7 && longitude >= 18.3 && longitude <= 18.7) {
              locationString = 'Cape Town, Western Cape, South Africa';
            } else if (latitude >= -29.9 && latitude <= -29.7 && longitude >= 30.8 && longitude <= 31.1) {
              locationString = 'Durban, KwaZulu-Natal, South Africa';
            } else if (latitude >= -25.8 && latitude <= -25.6 && longitude >= 28.1 && longitude <= 28.3) {
              locationString = 'Pretoria, Gauteng, South Africa';
            } else {
              locationString = `South Africa (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            }
          } else {
            locationString = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          }
          handleEditChange('location', locationString);
          toast({ title: "Location Updated", description: "Your current location has been detected." });
        },
        () => {
          toast({ title: "Location Error", description: "Unable to get your location. Please enter manually.", variant: "destructive" });
        }
      );
    } else {
      toast({ title: "Not Supported", description: "Geolocation is not supported by your browser.", variant: "destructive" });
    }
  };

  if (!user) {
    return <PageLoadingSkeleton />;
  }

  const renderIcon = (item: any) => (
    <div className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center`}>
      <item.icon className={`${item.iconColor} w-5 h-5`} />
    </div>
  );

  return (
    <PageContainer className="pb-24">
      <PageHeader title="Profile" />

      {/* Profile Card */}
      <div className="px-4 mt-4">
        <SectionCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-purple-500 text-white text-2xl font-bold">
                  {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                <Check className="text-white w-3 h-3" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 truncate flex items-center gap-0.5">
                {(user as any)?.firstName || (user as any)?.lastName
                  ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim()
                  : (user as any)?.email || 'User'
                }
                {rewardsData && (rewardsData as any).badges?.length > 0 && (
                  <FeaturedBadge
                    type={(rewardsData as any).badges[0].type}
                    memberNumber={(rewardsData as any).foundingMember?.memberNumber}
                    awardedAt={(rewardsData as any).badges[0].awardedAt}
                  />
                )}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{(user as any)?.firstName?.toLowerCase() || 'user'}_toys</p>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="text-purple-500 w-3 h-3" />
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{(user as any)?.location || 'Location not set'}</span>
              </div>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px]"
            >
              Edit Profile
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">{userStats.toysShared}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Shared</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">{userStats.toysReceived}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Received</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-1">
                {userStats.rating.toFixed(1)}
                <Star className="text-yellow-400 w-4 h-4 fill-current" />
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Rating</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {(user as any)?.createdAt
                  ? Math.max(1, Math.floor((Date.now() - new Date((user as any).createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)))
                  : 0}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Months</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Achievements Section */}
      {rewardsData && (rewardsData as any).badges?.length > 0 && (
        <div className="px-4 mt-4">
          <SectionCard>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">🏅 Achievements</h3>
            <div className="grid gap-3">
              {(rewardsData as any).badges.map((badge: any) => (
                <AchievementCard key={badge.type} badge={badge} memberNumber={(rewardsData as any).foundingMember?.memberNumber} />
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Subscription Section */}
      <div className="px-4 mt-4">
        <SectionCard>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">Subscription</h3>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-3">
            {(() => {
              const premiumPassEnd = (user as any)?.premiumPassUntil ? new Date((user as any).premiumPassUntil) : null;
              const hasPremiumPass = premiumPassEnd && premiumPassEnd > new Date();
              const isPaidPremium = (user as any)?.plan !== "free";

              if (hasPremiumPass || isPaidPremium) {
                return (
                  <>
                    <div>
                      <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {isPaidPremium ? "Premium" : "✨ Premium Pass"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {isPaidPremium
                          ? `Valid until ${new Date((user as any).currentPeriodEnd).toLocaleDateString()}`
                          : `Valid until ${premiumPassEnd!.toLocaleDateString()}`
                        }
                      </div>
                    </div>
                    {isPaidPremium ? (
                      <button onClick={() => setShowCancelModal(true)}
                        className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors min-h-[44px]">
                        Cancel
                      </button>
                    ) : (
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center">
                        Active
                      </span>
                    )}
                  </>
                );
              }

              return (
                <>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-50 capitalize">Free</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">No active subscription</div>
                  </div>
                  <a href="/pricing"
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] inline-flex items-center">
                    Upgrade
                  </a>
                </>
              );
            })()}
          </div>
        </SectionCard>
      </div>

      {/* My Activity */}
      <div className="px-4 mt-4">
        <SectionCard>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">My Activity</h3>
          <div className="space-y-1">
            {activityItems.map((item, index) => (
              <div key={index}>
                {item.href ? (
                  <Link href={item.href}>
                    <ListItemRow
                      icon={renderIcon(item)}
                      title={item.title}
                      subtitle={item.subtitle}
                    />
                  </Link>
                ) : (
                  <>
                    <ListItemRow
                      icon={renderIcon(item)}
                      title={item.title}
                      subtitle={item.subtitle}
                      onClick={() => handleMenuClick(item)}
                      right={
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${activeSection === item.section ? 'rotate-90' : ''}`} />
                      }
                    />
                    {activeSection === item.section && (
                      <div className="ml-12 mr-2 mb-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        {/* Toys section */}
                        {item.section === 'toys' && (
                          <>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">My Listings</h4>
                            {Array.isArray(userToys) && userToys.length > 0 ? (
                              <div className="space-y-2">
                                {userToys.map((toy: any) => (
                                  <div key={toy.id} className={'flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl' + (toy.isAvailable === false ? ' opacity-60' : '')}>
                                    <div className={'w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0' + (toy.isAvailable === false ? ' grayscale' : '')}>
                                      {toy.imageUrls && toy.imageUrls[0] ? (
                                        <img src={toy.imageUrls[0]} alt={toy.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">🧸</div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{toy.name}</h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{toy.category} • {toy.condition}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <BoostButton toyId={toy.id} isBoosted={toy.isBoosted} boostedUntil={toy.boostedUntil} disabled={toy.isAvailable === false} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ["/api/users", (user as any)?.id, "toys"] }); queryClient.invalidateQueries({ queryKey: ["/api/toys"] }); }} />
                                      <div className="relative">
                                        <button onClick={() => setShowToyMenu(showToyMenu === toy.id ? null : toy.id)} className="min-w-[44px] min-h-[44px] bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                        </button>
                                        {showToyMenu === toy.id && (
                                          <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowToyMenu(null)} />
                                            <div className="absolute right-0 top-10 z-50 w-44 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                                              <button onClick={() => { setShowToyMenu(null); setShowEditToy(toy); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px]">
                                                <Edit3 className="w-4 h-4 text-purple-500" />
                                                Edit
                                              </button>
                                              <button onClick={() => { setShowToyMenu(null); setConfirmDeleteToyId(toy.id); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[44px]">
                                                <Trash2 className="w-4 h-4" />
                                                Manage
                                              </button>
                                              <div className="border-t border-gray-100 dark:border-gray-800" />
                                              <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                                                {(() => {
                                                  const exStatus = getToyExchangeStatus(toy.id);
                                                  if (exStatus) return 'In Exchange';
                                                  return toy.isAvailable ? 'Available' : 'Unavailable';
                                                })()}
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">No toys listed yet</p>
                              </div>
                            )}
                          </>
                        )}
                        {/* History section */}
                        {item.section === 'history' && (
                          <>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">Exchange History</h4>
                            {completedExchanges.length > 0 ? (
                              <div className="space-y-2">
                                {completedExchanges.map((exchange: any) => (
                                  <div key={exchange.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl">
                                    <div className="w-8 h-8 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Exchange completed</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(exchange.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">No completed exchanges yet</p>
                              </div>
                            )}
                          </>
                        )}
                        {/* Reviews section */}
                        {item.section === 'reviews' && (
                          <>
                            <div className="text-center mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                              <div className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">{userStats.rating.toFixed(1)}</div>
                              <div className="flex justify-center gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`w-4 h-4 ${star <= userStats.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                ))}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{userStats.reviewCount} reviews</p>
                            </div>
                            {Array.isArray(userReviews) && userReviews.length > 0 ? (
                              <div className="space-y-2">
                                {userReviews.map((review: any) => (
                                  <div key={review.id} className="p-3 bg-white dark:bg-gray-900 rounded-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                        ))}
                                      </div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {review.comment && <p className="text-xs text-gray-700 dark:text-gray-300">{review.comment}</p>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">No reviews yet</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Privacy & Safety */}
      <div className="px-4 mt-4">
        <SectionCard>
          <div className="space-y-1">
            <Link href="/privacy-safety">
              <ListItemRow
                icon={<div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center"><Shield className="text-orange-500 w-5 h-5" /></div>}
                title="Privacy & Safety"
                subtitle="Manage your privacy settings"
              />
            </Link>
            {(user as any)?.isAdmin && (
              <Link href="/admin/moderation">
                <ListItemRow
                  icon={<div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center"><Shield className="text-red-500 w-5 h-5" /></div>}
                  title="Admin Moderation"
                  subtitle="Manage user reports"
                />
              </Link>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Quick Settings */}
      <div className="px-4 mt-4">
        <SectionCard>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">Quick Settings</h3>
          <div className="space-y-1">
            <ListItemRow
              icon={<div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><Bell className="text-blue-500 w-5 h-5" /></div>}
              title="Notifications"
              subtitle="Get notified about new matches"
              right={<ToggleSwitch enabled={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} />}
            />
            <ListItemRow
              icon={<div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center"><MapPin className="text-green-500 w-5 h-5" /></div>}
              title="Location Services"
              subtitle="Find toys near you"
              right={<ToggleSwitch enabled={locationEnabled} onToggle={toggleLocation} />}
            />
            <ListItemRow
              icon={
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  {isDarkMode ? <Sun className="text-yellow-500 w-5 h-5" /> : <Moon className="text-gray-500 w-5 h-5" />}
                </div>
              }
              title="Dark Mode"
              subtitle="Switch to dark theme"
              right={<ToggleSwitch enabled={isDarkMode} onToggle={toggleDarkMode} />}
            />
          </div>
        </SectionCard>
      </div>

      {/* Rewards & Referrals */}
      <div className="px-4 mt-4">
        <SectionCard>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">Rewards & Referrals</h3>
          <div className="space-y-1">
            <Link href="/rewards">
              <ListItemRow
                icon={<div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center"><Gift className="text-green-500 w-5 h-5" /></div>}
                title="Rewards"
                subtitle="Earn & spend points"
              />
            </Link>
            <Link href="/invite">
              <ListItemRow
                icon={<div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/30 rounded-xl flex items-center justify-center"><Gift className="text-pink-500 w-5 h-5" /></div>}
                title="Invite Friends"
                subtitle="Earn 200 pts + Premium Pass"
              />
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* Support + Legal + Exit */}
      <div className="px-4 mt-4 mb-6">
        <SectionCard>
          <div className="space-y-1">
            <Link href="/terms">
              <ListItemRow
                icon={<div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"><FileText className="text-purple-500 w-5 h-5" /></div>}
                title="Terms & Conditions"
                subtitle="Read our terms of service"
              />
            </Link>
            <Link href="/privacy-policy">
              <ListItemRow
                icon={<div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><FileText className="text-blue-500 w-5 h-5" /></div>}
                title="Privacy Policy"
                subtitle="How we handle your data"
              />
            </Link>
            <ListItemRow
              icon={<div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center"><LogOut className="text-red-500 w-5 h-5" /></div>}
              title="Sign Out"
              subtitle="Sign out of your account"
              onClick={() => setShowLogoutModal(true)}
              className="hover:bg-red-50 dark:hover:bg-red-900/20"
            />
          </div>
        </SectionCard>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SectionCard className="p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="text-red-500 w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Sign Out</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors min-h-[44px]"
              >
                Sign Out
              </button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Dev: reset onboarding */}
      {import.meta.env.DEV && (
        <div className="px-4 mt-2 mb-6">
          <button
            onClick={async () => {
              await fetch("/api/dev/reset-onboarding", { method: "POST", credentials: "include" });
              window.location.href = "/";
            }}
            className="w-full text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-2 transition-colors"
          >
            Reset onboarding (dev)
          </button>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-end sm:justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-lg w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] overflow-y-auto mt-auto sm:mt-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px]"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <form id="edit-profile-form" onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div className="text-center">
                <div className="relative inline-block">
                  <Avatar className="w-20 h-20 mx-auto">
                    <AvatarImage src={imagePreview || (user as any)?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-purple-500 text-white text-2xl font-bold">
                      {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-image-input"
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                  </label>
                  <input id="profile-image-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {selectedImage ? `Selected: ${selectedImage.name}` : 'Click camera to upload photo'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                  <Input type="text" value={editForm.firstName} onChange={(e) => handleEditChange('firstName', e.target.value)} placeholder="Enter first name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                  <Input type="text" value={editForm.lastName} onChange={(e) => handleEditChange('lastName', e.target.value)} placeholder="Enter last name" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                <Textarea value={editForm.bio} onChange={(e) => handleEditChange('bio', e.target.value)} placeholder="Tell other parents about yourself..." rows={3} />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      onFocus={() => editForm.location.length > 1 && setShowLocationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 250)}
                      className="pr-10"
                      placeholder="Enter your city, state or address"
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    {showLocationSuggestions && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm max-h-48 overflow-y-auto">
                        {searchingLocation ? (
                          <div className="flex items-center justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-purple-500" /></div>
                        ) : locationSuggestions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No locations found</div>
                        ) : (
                          locationSuggestions.map((result, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); selectLocation(result); }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                            >
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span>{result.displayName}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation} className="px-3">
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Type your location or use current location for better toy matching</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                <Input type="tel" value={editForm.phone} onChange={(e) => handleEditChange('phone', e.target.value)} placeholder="Enter phone number (optional)" />
              </div>

            </form>
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={updateProfileMutation.isPending} className="flex-1" form="edit-profile-form">
                  {updateProfileMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2"><Save className="w-4 h-4" />Save Changes</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Toy Overlay */}
      {showEditToy && (
        <UploadOverlay toy={showEditToy} onClose={() => { setShowEditToy(null); queryClient.invalidateQueries({ queryKey: ["/api/users", (user as any)?.id, "toys"] }); }} />
      )}

      {/* Manage Listing Modal */}
      {confirmDeleteToyId && (() => {
        const toysList: any[] = Array.isArray(userToys) ? userToys : [];
        const toy = toysList.find((t: any) => t.id === confirmDeleteToyId);
        if (!toy) return null;
        return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SectionCard className="p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-gray-500 w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-1">{toy.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{toy.isAvailable ? 'Available' : 'Unavailable'}</p>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  const action = toy.isAvailable ? 'unlist' : 'relist';
                  await fetch(`/api/toys/${confirmDeleteToyId}/${action}`, { method: "POST", credentials: "include" });
                  queryClient.invalidateQueries({ queryKey: ["/api/users", (user as any)?.id, "toys"] });
                  setConfirmDeleteToyId(null);
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium transition-colors min-h-[44px]"
              >
                {toy.isAvailable ? 'Unlist (Make Unavailable)' : 'Relist (Make Available)'}
              </button>
              <button
                onClick={async () => {
                  await fetch(`/api/toys/${confirmDeleteToyId}/archive`, { method: "POST", credentials: "include" });
                  queryClient.invalidateQueries({ queryKey: ["/api/users", (user as any)?.id, "toys"] });
                  setConfirmDeleteToyId(null);
                }}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
              >
                Archive (Remove from listings)
              </button>
              {toy.canDeletePermanently && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/toys/${confirmDeleteToyId}`, { method: "DELETE", credentials: "include" });
                      if (res.ok || res.status === 204) {
                        queryClient.invalidateQueries({ queryKey: ["/api/users", (user as any)?.id, "toys"] });
                        setConfirmDeleteToyId(null);
                      } else {
                        const data = await res.json().catch(() => ({}));
                        alert(data.message || "Failed to delete");
                      }
                    } catch { alert("Failed to delete"); }
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors min-h-[44px]"
                >
                  Delete Permanently
                </button>
              )}
            </div>
            <button onClick={() => setConfirmDeleteToyId(null)} className="mt-3 text-sm text-gray-500 dark:text-gray-400 underline min-h-[44px]">Cancel</button>
          </SectionCard>
        </div>
        );
      })()}

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelModal && !cancelConfirmed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SectionCard className="p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="text-red-500 w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Cancel Subscription</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to cancel your Premium subscription? You'll lose access to unlimited listings and exchanges, and be switched back to the Free plan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[44px]">Keep Premium</button>
              <button
                onClick={async () => {
                  setCancellingSub(true);
                  try {
                    const res = await fetch("/api/billing/paystack/cancel", { method: "POST", credentials: "include" });
                    const data = await res.json();
                    if (data.ok) { setCancellingSub(false); setCancelConfirmed(true); }
                  } catch {
                    setCancellingSub(false);
                    setShowCancelModal(false);
                    toast({ title: "Error", description: "Failed to cancel subscription.", variant: "destructive" });
                  }
                }}
                disabled={cancellingSub}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {cancellingSub ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Cancel Success Modal */}
      {cancelConfirmed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SectionCard className="p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-500 w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Subscription Canceled</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Your Premium subscription has been canceled. You've been switched back to the Free plan. You can upgrade again anytime.
            </p>
            <button onClick={() => window.location.reload()} className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium transition-colors min-h-[44px]">Done</button>
          </SectionCard>
        </div>
      )}

      {import.meta.env.VITE_ENABLE_SENTRY_DEBUG === "true" && (
        <button
          onClick={() => { throw new Error("ToyX frontend verification"); }}
          className="mx-auto mt-2 block text-[10px] text-gray-300 dark:text-gray-600 hover:text-gray-500 min-h-[24px]"
        >
          [Debug: trigger Sentry error]
        </button>
      )}
      <BottomNav />
    </PageContainer>
  );
}
