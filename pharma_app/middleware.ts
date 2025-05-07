import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { publicRoutes, adminRoutes, DEBUG, hasAdminRoleInJWT } from "./lib/auth-config";
import { jwtVerify } from "jose";

// Custom debug logger
function debug(...messages: any[]) {
  if (DEBUG) {
    console.log('[AUTH MIDDLEWARE]', ...messages);
  }
}

// Type for session claims to fix TypeScript errors
interface SessionClaims {
  [key: string]: any;
  exp?: number;
  role?: string;
  publicMetadata?: {
    role?: string;
    [key: string]: any;
  }
}

// JWT token name
const JWT_TOKEN_NAME = '__clerk_db_jwt';

// Secret key for validating JWTs
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pharmaai-jwt-secret-key-change-in-production'
);

/**
 * Check if the custom role JWT indicates the user is an admin
 * This is faster than checking the database
 */
async function checkRoleJWT(req: Request): Promise<boolean> {
  try {
    // Get the token from cookies
    const cookies = req.headers.get('cookie') || '';
    const tokenMatch = cookies.match(new RegExp(`${JWT_TOKEN_NAME}=([^;]+)`));
    const token = tokenMatch ? tokenMatch[1] : null;
    
    if (!token) {
      debug('No role JWT found in cookies');
      return false;
    }
    
    try {
      // Verify the token
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        clockTolerance: 60 // Add 60 seconds of clock tolerance to handle small time differences
      });
      
      // Check if the payload indicates admin role
      const isAdmin = payload.role === 'ADMIN';
      
      debug(`Role JWT check: ${isAdmin ? 'Admin' : 'Not admin'}`);
      return isAdmin;
    } catch (jwtError) {
      // Log the specific JWT verification error but continue execution
      debug(`JWT verification error: ${jwtError.message}`);
      
      // For security, treat any token verification error as non-admin
      return false;
    }
  } catch (error) {
    debug(`Error checking role JWT: ${error}`);
    return false;
  }
}

export default authMiddleware({
  debug: false,
  publicRoutes,
  
  // Add custom redirection logic with enhanced debugging
  afterAuth: async (auth, req) => {
    const { sessionId, userId, isPublicRoute, isApiRoute } = auth;
    const isExactAdminRoute = req.nextUrl.pathname === "/admin"; // Only exact /admin route
    const isAdminSubRoute = req.nextUrl.pathname.startsWith("/admin/"); // Any sub-route under /admin
    
    const url = req.nextUrl.clone();
    let response: NextResponse | undefined;

    // Debug authentication state
    debug("URL:", req.nextUrl.pathname);
    debug("User:", userId || "Not signed in");
    debug("Session:", sessionId ? "Active" : "None");
    debug("Public route:", isPublicRoute);
    debug("Exact Admin route:", isExactAdminRoute);
    debug("Admin sub-route:", isAdminSubRoute);
    debug("API route:", isApiRoute);
    
    // Check for redirect loop by looking at the redirect attempt cookie
    const redirectAttempts = req.cookies.get('admin_redirect_attempts')?.value;
    const attemptCount = redirectAttempts ? parseInt(redirectAttempts) : 0;
    
    // Skip admin check for the admin-check API itself to avoid infinite loops
    const isAdminCheckRoute = req.nextUrl.pathname === '/api/admin-check';
    
    // User is not signed in
    if (!userId) {
      debug("No user signed in");
      
      // Redirect to sign-in for non-public routes
      if (!isPublicRoute) {
        debug("Redirecting to sign-in");
        url.pathname = "/sign-in";
        return NextResponse.redirect(url);
      }
      
      // Allow access to public routes
      debug("Allowing access to public route");
      return NextResponse.next();
    }
    
    // User is signed in
    debug("User is signed in", userId);
    
    // Get the user's claims to check role
    const typedClaims = auth.sessionClaims as SessionClaims | undefined;
    
    // Only check admin access for the exact /admin route
    if (isExactAdminRoute && !isAdminCheckRoute) {
      debug("Checking admin access for exact /admin route");
      
      // Check if too many redirects have happened
      if (attemptCount >= 3) {
        debug("Too many redirect attempts, allowing access to prevent loop");
        // Reset the counter
        const response = NextResponse.next();
        response.cookies.set('admin_redirect_attempts', '0', { path: '/' });
        return response;
      }
      
      // First check Clerk JWT for admin role (fastest)
      const hasAdminRole = hasAdminRoleInJWT(typedClaims);
      
      if (hasAdminRole) {
        // User has admin role in JWT, allow access
        debug("User has admin role in Clerk JWT, proceeding to admin route");
        // Reset the counter if we're allowing access
        const response = NextResponse.next();
        response.cookies.set('admin_redirect_attempts', '0', { path: '/' });
        return response;
      }
      
      // Then check our custom JWT (still fast, avoids database lookup)
      const hasAdminRoleInCustomJWT = await checkRoleJWT(req);
      
      if (hasAdminRoleInCustomJWT) {
        // User has admin role in custom JWT, allow access
        debug("User has admin role in custom JWT, proceeding to admin route");
        // Reset the counter if we're allowing access
        const response = NextResponse.next();
        response.cookies.set('admin_redirect_attempts', '0', { path: '/' });
        return response;
      }
      
      // No admin role in either JWT, redirect to admin-check API
      debug("No admin role in any JWT, redirecting to admin-check API");
      
      // Increment the redirect attempt counter
      const newAttemptCount = attemptCount + 1;
      const returnUrlEncoded = encodeURIComponent(req.nextUrl.pathname);
      const adminCheckUrl = new URL(`/api/admin-check?returnUrl=${returnUrlEncoded}`, req.url);
      const response = NextResponse.redirect(adminCheckUrl);
      response.cookies.set('admin_redirect_attempts', newAttemptCount.toString(), { path: '/' });
      
      return response;
    }
    
    // For admin sub-routes, allow access without any admin checks
    if (isAdminSubRoute) {
      debug("Admin sub-route detected, allowing access without admin checks");
      return NextResponse.next();
    }
    
    // Redirect from homepage, sign-in and sign-up
    if (userId && ["/", "/sign-in", "/sign-up"].includes(req.nextUrl.pathname)) {
      debug("Redirecting signed-in user from auth page to dashboard");
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    
    // Continue for all other cases
    debug("Proceeding to route", req.nextUrl.pathname);
    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}; 