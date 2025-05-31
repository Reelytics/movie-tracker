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
import OnboardingPage from "@/pages/onboarding";
import MovieDetails from "@/pages/movie-details";
import EditProfile from "@/pages/edit-profile";
import GenrePage from "@/pages/genre";
import ActionGenrePage from "@/pages/action-genre";
import ComedyGenrePage from "@/pages/comedy-genre";
import HorrorGenrePage from "@/pages/horror-genre";
import SciFiGenrePage from "@/pages/scifi-genre";
import TicketListPage from "@/pages/tickets/TicketListPage";
import ScanReviewPage from "@/pages/tickets/ScanReviewPage";
import TicketDetailPage from "@/pages/tickets/TicketDetailPage";
import BottomNavigation from "@/components/layout/BottomNavigation";
import Header from "@/components/layout/Header";
import AppContainer from "@/components/layout/AppContainer";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
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
          <Route path="/onboarding">
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          </Route>
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
          <Route path="/user/:username">
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
          <Route path="/genre">
            <ProtectedRoute>
              <GenrePage />
            </ProtectedRoute>
          </Route>
          <Route path="/genres/action">
            <ProtectedRoute>
              <ActionGenrePage />
            </ProtectedRoute>
          </Route>
          <Route path="/genres/comedy">
            <ProtectedRoute>
              <ComedyGenrePage />
            </ProtectedRoute>
          </Route>
          <Route path="/genres/horror">
            <ProtectedRoute>
              <HorrorGenrePage />
            </ProtectedRoute>
          </Route>
          <Route path="/genres/scifi">
            <ProtectedRoute>
              <SciFiGenrePage />
            </ProtectedRoute>
          </Route>
          <Route path="/tickets">
            <ProtectedRoute>
              <TicketListPage />
            </ProtectedRoute>
          </Route>
          <Route path="/tickets/:id">
            <ProtectedRoute>
              <TicketDetailPage />
            </ProtectedRoute>
          </Route>
          <Route path="/scan-review">
            <ProtectedRoute>
              <ScanReviewPage />
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <TooltipProvider>
          <AuthProvider>
            <MovieDetailModalProvider>
              <Toaster />
              <AppContainer>
                <Router />
              </AppContainer>
            </MovieDetailModalProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
