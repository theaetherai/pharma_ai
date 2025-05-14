import { Suspense, lazy } from 'react';
import { Sidebar } from "@/components/sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { createRoleJWT, getUserRoleFromJWT, storeRoleJWT } from "@/lib/jwt-utils";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardClient from "./dashboard-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMobile } from "@/components/sidebar-mobile";
import { DashboardHeader } from "@/components/dashboard-header";
import { CartProvider } from "@/components/cart/cart-provider";

// Lazy load components for better performance
const SidebarFallback = () => (
  <div className="h-full w-64 bg-card border-r p-4">
    <Skeleton className="h-10 w-full rounded-md mb-8" />
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="h-8 w-full rounded-md mb-4" />
    ))}
  </div>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
    <div className="flex h-screen max-h-screen overflow-hidden">
      <CartProvider>
        <div className="hidden md:flex h-full">
          <Sidebar />
        </div>
        <div className="md:hidden">
          <SidebarMobile />
        </div>
        <div className="flex flex-col flex-1 h-full min-w-0">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </CartProvider>
      </div>
    );
} 