import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Film, Users, Star, List } from "lucide-react";

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    title: "Welcome to Reelytics",
    description: "Track every movie you watch and build your personal film analytics library.",
    icon: <Film className="text-white text-4xl" />,
    color: "from-primary to-blue-400",
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

export function OnboardingModal({ visible, onComplete, onSkip }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };
  
  if (!visible) return null;
  
  const step = steps[currentStep];
  
  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="h-full flex flex-col">
        {/* Header with progress */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <Button 
            variant="link" 
            className="text-gray-600 p-0 h-auto" 
            onClick={onSkip}
          >
            Skip
          </Button>
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={`w-8 h-1 rounded-full ${index === currentStep ? 'bg-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <Button 
            variant="link" 
            className="text-primary p-0 h-auto" 
            onClick={handleNext}
          >
            {currentStep < steps.length - 1 ? "Next" : "Get Started"}
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className={`w-32 h-32 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mb-8`}>
            {step.icon}
          </div>
          <h2 className="text-2xl font-bold mb-3">{step.title}</h2>
          <p className="text-gray-600 mb-8 max-w-xs">
            {step.description}
          </p>
          <div className="w-full flex justify-center">
            <div className="w-64 h-64 bg-gray-100 rounded-xl shadow-sm flex items-center justify-center">
              {/* Show different illustrations based on step */}
              {currentStep === 0 && (
                <div className="p-6 text-center">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="aspect-[2/3] bg-gray-200 rounded-md"></div>
                    ))}
                  </div>
                  <div className="h-6 w-full bg-gray-200 rounded-full mb-2"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded-full mx-auto"></div>
                </div>
              )}
              
              {currentStep === 1 && (
                <div className="p-6">
                  <div className="flex justify-center mb-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="h-8 w-8 text-amber-400" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-full bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary rounded-md mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 w-full bg-gray-200 rounded-full mb-1"></div>
                        <div className="h-3 w-1/2 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-pink-500 rounded-md mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 w-full bg-gray-200 rounded-full mb-1"></div>
                        <div className="h-3 w-1/2 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-amber-500 rounded-md mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 w-full bg-gray-200 rounded-full mb-1"></div>
                        <div className="h-3 w-1/2 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
