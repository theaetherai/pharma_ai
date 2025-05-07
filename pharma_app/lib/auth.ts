import { compare, hash } from 'bcryptjs';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';

// Constants
const SALT_ROUNDS = 10;
const TOKEN_SECRET = process.env.JWT_SECRET || 'supersecretjwtsecret';
const TOKEN_EXPIRY = '8h';
const COOKIE_NAME = 'pharma_auth_token';

// Interfaces
export interface UserSession {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: UserSession;
}

// Function to hash a password
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

// Function to compare a password with a hash
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

// Function to register a new user
export async function registerUser(email: string, password: string, name?: string): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { success: false, message: 'User with this email already exists' };
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: UserRole.USER
      }
    });

    // Create a session
    return createSession(user);
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'An error occurred during registration' };
  }
}

// Function to login a user
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Find the user
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Check the password
    const passwordValid = await comparePassword(password, user.password);

    if (!passwordValid) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Create a session
    return createSession(user);
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An error occurred during login' };
  }
}

// Function to create a session for a user
async function createSession(user: any): Promise<AuthResult> {
  try {
    // Create session in the database
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 8); // 8 hours
    
    // Create a session
    const session = await db.session.create({
      data: {
        userId: user.id,
        expires,
        sessionToken: crypto.randomUUID()
      }
    });

    // Create JWT token
    const secret = new TextEncoder().encode(TOKEN_SECRET);
    const token = await new jose.SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(TOKEN_EXPIRY)
      .setIssuedAt()
      .sign(secret);

    // Set the cookie
    cookies().set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 hours
      sameSite: 'lax'
    });

    // Return the user session
    return {
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Session creation error:', error);
    return { success: false, message: 'An error occurred creating session' };
  }
}

// Function to logout a user
export function logout() {
  cookies().delete(COOKIE_NAME);
}

// Function to get the current user session
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const token = cookies().get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    // Verify the token
    const secret = new TextEncoder().encode(TOKEN_SECRET);
    
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      
      // Find the user
      const user = await (db as any).user.findUnique({
        where: { id: payload.sub as string }
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
    } catch (error) {
      // Token verification failed
      return null;
    }
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Middleware to check authentication
export async function checkAuth(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  return NextResponse.next();
}

// Middleware to check admin role
export async function checkAdmin(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  if (user.role !== UserRole.ADMIN) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Helper function to create an admin user (for bootstrapping)
export async function createAdminUser(email: string, password: string, name?: string): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { success: false, message: 'User with this email already exists' };
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: UserRole.ADMIN
      }
    });

    return {
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Admin creation error:', error);
    return { success: false, message: 'An error occurred during admin creation' };
  }
}  