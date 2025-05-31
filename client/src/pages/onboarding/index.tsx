import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Film, Users, Star, List, TagsIcon } from "lucide-react";
import { TMDBGenre } from "@/types";
import { GENRES, getGenres } from "@/lib/tmdb";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const steps = [
  {
    title: "Welcome to Reelytics",
    description: "Track every movie you watch and build your personal film analytics library.",
    icon: <Film className="text-white text-4xl" />,
    color: "from-primary to-blue-400",
  },
  {
    title: "Your Movie Taste",
    description: "Select your favorite genres to personalize your experience.",
    icon: <TagsIcon className="text-white text-4xl" />,
    color: "from-green-500 to-teal-400",
  },
  {
    title: "Rate and Review",
    description: "Share your thoughts and give ratings to the movies you've watched.",
    icon: <Star className="text-white text-4xl" />,
    color: "from-amber-500 to-yellow-400",
  },
  {
    title: "Create Collections",
    description: "Organize your movies into custom lists and collections.",
    icon: <List className="text-white text-4xl" />,
    color: "from-pink-500 to-purple-400",
  },
];

// Map genre IDs to their names for UI display
const genreIdToName: {[key: number]: string} = {
  [GENRES.ACTION]: "Action",
  [GENRES.ADVENTURE]: "Adventure",
  [GENRES.ANIMATION]: "Animation",
  [GENRES.COMEDY]: "Comedy",
  [GENRES.CRIME]: "Crime",
  [GENRES.DOCUMENTARY]: "Documentary",
  [GENRES.DRAMA]: "Drama",
  [GENRES.FAMILY]: "Family",
  [GENRES.FANTASY]: "Fantasy",
  [GENRES.HISTORY]: "History",
  [GENRES.HORROR]: "Horror",
  [GENRES.MUSIC]: "Music",
  [GENRES.MYSTERY]: "Mystery",
  [GENRES.ROMANCE]: "Romance",
  [GENRES.SCIENCE_FICTION]: "Sci-Fi",
  [GENRES.THRILLER]: "Thriller",
  [GENRES.WAR]: "War",
  [GENRES.WESTERN]: "Western",
};

// Pre-defined popular genre IDs for quicker selection
const popularGenreIds = [
  GENRES.ACTION,
  GENRES.COMEDY,
  GENRES.DRAMA,
  GENRES.HORROR,
  GENRES.SCIENCE_FICTION,
  GENRES.ROMANCE,
  GENRES.ANIMATION,
  GENRES.THRILLER,
  GENRES.ADVENTURE,
  GENRES.FANTASY,
  GENRES.CRIME,
  GENRES.MYSTERY,
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [availableGenres, setAvailableGenres] = useState<TMDBGenre[]>([]);
  const [isLoadingGenres, setIsLoadingGenres] = useState(false);
  const [isSavingGenres, setIsSavingGenres] = useState(false);
  const [genreFetchAttempted, setGenreFetchAttempted] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, updateUserCache } = useAuth();
  
  // Reference to track if component is mounted
  const isMounted = React.useRef(true);
  
  // Set isMounted to false when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Fetch genres when we reach the genre selection step
  useEffect(() => {
    // Only fetch genres once when on step 1 (genre selection)
    if (
      currentStep === 1 && 
      availableGenres.length === 0 && 
      !genreFetchAttempted && 
      !isLoadingGenres &&
      isMounted.current
    ) {
      setGenreFetchAttempted(true);
      fetchGenres();
    }
  }, [currentStep, availableGenres.length, genreFetchAttempted, isLoadingGenres]);
  
  const fetchGenres = async () => {
    // Prevent duplicate requests
    if (isLoadingGenres) return;
    
    setIsLoadingGenres(true);
    try {
      console.log("Fetching movie genres...");
      const genres = await getGenres();
      console.log(`Fetched ${genres.length} genres`);
      if (genres && Array.isArray(genres)) {
        setAvailableGenres(genres);
      } else {
        console.error("Invalid genres data format:", genres);
        setAvailableGenres([]);
      }
    } catch (error) {
      console.error("Failed to fetch genres:", error);
      // Set empty array to prevent infinite retries
      setAvailableGenres([]);
      toast({
        title: "Error",
        description: "Failed to load movie genres. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGenres(false);
    }
  };

  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter(id => id !== genreId));
    } else {
      // Limit to 5 selections
      if (selectedGenres.length < 5) {
        setSelectedGenres([...selectedGenres, genreId]);
      } else {
        toast({
          title: "Selection Limit",
          description: "You can select up to 5 favorite genres.",
          variant: "default",
        });
      }
    }
  };
  
  const saveGenrePreferences = async () => {
    // If already saving or if no user, don't proceed
    if (isSavingGenres) return;
    
    if (!user?.id || selectedGenres.length === 0) {
      // Just advance to the next step if we can't save preferences
      setCurrentStep(prevStep => prevStep + 1);
      return;
    }
    
    setIsSavingGenres(true);
    try {
      console.log("Saving genre preferences...", selectedGenres);
      
      // Make API call to save the user's genre preferences
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      await apiRequest("POST", `/api/users/${user.id}/preferences/genres`, {
        genreIds: selectedGenres
      }, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      toast({
        title: "Preferences Saved",
        description: "Your favorite genres have been saved!",
      });
      
      // Advance to next step
      setCurrentStep(prevStep => prevStep + 1);
    } catch (error) {
      console.error("Failed to save genre preferences:", error);
      toast({
        title: "Warning",
        description: "Could not save your preferences but continuing anyway.",
        variant: "destructive",
      });
      
      // Still proceed to next step
      setCurrentStep(prevStep => prevStep + 1);
    } finally {
      setIsSavingGenres(false);
    }
  };
  
  const handleSkip = async () => {
    try {
      // Mark onboarding as complete on server
      await apiRequest("POST", "/api/onboarding/complete");
      
      // Also mark as complete in localStorage for redundancy
      localStorage.setItem("onboardingComplete", "true");
      
      // Redirect to home page
      setLocation('/');
    } catch (error) {
      console.error("Failed to mark onboarding as complete:", error);
      // Still redirect to home page
      setLocation('/');
    }
  };
  
  const handleComplete = async () => {
    try {
      // Mark onboarding as complete on server
      await apiRequest("POST", "/api/onboarding/complete");
      
      // Also mark as complete in localStorage for redundancy
      localStorage.setItem("onboardingComplete", "true");
      
      // Show success toast
      toast({
        title: "All Set!",
        description: "Welcome to Reelytics! Your preferences have been saved.",
      });
      
      // Redirect to home page
      setLocation('/');
    } catch (error) {
      console.error("Failed to mark onboarding as complete:", error);
      // Still redirect to home page
      setLocation('/');
    }
  };
  
  const handleNext = () => {
    console.log("handleNext called, current step:", currentStep);
    
    // Prevent button actions while API calls are in progress
    if (isSavingGenres) {
      console.log("Ignoring handleNext call because isSavingGenres is true");
      return;
    }
    
    if (currentStep === 1) {
      // If we're on the genre selection step and moving forward
      // Call saveGenrePreferences instead of advancing step directly
      // It will handle the step advancement internally
      saveGenrePreferences();
    } else if (currentStep < steps.length - 1) {
      // For other steps, just advance to the next step
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      // For the final step, mark onboarding as complete
      handleComplete();
    }
  };
  
  const step = steps[currentStep];
  
  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      <div className="h-full flex flex-col">
        {/* Header with progress */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <Button 
            variant="link" 
            className="text-gray-600 dark:text-gray-400 p-0 h-auto" 
            onClick={handleSkip}
          >
            Skip
          </Button>
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={`w-8 h-1 rounded-full ${index === currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
              />
            ))}
          </div>
          <Button 
            variant="link" 
            className="text-primary p-0 h-auto" 
            onClick={handleNext}
            disabled={currentStep === 1 && isSavingGenres}
          >
            {currentStep < steps.length - 1 ? "Next" : "Get Started"}
            {currentStep === 1 && isSavingGenres && (
              <Loader2 className="ml-2 h-3 w-3 animate-spin" />
            )}
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className={`w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mb-6`}>
            {step.icon}
          </div>
          <h2 className="text-2xl font-bold mb-3 dark:text-white">{step.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xs">
            {step.description}
          </p>
          
          {/* Different content based on step */}
          {currentStep === 0 && (
            <div className="w-full max-w-sm bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                ))}
              </div>
              <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
            </div>
          )}
          
          {currentStep === 1 && (
            <div className="w-full max-w-sm bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm p-6">
              {isLoadingGenres ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Select up to 5 genres you love to watch:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {popularGenreIds.map(genreId => (
                      <button
                        key={genreId}
                        onClick={() => toggleGenre(genreId)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors 
                          ${selectedGenres.includes(genreId) 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                      >
                        {genreIdToName[genreId]}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-sm text-center">
                    <span className="text-primary font-medium">
                      {selectedGenres.length} of 5
                    </span> genres selected
                  </div>
                </>
              )}
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="w-full max-w-sm bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex justify-center mb-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="h-8 w-8 text-amber-400" />
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="w-full max-w-sm bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-primary rounded-md mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-1"></div>
                    <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-pink-500 rounded-md mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-1"></div>
                    <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-amber-500 rounded-md mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-1"></div>
                    <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}