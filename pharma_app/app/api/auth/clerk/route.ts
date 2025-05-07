import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

type EventType = 'user.created' | 'user.updated' | 'user.deleted';

interface WebhookEvent {
  data: {
    id: string;
    email_addresses: Array<{
      id: string;
      email_address: string;
    }>;
    primary_email_address_id: string;
    first_name?: string;
    last_name?: string;
  };
  type: EventType;
}

// Webhook handler for Clerk events
export async function POST(request: Request) {
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  const payload = await request.json();
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  // Create a new Svix webhook instance with the webhook secret
  const webhook = new Webhook(webhookSecret);

  let event: WebhookEvent;
  try {
    // Verify the webhook payload
    event = webhook.verify(JSON.stringify(payload), {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return new NextResponse("Error verifying webhook", { status: 400 });
  }

  const { id, email_addresses, first_name, last_name } = event.data;
  const eventType = event.type;

  console.log(`Processing ${eventType} event for user ${id}`);

  if (eventType === "user.created" || eventType === "user.updated") {
    // Get the primary email address
    const primaryEmail = email_addresses.find(email => email.id === event.data.primary_email_address_id);
    
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

      // For new users
      if (!existingUser && eventType === "user.created") {
        console.log(`Creating new user with email ${primaryEmail.email_address} and Clerk ID ${id}`);
        
        // Create complete user data including clerkId
        const userData = {
          email: primaryEmail.email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
          role: UserRole.USER,
          // Empty password for OAuth users
          password: '',
          // Important: Include the Clerk ID
          clerkId: id
        };
        
        // Create the user with all data including clerkId
        const newUser = await db.user.create({
          data: userData
        });
        
        console.log(`Created new user with ID ${newUser.id} and Clerk ID ${newUser.clerkId}`);
        return NextResponse.json({ 
          success: true,
          message: "User created successfully", 
          userId: newUser.id 
        });
      }
      // For existing users that need updating
      else if (existingUser) {
        console.log(`Updating existing user ${existingUser.id} with Clerk ID ${id}`);
        
        // Update user with clerkId and other fields
        const updatedUser = await db.user.update({
          where: { id: existingUser.id },
          data: {
            email: primaryEmail.email_address,
            name: `${first_name || ''} ${last_name || ''}`.trim() || existingUser.name,
            // Ensure clerkId is set in case it was missing
            clerkId: id
          }
        });
        
        console.log(`Updated user ${updatedUser.id} with Clerk ID ${updatedUser.clerkId}`);
        return NextResponse.json({ 
          success: true, 
          message: "User updated successfully",
          userId: updatedUser.id
        });
      }

      return NextResponse.json({ success: true, message: "No action needed" });
    } catch (error) {
      console.error("Database error:", error);
      return new NextResponse("Error updating user database", { status: 500 });
    }
  }

  // Handle user.deleted event
  if (eventType === "user.deleted") {
    try {
      // Find user by Clerk ID
      const existingUser = await db.user.findUnique({
        where: { clerkId: id }
      });
      
      if (existingUser) {
        console.log(`Handling user deletion for Clerk ID ${id}`);
        // You could either delete the user or mark them as inactive
        
        // Option 1: Delete the user
        // await db.user.delete({ where: { id: existingUser.id } });
        
        // Option 2: Mark as inactive or update status (safer)
        await db.user.update({
          where: { id: existingUser.id },
          data: {
            // Set clerkId to null to indicate this user is no longer linked
            clerkId: null
          }
        });
        
        return NextResponse.json({ success: true, message: "User unlinked successfully" });
      }
    } catch (error) {
      console.error("Error processing user deletion:", error);
      return new NextResponse("Error processing user deletion", { status: 500 });
    }
  }

  // Handle other event types
  return NextResponse.json({ success: true });
} 