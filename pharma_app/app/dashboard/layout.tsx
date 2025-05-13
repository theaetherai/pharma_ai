import { Suspense, lazy } from 'react';
import { Sidebar } from "@/components/sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { createRoleJWT, getUserRoleFromJWT, storeRoleJWT } from "@/lib/jwt-utils";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardClient from "./dashboard-client";

// Lazy load components for better performance
const SidebarFallback = () => (
  <div className="h-full w-64 bg-card border-r p-4">
    <Skeleton className="h-10 w-full rounded-md mb-8" />
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="h-8 w-full rounded-md mb-4" />
    ))}
  </div>
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Get auth status first - this is faster and more reliable
    const { userId } = auth();
    
    // If user is not authenticated, redirect to sign-in
    if (!userId) {
      redirect("/sign-in");
    }
    
    // Get current user details only if authenticated
    let user;
    try {
      user = await currentUser();
    } catch (error) {
      console.error("Error fetching current user:", error);
      // Redirect to sign-in if we can't get the user
      redirect("/sign-in");
    }
    
    // This should not happen if userId exists, but as a fallback
    if (!user) {
      redirect("/sign-in");
    }

    // Get user's role from JWT or database - this is the key improvement
    let userRole;
    try {
      // First check if we have a valid JWT with the role
      userRole = await getUserRoleFromJWT(userId);

      // If no role in JWT, create a new JWT with role from database
      if (!userRole) {
        console.log(`No role found in JWT for user ${userId}, creating new JWT`);
        const token = await createRoleJWT(userId);
        if (token) {
          await storeRoleJWT(token);
          // Get the role again (from the newly created JWT)
          userRole = await getUserRoleFromJWT(userId);
        }
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      // Continue without role if there's an error - will default to regular user access
    }

    // Extract only the properties we need as a plain object
    const userInfo = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      email: user.emailAddresses[0]?.emailAddress || "",
      role: userRole || "USER", // Add the role to user info object
    };

    // Pass the extracted user data to the client component
    return (
      <div className="flex h-screen w-full overflow-hidden bg-gradient-to-b from-background to-secondary/10">
        {/* Main content - SidebarMobile is now handled in DashboardClient */}
        <DashboardClient userInfo={userInfo}>
          {children}
        </DashboardClient>
      </div>
    );
  } catch (error) {
    console.error("Error in dashboard layout:", error);
    // Fallback UI or redirect in case of any errors
    redirect("/sign-in");
  }
} 