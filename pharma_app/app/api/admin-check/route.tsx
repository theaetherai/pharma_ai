import 'server-only';

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs";
import { getUserRoleFromDB } from "@/lib/db-auth";
import { hasAdminRoleInJWT, DEBUG } from "@/lib/auth-config";
import { createRoleJWT, storeRoleJWT } from "@/lib/jwt-utils";

// Interface for session claims to fix TypeScript errors
interface SessionClaims {
  [key: string]: any;
  role?: string;
  publicMetadata?: {
    role?: string;
    [key: string]: any;
  }
}

// Debug logger
function debug(...args: any[]) {
  if (DEBUG) {
    console.log("[API/ADMIN-CHECK]", ...args);
  }
}

/**
 * API endpoint to check if current user has admin role in database 
 * and update both Clerk JWT claims and our custom JWT
 * 
 * USES DATABASE AS PRIMARY SOURCE OF TRUTH - This endpoint:
 * 1. Checks database role for admin status
 * 2. Updates Clerk JWT claims to match database
 * 3. Creates and stores custom JWT for faster role checks
 * 4. Redirects to appropriate location based on admin status
 * 
 * Route: GET /api/admin-check
 */
export async function GET(request: NextRequest) {
  debug("======= ADMIN-CHECK API CALLED =======");
  
  // Make sure we're in a server environment
  if (typeof window !== 'undefined') {
    console.error("Server-side function called in browser");
    return NextResponse.json({ error: 'Server-side function called in browser' }, { status: 500 });
  }

  const { userId, sessionClaims } = auth();
  // Cast sessionClaims to our helper type with proper type safety
  const typedClaims = sessionClaims as SessionClaims | undefined;
  
  // User must be authenticated
  if (!userId) {
    debug('No authenticated user, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Get the return URL from the query parameter or default to /admin
  const searchParams = request.nextUrl.searchParams;
  const returnUrl = searchParams.get('returnUrl') || '/admin';
  debug("Checking admin status for user:", userId);
  debug("Return URL:", returnUrl);

  try {
    // Check if role is undefined in JWT 
    const hasRoleInJWT = typedClaims?.role !== undefined || typedClaims?.publicMetadata?.role !== undefined;
    debug("Has role in JWT:", hasRoleInJWT);
    if (!hasRoleInJWT) {
      debug("Role is undefined in JWT, will sync with database");
    }
    
    // Check JWT claims for logging purposes
    const hasAdminInJWT = hasAdminRoleInJWT(typedClaims);
    debug("Admin role in JWT:", hasAdminInJWT);
    debug("Full session claims:", JSON.stringify(typedClaims, null, 2));

    // PRIMARY SOURCE OF TRUTH: Get user role from database
    debug("Checking database as primary source of truth");
    const dbRole = await getUserRoleFromDB(userId);
    debug("Result from database:", dbRole);

    // User not found in database
    if (dbRole === null) {
      debug("User not found in database:", userId);
      // Redirect to dashboard if user not found in database
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const isAdminInDb = dbRole === "ADMIN";
    debug("User role in database:", dbRole, "isAdmin:", isAdminInDb);

    // Create our custom JWT with the role from database
    debug("Creating custom JWT with role from database");
    const token = await createRoleJWT(userId);
    if (token) {
      debug("Custom JWT created successfully");
    } else {
      debug("Failed to create custom JWT");
    }
    
    // Get current publicMetadata
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata;
    debug("Current metadata:", JSON.stringify(currentMetadata, null, 2));

    // Always update Clerk JWT claims to match database role, especially if undefined
    debug("Updating Clerk JWT claims to match database role");
    
    try {
      // Update user's public metadata
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          ...currentMetadata,
          role: dbRole,
        },
      });
      
      debug(`Clerk JWT role updated to ${dbRole}`);
    } catch (updateError) {
      console.error("Error updating Clerk JWT claims:", updateError);
      debug("Error updating Clerk JWT claims:", updateError);
      // Continue with redirect even if update fails
    }

    // Create a response object to store the JWT cookie
    let response: NextResponse;
    
    // Determine where to redirect based on database role
    if (isAdminInDb) {
      debug(`User is admin in database, redirecting to ${returnUrl}`);
      // If the returnUrl starts with /admin, use it, otherwise default to /admin
      const redirectUrl = returnUrl.startsWith('/admin') ? returnUrl : '/admin';
      debug(`Final redirect URL: ${redirectUrl}`);
      response = NextResponse.redirect(new URL(redirectUrl, request.url));
    } else {
      debug("User is not admin in database, redirecting to dashboard");
      response = NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Store the custom JWT in the response cookie
    if (token) {
      debug("Storing custom JWT in response cookie");
      response.cookies.set('__clerk_db_jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }
    
    return response;
  } catch (error) {
    console.error("Error checking admin status:", error);
    debug("Error checking admin status:", error);
    // In case of error, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
} 