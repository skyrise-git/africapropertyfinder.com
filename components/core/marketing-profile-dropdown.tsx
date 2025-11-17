"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/hooks/use-app-store";
import { LogOut, Settings, LifeBuoy } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function MarketingProfileDropdown() {
  const router = useRouter();
  const { user } = useAppStore();

  const handleLogout = async () => {
    try {
      const { firebaseAuth } = await import("@atechhub/firebase");
      await firebaseAuth({
        action: "logout",
      });
      router.push("/signin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <Avatar className="h-9 w-9 border-2 border-border">
            <AvatarImage
              src={user.profilePicture}
              alt={user.name || "User"}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user.name ? getUserInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end" forceMount>
        {/* Active Account Section */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage
                src={user.profilePicture}
                alt={user.name || "User"}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {user.name ? getUserInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email || "No email"}{" "}
                {user.role && (
                  <Badge
                    variant="secondary"
                    className="text-xs capitalize font-normal ml-1"
                  >
                    {user.role}
                  </Badge>
                )}
              </p>
            </div>
          </div>

          {/* Account Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start h-9"
              asChild
            >
              <Link href="/properties/create">
                <LifeBuoy className="mr-2 h-4 w-4" />
                List Property
              </Link>
            </Button>
            {user.role && (
              <Button
                variant="outline"
                className="w-full justify-start h-9"
                asChild
              >
                <Link href={`/${user.role}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage account
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start h-9"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* Footer */}
        <div className="p-3 bg-muted/50">
          <p className="text-xs text-center text-muted-foreground">
            Secured by{" "}
            <span className="font-semibold text-foreground">Firebase Auth</span>
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

