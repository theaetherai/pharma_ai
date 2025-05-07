"use client";

import { UserButton } from "@clerk/nextjs";
import { User } from "@prisma/client";
import { Notifications } from "@/components/notifications";

interface AdminHeaderProps {
  user: User;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="border-b bg-card/80 backdrop-blur-sm shadow-sm h-16 shrink-0">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            {/* Mobile menu button would go here */}
          </div>
          <div className="hidden md:block">
            <div className="relative w-[300px]">
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-full bg-background pl-4 pr-4 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Notifications />
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">Admin</div>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
} 