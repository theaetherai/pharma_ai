// Mark as server-only module - must be the first import
import 'server-only';

import { Suspense, lazy } from 'react';
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { isAdminFromDB, isAdminComprehensive } from "@/lib/db-auth";
import { hasAdminRoleInJWT, DEBUG, SessionClaims } from "@/lib/auth-config";
import { UserRole } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserRoleFromJWT, createRoleJWT, storeRoleJWT } from "@/lib/jwt-utils";

// Lazy load the sidebar for better initial loading performance
const AdminSidebar = lazy(() => import('@/components/admin/admin-sidebar').then(mod => ({ 
  default: mod.AdminSidebar 
})));

// Loading components
const SidebarSkeleton = () => (
  <div className="hidden md:flex h-full flex-col w-64 border-r shadow-sm bg-card p-4 gap-4">
    <Skeleton className="h-12 w-full rounded-md mb-6" />
    {[...Array(8)].map((_, i) => (
      <Skeleton key={i} className="h-10 w-full rounded-md" />
    ))}
  </div>
);

// Create a minimal Mock User for AdminHeader
const createMockUser = (userId: string, name: string | null | undefined) => ({
  id: userId,
  name: name || "Admin",
  email: "admin@example.com",
  role: UserRole.ADMIN,
  clerkId: userId,
  emailVerified: null,
  password: "",
  image: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Custom debug logger
function debug(...messages: any[]) {
  if (DEBUG) {
    console.log('[ADMIN-LAYOUT]', ...messages);
  }
}

/**
 * Admin layout - Server Component that verifies admin access
 * Enhanced with JWT role caching to avoid repeated database checks
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = auth();
  const typedClaims = sessionClaims as SessionClaims || {};

  // Redirect if not authenticated
  if (!userId) {
    debug('No userId found, redirecting to sign-in');
    redirect("/sign-in");
  }

  debug(`Admin access check for user ${userId}`);
  
  try {
    // Check the cached role JWT first - this is fast
    debug(`Checking cached role JWT for user ${userId}`);
    const userRole = await getUserRoleFromJWT(userId);
    
    // If the JWT contains a valid role and it's ADMIN, allow access
    if (userRole === "ADMIN") {
      debug(`JWT role check confirmed user ${userId} is an admin`);
      
      // Create the mock user for AdminHeader
      const mockUser = createMockUser(userId, typedClaims.name);
      
      return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-b from-background to-secondary/10">
          {/* Admin Sidebar - Lazy loaded with Suspense */}
          <Suspense fallback={<SidebarSkeleton />}>
            <div className="hidden md:flex h-full border-r shadow-sm bg-card w-64">
              <AdminSidebar />
            </div>
          </Suspense>

          {/* Main content */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Admin Header */}
            <AdminHeader user={mockUser} />

            {/* Content area - Wrapped in Suspense for better tab switching */}
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      );
    }
    
    // If JWT doesn't indicate admin, do a direct database check
    debug(`JWT did not confirm admin status. Performing database check for user ${userId}`);
    
    // Use a lightweight DB check
    const isAdminInDB = await isAdminFromDB(userId);
    
    // If the user is an admin in the database, but not in JWT
    if (isAdminInDB) {
      debug(`Database check confirmed user ${userId} is an admin. Updating JWT.`);
      
      // Update the JWT for future checks
      const token = await createRoleJWT(userId);
      if (token) {
        storeRoleJWT(token);
      }
      
      // Create the mock user for AdminHeader
      const mockUser = createMockUser(userId, typedClaims.name);
      
      return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-b from-background to-secondary/10">
          {/* Admin Sidebar - Lazy loaded with Suspense */}
          <Suspense fallback={<SidebarSkeleton />}>
            <div className="hidden md:flex h-full border-r shadow-sm bg-card w-64">
              <AdminSidebar />
            </div>
          </Suspense>

          {/* Main content */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Admin Header */}
            <AdminHeader user={mockUser} />

            {/* Content area - Wrapped in Suspense for better tab switching */}
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      );
    }
    
    // User is not an admin, redirect to dashboard
    debug("Access denied: User is not an admin", { userId });
    redirect("/dashboard");
    
  } catch (error) {
    console.error("Error in admin layout:", error);
    debug(`Error occurred while checking admin status: ${error}`);
    
    // Check JWT as an absolute fallback
    if (hasAdminRoleInJWT(typedClaims)) {
      debug(`JWT fallback check shows admin role for user ${userId}`);
      
      // Create the mock user for AdminHeader
      const mockUser = createMockUser(userId, typedClaims.name);
      
      return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-b from-background to-secondary/10">
          {/* Admin Sidebar - Lazy loaded with Suspense */}
          <Suspense fallback={<SidebarSkeleton />}>
            <div className="hidden md:flex h-full border-r shadow-sm bg-card w-64">
              <AdminSidebar />
            </div>
          </Suspense>

          {/* Main content */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Admin Header */}
            <AdminHeader user={mockUser} />

            {/* Content area - Wrapped in Suspense for better tab switching */}
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      );
    }
    
    // User is not an admin in JWT fallback, redirect to dashboard
    debug("Access denied: User is not an admin in JWT fallback", { userId });
    redirect("/dashboard");
  }
} 