/**
 * Central configuration file for authentication routes and settings
 * Used across middleware, layouts, and server components
 * 
 * ADMIN ROLE FLOW:
 * 1. When a user accesses an admin route, middleware checks JWT claims via hasAdminRoleInJWT()
 * 2. If JWT claims show admin role, access is granted
 * 3. If not in JWT, middleware redirects to admin-check API which checks database
 * 4. The admin-check API updates JWT claims to match database role
 * 5. As a final verification, admin layout component performs a comprehensive check
 *    using isAdminComprehensive() which combines JWT and database checks
 */

// List of public routes that don't require authentication
export const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/sign-in/sso-callback", 
  "/sign-up/sso-callback",
  "/api/auth/clerk",
  "/api/webhook",
  "/api/chat",
  "/api/diagnose",
  "/api/prescriptions",
  "/api/save-prescription",
  "/api/verify-payment"
];

// List of admin routes that require admin role
export const adminRoutes = [
  "/admin",
  "/admin/drugs",
  "/admin/orders",
  "/admin/prescriptions",
  "/admin/notifications",
  "/admin/settings"
];

// Debug settings
export const DEBUG = true;

export type UserRole = "ADMIN" | "USER";

// This interface is intentionally exported to be used by other modules
export interface SessionClaims {
  [key: string]: any;
  role?: string;
  publicMetadata?: {
    role?: string;
    [key: string]: any;
  }
}

/**
 * Helper function to check if a user has admin role based on JWT claims
 * This is the FASTEST method to check admin status since it doesn't require database access
 * Used in middleware for quick auth decisions and as first check in server components
 * 
 * IMPORTANT: This function works in both client and server components
 * 
 * @param sessionClaims - The session claims from auth() function
 * @returns boolean - True if user has ADMIN role in JWT, false otherwise
 */
export function hasAdminRoleInJWT(sessionClaims?: SessionClaims): boolean {
  if (!sessionClaims) return false;
  
  // Check direct role claim
  const directRole = sessionClaims.role;
  if (directRole === "ADMIN") return true;
  
  // Check publicMetadata role
  const metadataRole = sessionClaims.publicMetadata?.role;
  if (metadataRole === "ADMIN") return true;
  
  return false;
} 