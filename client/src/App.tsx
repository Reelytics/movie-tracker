import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Profile from "@/pages/profile";
import Home from "@/pages/home";
import Search from "@/pages/search";
import Library from "@/pages/library";
import BottomNavigation from "@/components/layout/BottomNavigation";
import Header from "@/components/layout/Header";
import { ThemeProvider } from "next-themes";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useState, useEffect } from "react";
import { MovieDetailModalProvider } from "@/hooks/useModal";

function Router() {
  const [location] = useLocation();
  const showNav = !location.startsWith("/onboarding");

  return (
    <div className="min-h-screen flex flex-col">
      {showNav && <Header />}
      <main className="flex-1 pb-16">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/profile" component={Profile} />
          <Route path="/search" component={Search} />
          <Route path="/library" component={Library} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {showNav && <BottomNavigation />}
    </div>
  );
}

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    // Check if first time user based on localStorage
    const isFirstTimeUser = !localStorage.getItem("onboardingComplete");
    if (isFirstTimeUser) {
      setShowOnboarding(true);
    }
  }, []);
  
  const completeOnboarding = () => {
    localStorage.setItem("onboardingComplete", "true");
    setShowOnboarding(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <MovieDetailModalProvider>
            <Toaster />
            <Router />
            {showOnboarding && (
              <OnboardingModal
                visible={showOnboarding}
                onComplete={completeOnboarding}
                onSkip={completeOnboarding}
              />
            )}
          </MovieDetailModalProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
