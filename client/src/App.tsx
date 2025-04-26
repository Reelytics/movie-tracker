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
import AuthPage from "@/pages/auth";
import MovieDetails from "@/pages/movie-details";
import EditProfile from "@/pages/edit-profile";
import BottomNavigation from "@/components/layout/BottomNavigation";
import Header from "@/components/layout/Header";
import { ThemeProvider } from "next-themes";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useState, useEffect } from "react";
import { MovieDetailModalProvider } from "@/hooks/useModal";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function Router() {
  const [location] = useLocation();
  const showNav = !location.startsWith("/onboarding") && 
                !location.startsWith("/auth") && 
                !location.startsWith("/movie/") && 
                !location.startsWith("/edit-profile");

  return (
    <div className="min-h-screen flex flex-col">
      {showNav && <Header />}
      <main className="flex-1 pb-16">
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/">
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          </Route>
          <Route path="/profile">
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Route>
          <Route path="/profile/:id">
            <Profile />
          </Route>
          <Route path="/search">
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          </Route>
          <Route path="/library">
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          </Route>
          <Route path="/edit-profile">
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          </Route>
          <Route path="/movie/:id" component={MovieDetails} />
          <Route>
            <NotFound />
          </Route>
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
          <AuthProvider>
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
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
