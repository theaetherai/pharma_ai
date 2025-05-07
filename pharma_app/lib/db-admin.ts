import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { DEBUG } from "./auth-config";
import 'server-only';

// Custom debug logger
function debug(...messages: any[]) {
  if (DEBUG) {
    console.log('[DB-ADMIN]', ...messages);
  }
}

// In-memory cache for admin status to avoid excessive database queries
// This cache is shared across all requests to this Lambda instance
const adminCache = new Map<string, { isAdmin: boolean, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * IMPORTANT: This file MUST NOT be imported in middleware or client components.
 * It contains Prisma database access that can only run in server components.
 */

/**
 * Get user role from the database using Clerk ID
 * This function is exported for use in other server components
 */
export async function getUserRoleFromDB(clerkId: string): Promise<UserRole | null> {
  if (!clerkId) {
    debug('No clerkId provided');
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
      return null;
    }

    debug(`Found role in database: ${user.role}`);
    return user.role;
  } catch (error) {
    console.error("Error fetching user role from database:", error);
    return null;
  }
}

/**
 * Check if a user is an admin using database lookup
 * Uses caching to minimize database queries
 */
export async function isAdminFromDB(clerkId: string): Promise<boolean> {
  if (!clerkId) {
    debug('No clerkId provided for admin check');
    return false;
  }

  try {
    // Check cache first
    const cachedValue = adminCache.get(clerkId);
    const now = Date.now();
    
    if (cachedValue && (now - cachedValue.timestamp < CACHE_TTL)) {
      debug(`Using cached admin status for ${clerkId}: ${cachedValue.isAdmin}`);
      return cachedValue.isAdmin;
    }
    
    // If not in cache or expired, query database
    const role = await getUserRoleFromDB(clerkId);
    const isAdmin = role === UserRole.ADMIN;
    
    // Update cache
    adminCache.set(clerkId, { isAdmin, timestamp: now });
    
    debug(`Database admin check result for ${clerkId}: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    console.error(`Error checking admin status for ${clerkId}:`, error);
    return false;
  }
}

/**
 * Function to check if current user is admin
 * WARNING: This can ONLY be used in server components, never in middleware
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { userId } = auth();
    
    if (!userId) {
      debug('No userId found in auth context for admin check');
      return false;
    }
    
    const isAdmin = await isAdminFromDB(userId);
    debug(`Current user (${userId}) admin check result: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    console.error('Error in isCurrentUserAdmin:', error);
    return false;
  }
} 