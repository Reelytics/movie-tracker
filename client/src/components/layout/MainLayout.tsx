import React from "react";
import BottomNav from "./BottomNav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 pb-16">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
