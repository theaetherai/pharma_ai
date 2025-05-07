import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { hasAdminRoleInJWT, DEBUG, SessionClaims } from "./auth-config";

// Custom debug logger
function debug(...messages: any[]) {
  if (DEBUG) {
    console.log('[DB-AUTH]', ...messages);
  }
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Get user role from the database using Clerk ID
 * This function is for server-side components only
 * 
 * @param clerkId - The Clerk ID of the user
 * @returns UserRole | null - The user's role from the database, or null if not found
 */
export async function getUserRoleFromDB(clerkId: string): Promise<UserRole | null> {
  debug("getUserRoleFromDB called with clerkId:", clerkId);
  
  if (!clerkId) {
    debug('No clerkId provided');
    return null;
  }

  // Make sure we're in a server environment
  if (isBrowser) {
    console.error('getUserRoleFromDB called in browser environment');
    debug('ERROR: getUserRoleFromDB called in browser environment');
    return null;
  }

  try {
    debug(`Fetching role for user ${clerkId} from database`);
    
    // Find the user by their Clerk ID
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { role: true }
    });

    if (!user) {
      console.warn(`User with Clerk ID ${clerkId} not found in database`);
      debug(`User with Clerk ID ${clerkId} not found in database`);
      return null;
    }

    debug(`Found role in database: ${user.role}`);
    return user.role;
  } catch (error) {
    // Check if it's a Prisma browser error
    if (error instanceof Error && error.message.includes('PrismaClient is unable to run in this browser environment')) {
      console.error("Prisma browser environment error:", error.message);
      debug("Prisma browser environment error:", error.message);
      return null;
    }
    
    console.error("Error fetching user role from database:", error);
    debug("Error fetching user role from database:", error);
    return null;
  }
}

/**
 * Check if a user is an admin using database lookup
 * DOES NOT USE CACHING - Always checks database for fresh results
 * 
 * @param clerkId - The Clerk ID of the user
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export async function isAdminFromDB(clerkId: string): Promise<boolean> {
  debug("isAdminFromDB called with clerkId:", clerkId);
  
  if (!clerkId) {
    debug('No clerkId provided for admin check');
    return false;
  }

  // Make sure we're in a server environment
  if (isBrowser) {
    console.error('isAdminFromDB called in browser environment');
    debug('ERROR: isAdminFromDB called in browser environment');
    return false;
  }

  try {
    // Always query database directly - no caching
    debug("Querying database for admin role");
    const role = await getUserRoleFromDB(clerkId);
    const isAdmin = role === UserRole.ADMIN;
    
    debug(`Database admin check result for ${clerkId}: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    // Check if it's a Prisma browser error
    if (error instanceof Error && error.message.includes('PrismaClient is unable to run in this browser environment')) {
      console.error("Prisma browser environment error:", error.message);
      debug("Prisma browser environment error:", error.message);
      return false;
    }
    
    console.error(`Error checking admin status for ${clerkId}:`, error);
    debug(`Error checking admin status for ${clerkId}:`, error);
    return false;
  }
}

/**
 * Comprehensive admin check that prioritizes database check over JWT claims
 * 
 * This is the RECOMMENDED way to check for admin status in server components
 * 
 * Database is ALWAYS the source of truth. JWT claims are only used as fallback
 * if database check fails (connection issues, etc.).
 * 
 * @returns Promise<boolean> - True if user is an admin, false otherwise
 */
export async function isAdminComprehensive(): Promise<boolean> {
  debug("isAdminComprehensive called");
  
  // Make sure we're in a server environment
  if (isBrowser) {
    console.error('isAdminComprehensive called in browser environment');
    debug('ERROR: isAdminComprehensive called in browser environment');
    return false;
  }

  const { userId, sessionClaims } = auth();
  
  if (!userId) {
    debug('No userId found in auth context');
    return false;
  }
  
  // Cast sessionClaims to our helper type with proper type safety
  const typedClaims = sessionClaims as SessionClaims | undefined;
  debug("Session claims:", JSON.stringify(typedClaims, null, 2));
  
  try {
    // Database is primary source of truth - check it first and wait for response
    debug(`Performing primary database check for user ${userId}`);
    const isAdminInDB = await isAdminFromDB(userId);
    debug(`Database admin check result for ${userId}: ${isAdminInDB}`);
    
    // Database is the source of truth
    return isAdminInDB;
  } catch (error) {
    // If database check fails, fallback to JWT as secondary source
    debug(`Database check failed, falling back to JWT check`);
    const hasAdminInJWT = hasAdminRoleInJWT(typedClaims);
    
    if (hasAdminInJWT) {
      debug(`JWT shows admin role, using as fallback. User: ${userId}`);
      return true;
    }
    
    console.error("Error in comprehensive admin check:", error);
    debug("Error in comprehensive admin check:", error);
    return false;
  }
}

/**
 * Get current user's role from database
 * For use in server components only
 * 
 * @returns Promise<UserRole | null> - The user's role or null if not found
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  debug("getCurrentUserRole called");
  
  // Make sure we're in a server environment
  if (isBrowser) {
    console.error('getCurrentUserRole called in browser environment');
    debug('ERROR: getCurrentUserRole called in browser environment');
    return null;
  }

  const { userId } = auth();
  
  if (!userId) {
    debug('No userId found in auth context');
    return null;
  }
  
  return await getUserRoleFromDB(userId);
} 