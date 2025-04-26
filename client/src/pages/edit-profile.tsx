import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import ImageCropper from "@/components/profile/ImageCropper";
import { UserProfile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft, Camera, TrashIcon, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

// Form validation schema
const profileSchema = z.object({
  fullName: z.string().nullable(),
  bio: z.string().max(200, "Bio must be less than 200 characters").nullable(),
  profilePicture: z.string().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profilePictureURL, setProfilePictureURL] = useState<string | null>(null);
  const [tempImageURL, setTempImageURL] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState<boolean>(false);

  // Fetch user profile data
  const { data: profile, isLoading: loadingProfile } = useQuery<UserProfile>({
    queryKey: ["/api/users/current"],
  });
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      bio: "",
      profilePicture: null,
    },
  });
  
  // Set default values when profile data is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.user.fullName,
        bio: profile.user.bio,
        profilePicture: profile.user.profilePicture,
      });
      
      if (profile.user.profilePicture) {
        setProfilePictureURL(profile.user.profilePicture);
      }
    }
  }, [profile, form]);
  
  // Set document title
  useEffect(() => {
    document.title = "Edit Profile | MovieDiary";
  }, []);
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // Use apiRequest from queryClient
      const response = await apiRequest("PATCH", "/api/users/current", data);
      return response;
    },
    onSuccess: () => {
      // Invalidate profile cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
        duration: 3000,
      });
      
      // Navigate back to profile page
      setLocation("/profile");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
        duration: 5000,
      });
    }
  });
  
  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        toast({
          title: "Processing image",
          description: "Loading image for cropping...",
          duration: 2000,
        });
        
        // Convert to data URL for preview in cropper
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataURL = event.target?.result as string;
          setTempImageURL(dataURL);
          setShowCropper(true);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error loading image:", error);
        toast({
          title: "Error",
          description: "Failed to load image. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  };
  
  const handleCropComplete = async (croppedImageURL: string) => {
    try {
      // The image is already cropped, so we just need to save it
      setProfilePictureURL(croppedImageURL);
      form.setValue("profilePicture", croppedImageURL);
      setShowCropper(false);
      setTempImageURL(null);
      
      toast({
        title: "Image cropped",
        description: "Your profile picture has been cropped successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error saving cropped image:", error);
      toast({
        title: "Error",
        description: "Failed to save cropped image. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };
  
  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageURL(null);
  };
  
  const removeProfilePicture = () => {
    setProfilePictureURL(null);
    form.setValue("profilePicture", null);
  };
  
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => setLocation("/profile")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Edit Profile</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-white shadow">
                {profilePictureURL ? (
                  <AvatarImage src={profilePictureURL} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-r from-primary to-pink-500 text-white">
                    <UserCircle className="h-12 w-12" />
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="absolute -bottom-1 -right-1 flex space-x-1">
                <label htmlFor="picture-upload" className="bg-primary text-white p-1.5 rounded-full cursor-pointer shadow-md">
                  <Camera className="h-4 w-4" />
                  <input 
                    type="file" 
                    id="picture-upload" 
                    accept="image/*"
                    className="hidden" 
                    onChange={handleProfilePictureChange}
                  />
                </label>
                
                {profilePictureURL && (
                  <Button 
                    type="button"
                    variant="destructive" 
                    size="icon" 
                    className="h-7 w-7 rounded-full shadow-md"
                    onClick={removeProfilePicture}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-3">Tap the camera icon to change your profile picture</p>
          </div>
          
          <Separator />
          
          {/* Username (non-editable) */}
          <div>
            <Label htmlFor="username" className="text-gray-600">Username</Label>
            <Input 
              id="username" 
              value={profile?.user.username || ""} 
              disabled 
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
          </div>
          
          {/* Full Name */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your full name"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Bio */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about yourself..."
                    className="resize-none"
                    rows={4}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <div className="flex justify-between">
                  <FormMessage />
                  <p className="text-xs text-gray-500">
                    {(field.value?.length || 0)}/200
                  </p>
                </div>
              </FormItem>
            )}
          />
          
          <div className="flex space-x-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setLocation("/profile")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
      
      {/* Image Cropper */}
      {showCropper && tempImageURL && (
        <ImageCropper
          image={tempImageURL}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
    </div>
  );
}