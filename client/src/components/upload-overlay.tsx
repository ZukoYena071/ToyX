import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation, reverseGeocode } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Trash2, MapPin, Loader2 } from "lucide-react";
import { insertToySchema } from "@shared/schema";

interface UploadOverlayProps {
  onClose: () => void;
}

const categories = [
  "Building Toys", "Dolls & Plush", "Educational", "Vehicles", "Outdoor Play", "Games & Puzzles"
];

const ageGroups = ["0-2", "3-6", "7-12", "13+"];
const conditions = ["Like New", "Good", "Fair", "Poor"];

export default function UploadOverlay({ onClose }: UploadOverlayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    ageGroup: "",
    condition: "",
    location: "",
  });
  
  const { latitude, longitude, error: locationError, loading: locationLoading, requestLocation } = useGeolocation();
  const [detectedLocation, setDetectedLocation] = useState<string>("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      setIsDetectingLocation(true);
      reverseGeocode(latitude, longitude).then(location => {
        setDetectedLocation(location);
        if (!formData.location) {
          setFormData(prev => ({ ...prev, location }));
        }
        setIsDetectingLocation(false);
      });
    }
  }, [latitude, longitude]);

  const createToyMutation = useMutation({
    mutationFn: async (toyData: any) => {
      return await apiRequest("POST", "/api/toys", toyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/toys"] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/users", user.id, "toys"] });
      }
      toast({
        title: "Toy listed successfully!",
        description: "Your toy is now available for exchange.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to list toy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    try {
      const toyData = insertToySchema.parse({
        ...formData,
        ownerId: user?.id || "",
        imageUrls: images,
        latitude,
        longitude,
      });
      createToyMutation.mutate(toyData);
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
    }
  };

  const handleUseDetectedLocation = () => {
    if (detectedLocation) {
      setFormData(prev => ({ ...prev, location: detectedLocation }));
    }
  };

  const isFormValid = formData.name && formData.category && formData.ageGroup && formData.condition;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="w-full max-w-sm mx-auto bg-white rounded-t-3xl shadow-2xl animate-slide-up">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-3xl p-6">
          <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4"></div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">List a Toy</h2>
              <p className="text-sm text-purple-100">Share your toy with the community</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content with padding */}
        <div className="p-6">
          <div className="space-y-5 mb-6 max-h-96 overflow-y-auto">
          {/* Photo Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Add Photos <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-4">Add up to 5 photos. The first photo will be your main image.</p>
              
              {images.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        <img 
                          src={image} 
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {images.length < 5 && (
                      <div
                        className="aspect-square border-2 border-dashed border-purple-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-6 h-6 text-purple-400 mb-2" />
                        <span className="text-sm text-purple-600 text-center px-2">
                          Tap to add
                        </span>
                      </div>
                    )}
                  </div>
                  {images.length < 5 && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-3 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all"
                    >
                      <Camera className="w-4 h-4 inline mr-2" />
                      Add more photos
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Add your toy photos</p>
                  <p className="text-xs text-purple-600 font-medium">Tap to choose from gallery</p>
                </div>
              )}
            </div>

            {/* Toy Name */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Toy Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., LEGO Creator 3-in-1 Deep Sea Creatures"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your toy's condition, what's included, and why kids would love it..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.description.length}/500
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setFormData({ ...formData, category })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.category === category
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-sm font-medium ${
                      formData.category === category ? 'text-purple-700' : 'text-gray-700'
                    }`}>
                      {category}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Age Group and Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">Age Range</label>
                <div className="space-y-2">
                  {ageGroups.map((age) => (
                    <button
                      key={age}
                      onClick={() => setFormData({ ...formData, ageGroup: age })}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                        formData.ageGroup === age
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-sm font-medium ${
                        formData.ageGroup === age ? 'text-purple-700' : 'text-gray-700'
                      }`}>
                        Ages {age}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Condition <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {conditions.map((condition) => (
                    <button
                      key={condition}
                      onClick={() => setFormData({ ...formData, condition })}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                        formData.condition === condition
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-sm font-medium ${
                        formData.condition === condition ? 'text-purple-700' : 'text-gray-700'
                      }`}>
                        {condition}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">Location</label>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter location manually"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                  />
                  <button
                    type="button"
                    onClick={requestLocation}
                    disabled={locationLoading || isDetectingLocation}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center text-purple-500 hover:text-purple-600"
                  >
                    {locationLoading || isDetectingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {detectedLocation && detectedLocation !== formData.location && (
                  <button
                    type="button"
                    onClick={handleUseDetectedLocation}
                    className="w-full p-3 border border-purple-200 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Use detected: {detectedLocation}
                  </button>
                )}
                
                {locationError && (
                  <p className="text-xs text-red-500">{locationError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-100">
            <button 
              onClick={onClose} 
              className="flex-1 py-3 px-4 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!isFormValid || createToyMutation.isPending}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createToyMutation.isPending ? "Listing..." : "List Toy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
