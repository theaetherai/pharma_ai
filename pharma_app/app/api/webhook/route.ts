import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { DEBUG } from "@/lib/auth-config";

type EventType = 'user.created' | 'user.updated' | 'user.deleted';

// Custom debug logger
function debug(...messages: any[]) {
  if (DEBUG) {
    console.log('[WEBHOOK]', ...messages);
  }
}

/**
 * Webhook endpoint that receives events from Clerk
 * This ensures user roles stay in sync between Clerk and database
 */
export async function POST(request: Request) {
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return new NextResponse("Server Error", { status: 500 });
  }

  // Verify the webhook signature
  let payload;
  try {
    const body = await request.text();
    const wh = new Webhook(WEBHOOK_SECRET);
    payload = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return new NextResponse("Error verifying webhook", { status: 400 });
  }

  // Extract the event type and data
  const { type, data } = payload;
  const eventType = type as EventType;
  debug(`Webhook received: ${eventType}`);

  // Extract user data from the payload
  const {
    id, // Clerk user ID
    email_addresses,
    public_metadata,
    first_name,
    last_name,
  } = data;

  // Process user events to keep roles in sync
  if (eventType === "user.created" || eventType === "user.updated") {
    // Get the primary email address
    const primaryEmail = email_addresses.find(email => email.id === data.primary_email_address_id);
    
    if (!primaryEmail) {
      return new NextResponse("Primary email not found", { status: 400 });
    }

    try {
      // First check if user already exists with this Clerk ID
      let existingUser = await db.user.findUnique({
        where: { clerkId: id }
      });
      
      // If not found by clerkId, try by email
      if (!existingUser) {
        existingUser = await db.user.findUnique({
          where: { email: primaryEmail.email_address }
        });
      }

      // Handle role synchronization
      const clerkRole = public_metadata?.role as UserRole || UserRole.USER;
      
      // For new users
      if (!existingUser && eventType === "user.created") {
        debug(`Creating new user: ${primaryEmail.email_address} (${id}) with role ${clerkRole}`);
        
        await db.user.create({
          data: {
            email: primaryEmail.email_address,
            name: `${first_name || ''} ${last_name || ''}`.trim() || null,
            role: clerkRole,
            password: '',
            clerkId: id
          }
        });
        
        return NextResponse.json({ success: true, message: "User created" });
      }
      
      // For existing users - update role if it changed
      if (existingUser) {
        if (existingUser.role !== clerkRole) {
          debug(`Updating user ${id} role from ${existingUser.role} to ${clerkRole}`);
          
          await db.user.update({
            where: { id: existingUser.id },
            data: { 
              role: clerkRole,
              clerkId: id // Ensure clerkId is set if found by email
            }
          });
          
          return NextResponse.json({ success: true, message: "User role updated" });
        }
        
        // If the role is already in sync, just ensure clerkId is set
        if (!existingUser.clerkId) {
          await db.user.update({
            where: { id: existingUser.id },
            data: { clerkId: id }
          });
          
          return NextResponse.json({ success: true, message: "User clerkId updated" });
        }
      }
      
      // No changes needed
      return NextResponse.json({ success: true, message: "No changes required" });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new NextResponse("Error processing webhook", { status: 500 });
    }
  }

  // Handle user deletions
  if (eventType === "user.deleted") {
    try {
      // Mark user as deleted in our database but don't actually delete
      const existingUser = await db.user.findUnique({
        where: { clerkId: id }
      });

      if (existingUser) {
        debug(`User ${id} deleted in Clerk, updating local DB`);
        
        // Optional: update the user or mark as deleted
        // await db.user.update({
        //   where: { clerkId: id },
        //   data: { isActive: false }
        // });
      }

      return NextResponse.json({ success: true, message: "User deletion handled" });
    } catch (error) {
      console.error("Error handling user deletion:", error);
      return new NextResponse("Error handling user deletion", { status: 500 });
    }
  }

  // Default response for unhandled event types
  return NextResponse.json({ success: true, message: "Webhook received" });
} 