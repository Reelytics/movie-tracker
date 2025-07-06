import React from "react";
import { useLocation } from "wouter";
import BottomNav from "./BottomNav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const isLandingPage = location === "/";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className={isLandingPage ? "flex-1" : "flex-1 pb-16"}>
        {children}
      </div>
      {!isLandingPage && <BottomNav />}
    </div>
  );
}