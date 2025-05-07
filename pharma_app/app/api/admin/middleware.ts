import 'server-only';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { hasAdminRoleInJWT, DEBUG, SessionClaims } from "@/lib/auth-config";
import { isAdminFromDB } from "@/lib/db-auth";

// Custom debug logger
function debug(...messages: any[]) {
  if (DEBUG) {
    console.log('[ADMIN-API-MIDDLEWARE]', ...messages);
  }
}

// Options for the admin API middleware
interface AdminApiMiddlewareOptions {
  // Whether to check database in addition to JWT claims
  checkDatabase?: boolean;
  // If true, user must be admin in both JWT and database
  requireBoth?: boolean;
}

// Default options
const defaultOptions: AdminApiMiddlewareOptions = {
  checkDatabase: true, // By default, check both JWT and database for better security
  requireBoth: false   // By default, allow either JWT or database admin role
};

/**
 * Middleware for admin API routes that checks if the user is an admin
 * 
 * Security flow:
 * 1. Always checks JWT claims first (fast)
 * 2. If checkDatabase is true or JWT doesn't have admin role, checks database (secure)
 * 3. Access is granted based on the requireBoth option:
 *    - If requireBoth=true: must be admin in BOTH JWT and database
 *    - If requireBoth=false: must be admin in EITHER JWT or database
 * 
 * RECOMMENDED USAGE:
 * - For non-critical admin APIs: use default options (balanced security)
 * - For critical operations: set requireBoth=true (highest security)
 * - For high-performance needs: set checkDatabase=false (JWT only, less secure)
 */
export async function adminApiMiddleware(
  req: NextRequest, 
  options: AdminApiMiddlewareOptions = {}
) {
  // Make sure we're in a server environment
  if (typeof window !== 'undefined') {
    console.error('adminApiMiddleware called in browser environment');
    return NextResponse.json(
      { error: "Server-side function called in browser" },
      { status: 500 }
    );
  }

  // Merge default options with provided options
  const opts = { ...defaultOptions, ...options };
  
  try {
    const { userId, sessionClaims } = auth();
    // Cast sessionClaims to our helper type with proper type safety
    const typedClaims = sessionClaims as SessionClaims | undefined;
    
    // Check if authenticated
    if (!userId) {
      debug('No authenticated user');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    debug(`Checking admin access for API request, user: ${userId}`);
    
    // Always check JWT first (faster)
    const isAdminInJWT = hasAdminRoleInJWT(typedClaims);    
    debug(`JWT admin check result: ${isAdminInJWT}`);
    
    // If we only need to check JWT and user is admin in JWT, allow access
    if (!opts.checkDatabase && isAdminInJWT) {
      debug(`Admin access granted for user ${userId} via JWT only`);
      return null;
    }
    
    // If we're configured to check database or the JWT check failed,
    // perform a database check
    const shouldCheckDatabase = opts.checkDatabase || !isAdminInJWT;
    
    if (shouldCheckDatabase) {
      debug(`Performing database admin check for user ${userId}`);
      const isAdminInDB = await isAdminFromDB(userId);
      debug(`Database admin check result: ${isAdminInDB}`);
      
      // If we require both JWT and DB to be admin
      if (opts.requireBoth && (!isAdminInJWT || !isAdminInDB)) {
        debug('User does not have admin role in both JWT and database');
        return NextResponse.json(
          { error: "Unauthorized. Admin access required." },
          { status: 403 }
        );
      }
      
      // If we only need one of the checks to pass
      if (!opts.requireBoth && (isAdminInJWT || isAdminInDB)) {
        debug(`Admin access granted for user ${userId} via JWT or database`);
        return null;
      }
      
      // If user is not admin in database and JWT, deny access
      if (!isAdminInDB && !isAdminInJWT) {
        debug('User does not have admin role in either JWT or database');
        return NextResponse.json(
          { error: "Unauthorized. Admin access required." },
          { status: 403 }
        );
      }
    } else {
      // User is not admin in JWT and we're not checking database
      debug('User does not have admin role in JWT claims');
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }
    
    // User passed all required checks
    debug(`Admin access granted for API request from user ${userId}`);
    return null;
  } catch (error) {
    console.error("Error in admin API middleware:", error);
    return NextResponse.json(
      { error: "Server error while checking admin access" },
      { status: 500 }
    );
  }
}