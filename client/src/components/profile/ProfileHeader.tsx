import { useState } from "react";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { UserStats } from "@shared/schema";

interface ProfileHeaderProps {
  user: {
    id: number;
    username: string;
    fullName: string | null;
    bio: string | null;
    profilePicture: string | null;
  };
  stats: UserStats;
}

export default function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  return (
    <section id="profile-section" className="pb-4">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start">
          <div className="mr-5">
            <div className="w-20 h-20 bg-gradient-to-r from-primary to-pink-500 rounded-full overflow-hidden border-2 border-white shadow">
              <img 
                src={user.profilePicture || "https://avatar.vercel.sh/" + user.username} 
                alt="Profile picture" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">{user.username}</h2>
            <p className="text-gray-600 text-sm mb-3">{user.fullName || ""}</p>
            <p className="text-sm mb-3">{user.bio || "No bio yet"}</p>
            <Button variant="outline" size="sm" className="bg-gray-200 text-gray-800 border-gray-200 hover:bg-gray-300">
              Edit Profile
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between mt-6 pb-2 border-b border-gray-200">
          <div className="text-center">
            <div className="font-semibold">{stats.watched}</div>
            <div className="text-xs text-gray-500">Watched</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{stats.favorites}</div>
            <div className="text-xs text-gray-500">Favorites</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{stats.reviews}</div>
            <div className="text-xs text-gray-500">Reviews</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{stats.followers}</div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
        </div>
      </div>
    </section>
  );
}
