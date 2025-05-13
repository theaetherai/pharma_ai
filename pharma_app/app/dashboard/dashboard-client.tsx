"use client";

import { Sidebar } from "@/components/sidebar";
import { SidebarMobile } from "@/components/sidebar-mobile";
import { UserButton } from "@clerk/nextjs";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Notifications } from "@/components/notifications";

// Define a plain object interface instead of using the Clerk User type
interface UserInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  email: string;
  role: string;
}

interface DashboardClientProps {
  children: React.ReactNode;
  userInfo: UserInfo;
}

export default function DashboardClient({ children, userInfo }: DashboardClientProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-background to-secondary/10">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex h-full border-r shadow-sm bg-card">
        <Sidebar />
      </div>

      {/* Mobile sidebar - only include it once in the layout, not in the header */}
      <div className="md:hidden">
        <SidebarMobile />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <motion.header 
          className="border-b bg-card/80 backdrop-blur-sm shadow-sm h-16 shrink-0"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-3">
              {/* Don't include the sidebar mobile toggle here, it's already in the layout */}
              <div className="hidden md:block">
                <div className="relative w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search medications, symptoms..."
                    className="w-full rounded-full bg-background pl-9 pr-4 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Notifications />
              <div className="flex items-center gap-2">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium">{userInfo.firstName} {userInfo.lastName}</div>
                  <div className="text-xs text-muted-foreground">
                    {userInfo.role === "ADMIN" ? "Admin" : "Patient"}
                  </div>
                </div>
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Content area */}
        <motion.main 
          className="flex-1 h-[calc(100%-4rem)] w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
            {children}
        </motion.main>
      </div>
    </div>
  );
} 