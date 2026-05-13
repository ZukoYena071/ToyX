import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, X, Trash2, MapPin, Loader2, Navigation, Check, ChevronDown, Search } from "lucide-react";
import { searchLocations } from "@/lib/location";
import { insertToySchema } from "@shared/schema";

interface UploadOverlayProps {
  onClose: () => void;
  toy?: any;
}

const categories = [
  "Building Toys", "Dolls & Plush", "Educational", "Vehicles", "Outdoor Play",
  "Games & Puzzles", "Arts & Crafts", "Musical Toys", "Action Figures",
  "Stuffed Animals", "Electronics", "Sports & Outdoor", "Pretend Play",
  "Sensory Toys", "Books & Learning", "Other"
];

const ageGroups = ["0-2", "3-6", "7-12", "13+"];
const conditions = ["Like New", "Good", "Fair", "Poor"];

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const zaLocations = [
    { name: "Cape Town, Western Cape, South Africa", lat: -33.9249, lng: 18.4241 },
    { name: "Johannesburg, Gauteng, South Africa", lat: -26.2041, lng: 28.0473 },
    { name: "Pretoria, Gauteng, South Africa", lat: -25.7479, lng: 28.2293 },
    { name: "Durban, KwaZulu-Natal, South Africa", lat: -29.8587, lng: 31.0218 },
    { name: "Gqeberha, Eastern Cape, South Africa", lat: -33.9608, lng: 25.6022 },
    { name: "Bloemfontein, Free State, South Africa", lat: -29.0852, lng: 26.1596 },
    { name: "East London, Eastern Cape, South Africa", lat: -33.0153, lng: 27.9116 },
    { name: "Polokwane, Limpopo, South Africa", lat: -23.8962, lng: 29.4486 },
    { name: "Nelspruit, Mpumalanga, South Africa", lat: -25.4745, lng: 30.9703 },
    { name: "Kimberley, Northern Cape, South Africa", lat: -28.7282, lng: 24.7499 },
    { name: "Rustenburg, North West, South Africa", lat: -25.6676, lng: 27.2421 },
    { name: "Pietermaritzburg, KwaZulu-Natal, South Africa", lat: -29.6006, lng: 30.3794 },
  ];
  let closest = zaLocations[0];
  let minDist = Infinity;
  for (const loc of zaLocations) {
    const d = Math.sqrt((lat - loc.lat) ** 2 + (lng - loc.lng) ** 2);
    if (d < minDist) { minDist = d; closest = loc; }
  }
  return closest.name;
}

export default function UploadOverlay({ onClose, toy }: UploadOverlayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(toy?.imageUrls || []);
  const [formData, setFormData] = useState({
    name: toy?.name || "",
    description: toy?.description || "",
    category: toy?.category || "",
    ageGroup: toy?.ageGroup || "",
    condition: toy?.condition || "",
    location: toy?.location || "",
  });
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationResults, setLocationResults] = useState<{ displayName: string; lat: number; lng: number }[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { latitude, longitude, error: locationError, loading: locationLoading, requestLocation } = useGeolocation();
  const [detectedLocation, setDetectedLocation] = useState<string>("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      setIsDetectingLocation(true);
      setSelectedCoords({ lat: latitude, lng: longitude });
      reverseGeocode(latitude, longitude).then(location => {
        setDetectedLocation(location);
        setFormData(prev => {
          if (!prev.location) return { ...prev, location };
          return prev;
        });
        setIsDetectingLocation(false);
      });
    }
  }, [latitude, longitude]);

  const createToyMutation = useMutation({
    mutationFn: async (toyData: any) => {
      if (toy) return await apiRequest("PATCH", `/api/toys/${toy.id}`, toyData);
      return await apiRequest("POST", "/api/toys", toyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/toys"] });
      if (user?.id) queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "toys"] });
      toast({ title: toy ? "Toy updated!" : "Toy listed successfully!", description: toy ? "Your toy has been updated." : "Your toy is now available for exchange." });
      onClose();
    },
    onError: (error: any) => {
      const msg = error?.message || "";
      const body = msg.includes("{") ? JSON.parse(msg.substring(msg.indexOf("{"))) : null;
      toast({ title: body?.code === "LIMIT_ACTIVE_LISTINGS" ? "Upgrade Required" : "Error", description: body?.message || (toy ? "Failed to update toy." : "Failed to list toy."), variant: "destructive" });
      if (body?.upgradeUrl) setTimeout(() => window.location.href = body.upgradeUrl, 2000);
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => { const result = e.target?.result as string; setImages(prev => [...prev, result]); };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const toggleCategory = (cat: string) => {
    const current = formData.category ? formData.category.split(", ") : [];
    const idx = current.indexOf(cat);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(cat);
    setFormData(prev => ({ ...prev, category: current.join(", ") }));
  };

  const toggleAgeGroup = (age: string) => {
    const current = formData.ageGroup ? formData.ageGroup.split(", ") : [];
    const idx = current.indexOf(age);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(age);
    setFormData(prev => ({ ...prev, ageGroup: current.join(", ") }));
  };

  useEffect(() => {
    if (formData.location.length > 1) {
      if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
      locationDebounceRef.current = setTimeout(async () => {
        setSearchingLocation(true);
        const results = await searchLocations(formData.location);
        setLocationResults(results);
        setSearchingLocation(false);
        setShowLocationSuggestions(results.length > 0);
      }, 300);
    } else {
      setLocationResults([]);
      setShowLocationSuggestions(false);
    }
    return () => { if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current); };
  }, [formData.location]);

  const handleSubmit = () => {
    const coords = selectedCoords || (latitude && longitude ? { lat: latitude, lng: longitude } : { lat: null, lng: null });
    if (toy) {
      createToyMutation.mutate({ ...formData, imageUrls: images, latitude: coords.lat, longitude: coords.lng });
    } else {
      try {
        const toyData = insertToySchema.parse({ ...formData, ownerId: user?.id || "", imageUrls: images, latitude: coords.lat, longitude: coords.lng });
        createToyMutation.mutate(toyData);
      } catch (error) {
        toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      }
    }
  };

  const handleUseDetectedLocation = () => {
    if (detectedLocation) {
      setFormData(prev => ({ ...prev, location: detectedLocation }));
      if (latitude && longitude) setSelectedCoords({ lat: latitude, lng: longitude });
    }
  };

  const isFormValid = formData.name && formData.category && formData.ageGroup && formData.condition;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-t-2xl shadow-lg animate-slide-up">
        {/* Header */}
        <div className="bg-purple-500 rounded-t-2xl p-6">
          <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">{toy ? "Edit Toy" : "List a Toy"}</h2>
              <p className="text-sm text-purple-100">{toy ? "Update your toy listing" : "Share your toy with the community"}</p>
            </div>
            <button onClick={onClose} className="min-w-[44px] min-h-[44px] bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-5 mb-6 max-h-96 overflow-y-auto">
            {/* Photo Upload */}
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />

            <div>
              <label className="block text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">
                Add Photos <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Add up to 5 photos. The first photo will be your main image.</p>

              {images.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                        <img src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(index)} className="absolute top-2 right-2 min-w-[44px] min-h-[44px] bg-red-500 rounded-xl flex items-center justify-center hover:bg-red-600 transition-colors">
                          <X className="w-4 h-4 text-white" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">Main</div>
                        )}
                      </div>
                    ))}
                    {images.length < 5 && (
                      <div className="aspect-square border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="w-6 h-6 text-purple-400 mb-2" />
                        <span className="text-xs text-purple-600 dark:text-purple-400 text-center px-2">Tap to add</span>
                      </div>
                    )}
                  </div>
                  {images.length < 5 && (
                    <button onClick={() => fileInputRef.current?.click()} className="w-full p-3 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl text-purple-600 dark:text-purple-400 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all min-h-[44px]">
                      <Camera className="w-4 h-4 inline mr-2" />
                      Add more photos
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Add your toy photos</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Tap to choose from gallery</p>
                </div>
              )}
            </div>

            {/* Toy Name */}
            <div>
              <label className="block text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">
                Toy Title <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., LEGO Creator 3-in-1 Deep Sea Creatures"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your toy's condition, what's included, and why kids would love it..."
                rows={4}
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.description.length}/500</div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">
                Categories <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Select one or more categories</p>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => {
                  const selected = formData.category.split(", ").includes(category);
                  return (
                    <button key={category} onClick={() => toggleCategory(category)}
                      className={`p-4 rounded-xl border-2 transition-all text-left relative min-h-[44px] ${
                        selected ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`text-sm font-medium ${selected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {category}
                      </div>
                      {selected && <Check className="absolute top-2 right-2 w-4 h-4 text-purple-500" />}
                    </button>
                  );
                })}
              </div>
              {formData.category && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.category.split(", ").map(c => (
                    <Badge key={c} variant="secondary" className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                      {c}
                      <button onClick={() => toggleCategory(c)} className="ml-1 text-purple-400 hover:text-purple-600 min-h-[24px] min-w-[24px]">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Age Group and Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">Age Range</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select one or more</p>
                <div className="space-y-2">
                  {ageGroups.map((age) => {
                    const selected = formData.ageGroup.split(", ").includes(age);
                    return (
                      <button key={age} onClick={() => toggleAgeGroup(age)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all relative min-h-[44px] ${
                          selected ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className={`text-sm font-medium ${selected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          Ages {age}
                        </div>
                        {selected && <Check className="absolute top-2 right-2 w-4 h-4 text-purple-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">
                  Condition <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {conditions.map((condition) => (
                    <button key={condition} onClick={() => setFormData({ ...formData, condition })}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all min-h-[44px] ${
                        formData.condition === condition ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`text-sm font-medium ${formData.condition === condition ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {condition}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">Location</label>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    ref={locationInputRef}
                    type="text"
                    placeholder="Search for a city or suburb..."
                    value={formData.location}
                    onChange={(e) => { setFormData((prev: any) => ({ ...prev, location: e.target.value })); setShowLocationSuggestions(e.target.value.length > 1); }}
                    onFocus={() => { if (formData.location.length > 1) setShowLocationSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 250)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => requestLocation()}
                    disabled={locationLoading || isDetectingLocation}
                    className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-purple-500 hover:text-purple-600"
                    title="Detect my location"
                  >
                    {locationLoading || isDetectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  </button>

                  {showLocationSuggestions && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm max-h-48 overflow-y-auto">
                      {searchingLocation ? (
                        <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>
                      ) : locationResults.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No locations found</div>
                      ) : (
                        locationResults.map((result, idx) => (
                          <button key={idx} type="button"
                            onMouseDown={(e) => { e.preventDefault(); setFormData((prev: any) => ({ ...prev, location: result.displayName })); setSelectedCoords({ lat: result.lat, lng: result.lng }); setShowLocationSuggestions(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 min-h-[44px]"
                          >
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{result.displayName}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {detectedLocation && detectedLocation !== formData.location && (
                  <button type="button" onClick={handleUseDetectedLocation}
                    className="w-full p-3 border border-purple-200 dark:border-purple-800 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors min-h-[44px]"
                  >
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Use detected: {detectedLocation}
                  </button>
                )}

                {locationError && <p className="text-xs text-red-500">{locationError}</p>}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button onClick={onClose} className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px]">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={!isFormValid || createToyMutation.isPending}
              className="flex-1 py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {createToyMutation.isPending ? "Saving..." : toy ? "Save Changes" : "List Toy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
