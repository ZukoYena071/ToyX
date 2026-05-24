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
import { fileToCompressedDataUrl } from "@/lib/imageCompression";
import { sha256OfFile } from "@/lib/fileHash";
import { insertToySchema } from "@shared/schema";
import type { User } from "@shared/schema";

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
  const { user: rawUser } = useAuth();
  const user = rawUser as User | undefined;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(toy?.imageUrls || []);
  const [imageHashes, setImageHashes] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: toy?.name || "",
    description: toy?.description || "",
    category: toy?.category || "",
    ageGroup: toy?.ageGroup || "",
    condition: toy?.condition || "",
    location: toy?.location || (user as any)?.location || "",
    lookingForCategories: toy?.lookingForCategories || [],
    lookingForDetails: toy?.lookingForDetails || "",
  });
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationResults, setLocationResults] = useState<{ displayName: string; lat: number; lng: number }[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { latitude, longitude, error: locationError, loading: locationLoading, requestLocation } = useGeolocation();
  const [detectedLocation, setDetectedLocation] = useState<string>("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const MAX_IMAGES = 6;

  // Lock body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/toys"] });
      if (user?.id) queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "toys"] });
      const msg = toy ? "Your toy has been updated." : "Your toy is now available for exchange.";
      toast({ title: toy ? "Toy updated!" : "Toy listed successfully!", description: msg });
      if (data?.reward?.awarded) {
        setTimeout(() => toast({ title: "Nice!", description: "You earned +5 points for a quality listing." }), 500);
      } else if (!toy) {
        setTimeout(() => toast({ title: "Tip", description: "Add 2 photos + a 30+ character description to earn +5 points next time." }), 1000);
      }
      onClose();
    },
    onError: (error: any) => {
      const msg = error?.message || "";
      const body = msg.includes("{") ? JSON.parse(msg.substring(msg.indexOf("{"))) : null;
      toast({ title: body?.code === "LIMIT_ACTIVE_LISTINGS" ? "Upgrade Required" : "Error", description: body?.message || (toy ? "Failed to update toy." : "Failed to list toy."), variant: "destructive" });
      if (body?.upgradeUrl) setTimeout(() => window.location.href = body.upgradeUrl, 2000);
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    if (images.length + files.length > MAX_IMAGES) {
      toast({ title: "Too many photos", description: `Maximum ${MAX_IMAGES} photos allowed.`, variant: "destructive" });
      return;
    }
    setCompressing(true);
    const existingHashes = new Set(imageHashes);
    const localSeen = new Set<string>();
    const newUrls: string[] = [];
    const newHashes: string[] = [];
    for (const file of Array.from(files)) {
      const hash = await sha256OfFile(file);
      if (existingHashes.has(hash) || localSeen.has(hash)) {
        toast({ title: "Duplicate image", description: "This photo is already added." });
        continue;
      }
      localSeen.add(hash);
      try {
        const dataUrl = await fileToCompressedDataUrl(file);
        newUrls.push(dataUrl);
        newHashes.push(hash);
      } catch {
        toast({ title: "Photo too large", description: "That photo is too large. Please choose a smaller one.", variant: "destructive" });
      }
    }
    if (newUrls.length) {
      setImages(prev => [...prev, ...newUrls]);
      setImageHashes(prev => [...prev, ...newHashes]);
    }
    setCompressing(false);
    if (event.target) event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageHashes(prev => prev.filter((_, i) => i !== index));
  };

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
      if (images.length < 1) {
        toast({ title: "Photo required", description: "Please add at least 1 photo before listing.", variant: "destructive" });
        return;
      }
      const totalChars = images.reduce((s, u) => s + u.length, 0);
      if (totalChars > 8_000_000) {
        toast({ title: "Photos too large", description: "Too many/too large photos. Please remove one or choose smaller photos.", variant: "destructive" });
        return;
      }
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

  const isFormValid = formData.name && formData.category && formData.ageGroup && formData.condition && formData.location && images.length >= 1;

  return (
    <div className="fixed inset-0 z-[100] h-[100dvh] w-full bg-black/50 flex flex-col">
      <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-900 flex flex-col h-full">
        {/* Header */}
        <div className="bg-purple-500 shrink-0">
          <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mt-3 mb-3" />
          <div className="flex items-center justify-between px-6 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">{toy ? "Edit Toy" : "List a Toy"}</h2>
              <p className="text-sm text-purple-100">{toy ? "Update your toy listing" : "Share your toy with the community"}</p>
            </div>
            <button onClick={onClose} className="min-w-[44px] min-h-[44px] bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors shrink-0">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">
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
                <div className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all" onClick={() => !compressing && fileInputRef.current?.click()}>
                  {compressing ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Compressing...</p>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Add your toy photos</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Tap to choose from gallery</p>
                    </>
                  )}
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
                placeholder="Include condition, missing parts, accessories, and anything parents &amp; kids should know."
                rows={4}
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.description.length}/500</div>
            </div>

            {/* Categories */}
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
                  {formData.category.split(", ").map((c: string) => (
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

            {/* Age Range + Condition — grouped side-by-side */}
            <div>
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
            </div>

            {/* Looking For */}
            <div>
              <label className="block text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
                What would you like in exchange? <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Pick up to 5 categories</p>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => {
                  const selected = (formData.lookingForCategories || []).includes(category);
                  return (
                    <button key={category} onClick={() => {
                      const current = formData.lookingForCategories || [];
                      if (selected) {
                        setFormData({ ...formData, lookingForCategories: current.filter((c: string) => c !== category) });
                      } else if (current.length < 5) {
                        setFormData({ ...formData, lookingForCategories: [...current, category] });
                      }
                    }}
                      className={`p-3 rounded-xl border-2 transition-all text-left relative min-h-[44px] ${
                        selected ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`text-xs font-medium ${selected ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {category}
                      </div>
                      {selected && <Check className="absolute top-2 right-2 w-3 h-3 text-green-500" />}
                    </button>
                  );
                })}
              </div>
              {(formData.lookingForCategories || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {(formData.lookingForCategories || []).map((c: string) => (
                    <Badge key={c} variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                      {c}
                      <button onClick={() => setFormData({ ...formData, lookingForCategories: (formData.lookingForCategories || []).filter((x: string) => x !== c) })} className="ml-1 text-green-400 hover:text-green-600 min-h-[24px] min-w-[24px]">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <textarea
                value={formData.lookingForDetails || ""}
                onChange={(e) => setFormData({ ...formData, lookingForDetails: e.target.value })}
                placeholder="Preferably Lego Star Wars, or any building set."
                className="w-full mt-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all min-h-[44px]"
                rows={2}
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">{(formData.lookingForDetails || "").length}/200</div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">Location <span className="text-xs text-gray-400 font-normal">(Where your toy will be for exchange)</span></label>
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

          {/* Quality reward checklist */}
          {!toy && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Earn +5 points for this listing</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${images.length >= 2 ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
                    {images.length >= 2 && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-xs ${images.length >= 2 ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    Add 2 photos ({Math.min(images.length, 2)}/2)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.description.trim().length >= 30 ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
                    {formData.description.trim().length >= 30 && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-xs ${formData.description.trim().length >= 30 ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    Write 30+ characters ({Math.min(formData.description.trim().length, 30)}/30)
                  </span>
                </div>
              </div>
              {images.length >= 2 && formData.description.trim().length >= 30 ? (
                <p className="text-xs font-medium text-green-600 dark:text-green-400">Ready to earn +5 points!</p>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {images.length < 2 && formData.description.trim().length < 30
                    ? "Add 1 more photo and more description to earn points."
                    : images.length < 2
                    ? "Add 1 more photo to earn points."
                    : "Write more description to earn points."}
                </p>
              )}
            </div>
          )}

          {/* Bottom footer */}
          <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex gap-3">
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
