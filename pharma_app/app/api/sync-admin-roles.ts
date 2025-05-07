import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import 'server-only';

/**
 * API endpoint to synchronize admin roles between Clerk (JWT) and the database
 * This helps keep admin roles consistent across both systems
 */
export async function POST(req: NextRequest) {
  try {
    // Only allow authenticated users
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify current user is an admin in the database
    const currentUser = await db.user.findUnique({
      where: { clerkId: authUserId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only admins can synchronize roles' },
        { status: 403 }
      );
    }

    // Parse request body to get the user's Clerk ID
    const { clerkUserId, setAsAdmin } = await req.json();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Missing clerkUserId parameter' },
        { status: 400 }
      );
    }

    // First, get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Update role in database
    const newRole = setAsAdmin ? UserRole.ADMIN : UserRole.USER;
    await db.user.update({
      where: { clerkId: clerkUserId },
      data: { role: newRole }
    });

    // Update role in Clerk metadata
    await clerkClient.users.updateUser(clerkUserId, {
      publicMetadata: {
        role: newRole
      }
    });

    return NextResponse.json({
      success: true,
      message: `User ${clerkUserId} role updated to ${newRole} in both database and Clerk`,
      user: {
        id: dbUser.id,
        clerkId: dbUser.clerkId,
        role: newRole
      }
    });
  } catch (error) {
    console.error('Error syncing admin role:', error);
    return NextResponse.json(
      { error: 'Failed to sync admin role' },
      { status: 500 }
    );
  }
}

/**
 * Get the current admin role status for a user from both Clerk and database
 */
export async function GET(req: NextRequest) {
  try {
    // Only allow authenticated users
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify current user is an admin in the database
    const currentUser = await db.user.findUnique({
      where: { clerkId: authUserId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only admins can view role status' },
        { status: 403 }
      );
    }

    // Get the target user's Clerk ID from query params
    const clerkUserId = req.nextUrl.searchParams.get('clerkUserId');
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Missing clerkUserId parameter' },
        { status: 400 }
      );
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true, clerkId: true, role: true, email: true, name: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const clerkRole = clerkUser.publicMetadata?.role || 'Unknown';

    return NextResponse.json({
      user: {
        ...dbUser,
        clerkRole,
        isInSync: dbUser.role === clerkRole
      }
    });
  } catch (error) {
    console.error('Error getting admin role status:', error);
    return NextResponse.json(
      { error: 'Failed to get admin role status' },
      { status: 500 }
    );
  }
} 