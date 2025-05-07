'use server';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getUserRoleFromDB } from './db-auth';
import { DEBUG } from './auth-config';

// Secret key for signing JWTs - in production, use a strong secret from environment variables
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pharmaai-jwt-secret-key-change-in-production'
);

// Custom JWT token name
const JWT_TOKEN_NAME = '__clerk_db_jwt';

// Debug logger
function debug(...messages: any[]) {
  if (DEBUG) {
    console.log('[JWT-UTILS]', ...messages);
  }
}

// Interface for our JWT payload
interface JWTPayload {
  sub: string;         // Subject (user ID)
  role: string;        // User role from database
  iat: number;         // Issued at
  exp: number;         // Expiration time
  nbf: number;         // Not before
}

/**
 * Creates a custom JWT with role information from the database
 * This solves the issue of Clerk JWTs not including roles
 * 
 * @param userId - The Clerk user ID
 * @returns The JWT token string or null if creation failed
 */
export async function createRoleJWT(userId: string): Promise<string | null> {
  try {
    debug(`Creating role JWT for user ${userId}`);
    
    // Get the user's role from database
    const role = await getUserRoleFromDB(userId);
    
    if (!role) {
      debug(`No role found for user ${userId}`);
      return null;
    }
    
    debug(`Found role for user ${userId}: ${role}`);
    
    // Current time in seconds
    const now = Math.floor(Date.now() / 1000);
    
    // Create the JWT token
    const token = await new SignJWT({ role })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt(now)
      .setExpirationTime(now + 86400 * 30) // 30 days expiration
      .setNotBefore(now)
      .sign(JWT_SECRET);
    
    debug(`JWT created successfully for user ${userId}`);
    return token;
  } catch (error) {
    console.error('Error creating role JWT:', error);
    debug(`Error creating role JWT: ${error}`);
    return null;
  }
}

/**
 * Store the custom JWT in a cookie
 * 
 * @param token - The JWT token string
 */
export async function storeRoleJWT(token: string): Promise<void> {
  try {
    debug('Storing role JWT in cookie');
    
    // Store the token as an HTTP-only cookie
    cookies().set(JWT_TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    
    debug('JWT stored successfully');
  } catch (error) {
    console.error('Error storing role JWT:', error);
    debug(`Error storing role JWT: ${error}`);
  }
}

/**
 * Verify and decode the custom JWT from the cookie
 * 
 * @returns The decoded JWT payload or null if invalid/missing
 */
export async function verifyRoleJWT(): Promise<JWTPayload | null> {
  try {
    // Get the token from the cookie
    const token = cookies().get(JWT_TOKEN_NAME)?.value;
    
    if (!token) {
      debug('No JWT token found in cookies');
      return null;
    }
    
    try {
      // Verify the token with clock tolerance
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        clockTolerance: 60 // Add 60 seconds of clock tolerance
      });
      
      debug('JWT verified successfully');
      return payload as unknown as JWTPayload;
    } catch (jwtError: any) {
      // Log the specific JWT error
      debug(`JWT verification failed: ${jwtError.message}`);
      return null;
    }
  } catch (error) {
    console.error('Error verifying role JWT:', error);
    debug(`Error verifying role JWT: ${error}`);
    return null;
  }
}

/**
 * Get the user's role from the custom JWT, or from the database if JWT is missing/invalid
 * 
 * @param userId - The Clerk user ID
 * @returns The user's role or null if not found
 */
export async function getUserRoleFromJWT(userId: string): Promise<string | null> {
  try {
    debug(`Getting role from JWT for user ${userId}`);
    
    // Try to get role from JWT first
    const payload = await verifyRoleJWT();
    
    // If JWT is valid and matches the current user
    if (payload && payload.sub === userId) {
      debug(`Found role in JWT: ${payload.role}`);
      
      // Check if the JWT is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp > now) {
        debug(`JWT is still valid, using cached role`);
        return payload.role;
      } else {
        debug(`JWT is expired, will create a new one`);
      }
    }
    
    // If JWT is invalid, missing, or expired, create a new one
    debug(`Creating new JWT for user ${userId}`);
    const role = await getUserRoleFromDB(userId);
    
    if (role) {
      // Create and store a new JWT
      const token = await createRoleJWT(userId);
      if (token) {
        await storeRoleJWT(token);
      }
      
      debug(`Created new JWT with role: ${role}`);
      return role;
    }
    
    debug(`No role found for user ${userId}`);
    return null;
  } catch (error) {
    console.error('Error getting role from JWT:', error);
    debug(`Error getting role from JWT: ${error}`);
    return null;
  }
} 