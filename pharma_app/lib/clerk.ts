import { auth } from "@clerk/nextjs";
import { ClerkUser } from "@/types/clerk";
import { isCurrentUserAdmin } from "./db-admin";
import 'server-only';

// Enable debug logging
const DEBUG = true;

// Custom debug logger
function debug(...messages: any[]) {
  if (DEBUG) {
    console.log('[CLERK-LIB]', ...messages);
  }
}

export async function getCurrentUser() {
  const { userId, sessionClaims } = auth();
  
  if (!userId) {
    debug('No userId found in auth context');
    return null;
  }
  
  // Handle both formats: direct role claim or nested in publicMetadata
  // This ensures compatibility whether JWT template is active or not
  const role = sessionClaims?.role || 
               (sessionClaims?.publicMetadata as { role?: string })?.role;
  
  debug(`Current user info: userId=${userId}, role=${role || 'undefined'}`);
  
  return {
    userId,
    role,
    publicMetadata: sessionClaims?.publicMetadata,
    privateMetadata: sessionClaims?.privateMetadata
  };
}

/**
 * Primary function to check if current user is an admin
 * Uses the database as the source of truth
 * Now uses direct function call rather than cached version
 */
export async function isAdmin() {
  try {
    debug('Checking if current user is admin via database');
    return await isCurrentUserAdmin();
  } catch (error) {
    debug('Error in isAdmin check:', error);
    return false;
  }
} 