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
  Home,
  Search,
  MessageCircle,
  User,
  Plus,
  Trophy,
  Award,
  MessageSquare,
  X,
  Camera,
  Save,
  Navigation,
  Edit3,
  Trash2,
  Loader2
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PageLoadingSkeleton } from "@/components/loading-skeletons";
import BottomNav from "@/components/bottom-nav";
import { apiRequest } from "@/lib/queryClient";
import UploadOverlay from "@/components/upload-overlay";
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
  const [showEditToy, setShowEditToy] = useState<any>(null);
  const [confirmDeleteToyId, setConfirmDeleteToyId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Edit form state
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

  // Initialize form with user data when modal opens
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

  const completedExchanges = Array.isArray(exchanges) ? exchanges.filter((e: any) => e.status === 'completed') : [];
  const userStats = {
    toysShared: Array.isArray(userToys) ? userToys.length : 0,
    toysReceived: completedExchanges.length,
    rating: (userRating as any)?.averageRating || 0,
    reviewCount: Array.isArray(userReviews) ? userReviews.length : 0,
    joinDate: 'March 2024'
  };

  const menuItems = [
    {
      icon: Package,
      title: 'My Toys',
      subtitle: `${userStats.toysShared} active listings`,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      section: 'toys'
    },
    {
      icon: Heart,
      title: 'Favorites',
      subtitle: `${Array.isArray(favorites) ? favorites.length : 0} saved toys`,
      color: 'text-pink-500',
      bgColor: 'bg-pink-100 dark:bg-pink-900',
      href: '/favorites'
    },
    {
      icon: History,
      title: 'Exchange History',
      subtitle: `${userStats.toysReceived} completed exchanges`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      section: 'history'
    },
    {
      icon: Star,
      title: 'Reviews',
      subtitle: `${userStats.rating.toFixed(1)} ⭐ (${userStats.reviewCount} reviews)`,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      section: 'reviews'
    },
    {
      icon: Gift,
      title: 'Rewards',
      subtitle: '150 points earned',
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900',
      section: 'rewards'
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      subtitle: 'Get help with ToyX',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900'
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300'
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
    window.location.href = "/api/logout";
  };

  // Profile update mutation
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
    
    // Handle image upload if a new image is selected
    if (selectedImage) {
      try {
        // Convert image to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedImage);
        });
        
        const base64Image = await base64Promise;
        profileData.profileImageUrl = base64Image;
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Failed to process the image. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    updateProfileMutation.mutate(profileData);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Compress and resize image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set max dimensions
        const maxWidth = 400;
        const maxHeight = 400;
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        setImagePreview(compressedDataUrl);
        
        // Convert back to file for upload
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            setSelectedImage(compressedFile);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    }
  };

  // Location autocomplete functionality
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
          
          // Basic reverse geocoding - determine if in South Africa based on coordinates
          let locationString = '';
          
          // South Africa approximate bounds: lat -35 to -22, lng 16 to 33
          if (latitude >= -35 && latitude <= -22 && longitude >= 16 && longitude <= 33) {
            // Rough estimation for major South African cities
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
            // Default for other locations
            locationString = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          }
          
          handleEditChange('location', locationString);
          
          toast({
            title: "Location Updated",
            description: "Your current location has been detected.",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please enter manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-4 max-w-sm mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Profile</h1>
            <button className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <Settings className="text-gray-600 dark:text-gray-300 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-sm mx-auto">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 mx-4 mt-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl font-bold">
                  {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <Check className="text-white w-3 h-3" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">
                {(user as any)?.firstName || (user as any)?.lastName
                  ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim()
                  : (user as any)?.email || 'User'
                }
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm truncate">@{(user as any)?.firstName?.toLowerCase() || 'user'}_toys</p>
              <div className="flex items-center space-x-1 mt-1">
                <MapPin className="text-purple-500 w-3 h-3" />
                <span className="text-gray-500 dark:text-gray-400 text-sm">{(user as any)?.location || 'Location not set'}</span>
              </div>
            </div>
            <button 
              onClick={() => setShowEditModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200"
            >
              Edit Profile
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{userStats.toysShared}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Shared</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{userStats.toysReceived}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-center space-x-1">
                <span>{userStats.rating.toFixed(1)}</span>
                <Star className="text-yellow-400 w-4 h-4 fill-current" />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">6</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Months</div>
            </div>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="bg-white dark:bg-gray-800 mx-4 mt-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Bell className="text-blue-500 w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">Notifications</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Get notified about new matches</div>
                </div>
              </div>
              <ToggleSwitch 
                enabled={notificationsEnabled} 
                onToggle={() => setNotificationsEnabled(!notificationsEnabled)} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <MapPin className="text-green-500 w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">Location Services</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Find toys near you</div>
                </div>
              </div>
              <ToggleSwitch 
                enabled={locationEnabled} 
                onToggle={() => setLocationEnabled(!locationEnabled)} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  {isDarkMode ? (
                    <Sun className="text-yellow-500 w-5 h-5" />
                  ) : (
                    <Moon className="text-gray-500 w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">Dark Mode</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Switch to dark theme</div>
                </div>
              </div>
              <ToggleSwitch 
                enabled={isDarkMode} 
                onToggle={toggleDarkMode} 
              />
            </div>
          </div>
        </div>

        {/* Menu Items with inline expandable sections */}
        <div className="bg-white dark:bg-gray-800 mx-4 mt-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Account</h3>
          
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <div key={index}>
                {item.href ? (
                  <Link href={item.href}>
                    <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                        <item.icon className={`${item.color} w-5 h-5`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-800 dark:text-white">{item.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.subtitle}</div>
                      </div>
                      <ChevronRight className="text-gray-400 w-4 h-4" />
                    </button>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => handleMenuClick(item)}
                      className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                        <item.icon className={`${item.color} w-5 h-5`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-800 dark:text-white">{item.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.subtitle}</div>
                      </div>
                      <ChevronRight className={`text-gray-400 w-4 h-4 transition-transform ${activeSection === item.section ? 'rotate-90' : ''}`} />
                    </button>
                    {/* Inline expanded content */}
                    {activeSection === item.section && (
                      <div className="ml-2 mr-2 mb-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        {/* Toys section */}
                        {item.section === 'toys' && (
                          <>
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">My Active Listings</h4>
                            {Array.isArray(userToys) && userToys.length > 0 ? (
                              <div className="space-y-2">
                                {userToys.map((toy: any) => (
                                  <div key={toy.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-xl">
                                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden shrink-0">
                                      {toy.imageUrls && toy.imageUrls[0] ? (
                                        <img src={toy.imageUrls[0]} alt={toy.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">🧸</div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-800 dark:text-white truncate text-sm">{toy.name}</h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{toy.category} • {toy.condition}</p>
                                    </div>
                                    <div className="flex items-center space-x-1 shrink-0">
                                      <button onClick={() => setShowEditToy(toy)} className="w-7 h-7 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors">
                                        <Edit3 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                      </button>
                                      <button onClick={() => setConfirmDeleteToyId(toy.id)} className="w-7 h-7 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                                      </button>
                                      <div className={`px-2 py-0.5 rounded-full text-xs ${toy.isAvailable ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}>
                                        {toy.isAvailable ? 'Avail' : 'Unavail'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No toys listed yet</p>
                              </div>
                            )}
                          </>
                        )}
                        {/* History section */}
                        {item.section === 'history' && (
                          <>
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Exchange History</h4>
                            {completedExchanges.length > 0 ? (
                              <div className="space-y-2">
                                {completedExchanges.map((exchange: any) => (
                                  <div key={exchange.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-xl">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-800 dark:text-white">Exchange completed</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(exchange.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No completed exchanges yet</p>
                              </div>
                            )}
                          </>
                        )}
                        {/* Reviews section */}
                        {item.section === 'reviews' && (
                          <>
                            <div className="text-center mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                              <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{userStats.rating.toFixed(1)}</div>
                              <div className="flex justify-center mb-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`w-4 h-4 ${star <= userStats.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                ))}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{userStats.reviewCount} reviews</p>
                            </div>
                            {Array.isArray(userReviews) && userReviews.length > 0 ? (
                              <div className="space-y-2">
                                {userReviews.map((review: any) => (
                                  <div key={review.id} className="p-3 bg-white dark:bg-gray-800 rounded-xl">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                        ))}
                                      </div>
                                      <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {review.comment && <p className="text-xs text-gray-700 dark:text-gray-300">{review.comment}</p>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet</p>
                              </div>
                            )}
                          </>
                        )}
                        {/* Rewards section */}
                        {item.section === 'rewards' && (
                          <>
                            <div className="text-center mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">150</div>
                              <p className="text-xs text-green-700 dark:text-green-300">Total Points Earned</p>
                            </div>
                            <div className="space-y-2">
                              {[
                                { icon: Trophy, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900', title: 'First Exchange', desc: 'Completed your first toy exchange', pts: '+50 pts' },
                                { icon: Award, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900', title: 'Community Member', desc: 'Listed your first toy for sharing', pts: '+25 pts' },
                                { icon: Star, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900', title: 'Five Star Helper', desc: 'Received excellent reviews', pts: '+75 pts' },
                              ].map((badge, i) => (
                                <div key={i} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-xl">
                                  <div className={`w-8 h-8 ${badge.bg} rounded-lg flex items-center justify-center`}>
                                    <badge.icon className={`w-4 h-4 ${badge.color}`} />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{badge.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{badge.desc}</p>
                                  </div>
                                  <span className="text-xs text-green-600 dark:text-green-400">{badge.pts}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="bg-white dark:bg-gray-800 mx-4 mt-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Subscription</h3>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl mb-3">
            <div>
              <div className="font-medium text-gray-800 dark:text-white capitalize">
                {(user as any)?.plan || "free"}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {(user as any)?.subscriptionStatus || "inactive"}
              </div>
            </div>
            {(user as any)?.plan === "free" ? (
              <a
                href="/pricing"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all"
              >
                Upgrade
              </a>
            ) : (
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white dark:bg-gray-800 mx-4 mt-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          <div className="space-y-1">
            <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Shield className="text-orange-500 w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-800 dark:text-white">Privacy & Safety</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Manage your privacy settings</div>
              </div>
              <ChevronRight className="text-gray-400 w-4 h-4" />
            </button>

            <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <FileText className="text-purple-500 w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-800 dark:text-white">Terms & Conditions</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Read our terms of service</div>
              </div>
              <ChevronRight className="text-gray-400 w-4 h-4" />
            </button>

            <button 
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <LogOut className="text-red-500 w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-red-600 dark:text-red-400">Sign Out</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Sign out of your account</div>
              </div>
              <ChevronRight className="text-gray-400 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="text-red-500 w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Sign Out</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Are you sure you want to sign out of your account?</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Profile Photo Section */}
              <div className="text-center">
                <div className="relative inline-block">
                  <Avatar className="w-20 h-20 mx-auto">
                    <AvatarImage src={imagePreview || (user as any)?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl font-bold">
                      {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-image-input"
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                  </label>
                  <input
                    id="profile-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {selectedImage ? `Selected: ${selectedImage.name}` : 'Click camera to upload photo'}
                </p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <Input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => handleEditChange('firstName', e.target.value)}
                    className="w-full"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => handleEditChange('lastName', e.target.value)}
                    className="w-full"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => handleEditChange('bio', e.target.value)}
                  className="w-full"
                  placeholder="Tell other parents about yourself..."
                  rows={3}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      onFocus={() => editForm.location.length > 1 && setShowLocationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 250)}
                      className="w-full pr-10"
                      placeholder="Enter your city, state or address"
                    />
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    
                    {/* Location Suggestions Dropdown */}
                    {showLocationSuggestions && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchingLocation ? (
                          <div className="flex items-center justify-center py-3">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                          </div>
                        ) : locationSuggestions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No locations found</div>
                        ) : (
                          locationSuggestions.map((result, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectLocation(result);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300"
                            >
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span>{result.displayName}</span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    className="px-3"
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Type your location or use current location for better toy matching
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => handleEditChange('phone', e.target.value)}
                  className="w-full"
                  placeholder="Enter phone number (optional)"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {updateProfileMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Toy Overlay */}
      {showEditToy && (
        <UploadOverlay toy={showEditToy} onClose={() => { setShowEditToy(null); queryClient.invalidateQueries({ queryKey: ["/api/users", (user as any)?.id, "toys"] }); }} />
      )}

      {/* Delete Toy Confirmation Modal */}
      {confirmDeleteToyId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-500 w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Delete Listing</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Are you sure you want to delete this toy listing? This action cannot be undone.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmDeleteToyId(null)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteToyMutation.mutate(confirmDeleteToyId)}
                disabled={deleteToyMutation.isPending}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {deleteToyMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelModal && !cancelConfirmed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="text-red-500 w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Cancel Subscription</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Are you sure you want to cancel your Premium subscription? You'll lose access to unlimited listings and exchanges, and be switched back to the Free plan.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Keep Premium
              </button>
              <button
                onClick={async () => {
                  setCancellingSub(true);
                  try {
                    const res = await fetch("/api/billing/paystack/cancel", {
                      method: "POST",
                      credentials: "include",
                    });
                    const data = await res.json();
                    if (data.ok) {
                      setCancellingSub(false);
                      setCancelConfirmed(true);
                    }
                  } catch {
                    setCancellingSub(false);
                    setShowCancelModal(false);
                    toast({ title: "Error", description: "Failed to cancel subscription.", variant: "destructive" });
                  }
                }}
                disabled={cancellingSub}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {cancellingSub ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Success Modal */}
      {cancelConfirmed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-500 w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Subscription Canceled</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Your Premium subscription has been canceled. You've been switched back to the Free plan. You can upgrade again anytime.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Use the shared BottomNav component */}
      <BottomNav />
    </div>
  );
}