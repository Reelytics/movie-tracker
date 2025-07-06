import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/MainLayout";

// Import pages
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import AddMovie from "@/pages/AddMovie";
import AddMovieDetails from "@/pages/AddMovieDetails";
import TicketScan from "@/pages/TicketScan";
import Statistics from "@/pages/Statistics";
import Profile from "@/pages/Profile";
import MovieDetail from "@/pages/MovieDetail";
import Films from "@/pages/Films";
import Collections from "@/pages/Collections";
import Members from "@/pages/Members";
import Reviews from "@/pages/Reviews";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/films" component={Films} />
      <Route path="/collections" component={Collections} />
      <Route path="/members" component={Members} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/search" component={Search} />
      <Route path="/add" component={AddMovie} />
      <Route path="/movie/add/:id" component={AddMovieDetails} />
      <Route path="/scan" component={TicketScan} />
      <Route path="/stats" component={Statistics} />
      <Route path="/profile" component={Profile} />
      <Route path="/movie/:id" component={MovieDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Router />
      </MainLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
