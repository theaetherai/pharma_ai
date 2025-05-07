# Setting Up Admin Users in PharmaAI

This document explains how to set up and manage admin users in the PharmaAI application.

## Admin Role Authentication Flow

The application uses a database-first approach to verify admin access:

1. **Middleware Layer** - Primary checkpoint
   - Checks database directly as the source of truth
   - Only falls back to JWT claims if database access fails
   - No caching - always fetches fresh database records
   - Redirects to dashboard if user is not an admin

2. **Admin Layout** - Final security layer
   - Always checks database directly as source of truth
   - Only falls back to JWT claims if database access fails
   - Provides defense-in-depth with database as authority

3. **JWT Claims**
   - Used only as fallback when database checks fail
   - Always updated to match database via admin-check API
   - Never prioritized over direct database verification

This approach ensures the database is always the source of truth with no stale cached data.

## Setting Up an Admin User

There are two main ways to set up an admin user:

### Option 1: Using the create-admin-user script (preferred)

1. Run the script to create an admin user:
   ```bash
   node scripts/create-admin-user.js
   ```

2. This creates a user with:
   - Email: admin@pharmaai.com
   - Password: Admin123!
   - Role: ADMIN

3. Associate this user with a Clerk ID:
   ```bash
   node scripts/associate-clerk-id.js admin@pharmaai.com your_clerk_id
   ```
   Replace `your_clerk_id` with your Clerk user ID.

### Option 2: Manually updating a user's role in the database

1. Find the user you want to make an admin in the database:
   ```sql
   SELECT * FROM "User" WHERE email = 'user@example.com';
   ```

2. Update the user's role to ADMIN:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'user@example.com';
   ```

## Syncing JWT Claims

The system will automatically update JWT claims to match the database:

1. Visit the admin-check API directly to force JWT claims update:
   ```
   /api/admin-check?returnUrl=/admin/dashboard
   ```

2. This endpoint will:
   - Check your database role (primary source of truth)
   - Always update your JWT claims to match database
   - Redirect you based on database role only

## Troubleshooting Admin Access

If you're having trouble accessing admin routes:

1. Ensure the user exists in the database:
   ```bash
   node scripts/create-admin-user.js
   ```

2. Make sure the user's Clerk ID is correctly associated:
   ```bash
   node scripts/associate-clerk-id.js admin@pharmaai.com your_clerk_id
   ```

3. Clear browser cookies and cache, then sign in again.

4. Visit `/api/admin-check` to manually force sync your JWT claims with the database.

## Common Issues

### "PrismaClient is unable to run in this browser environment"

This error occurs when Prisma code tries to run in the browser. All database operations are now properly restricted to server components.

### User not found in database

Make sure the Clerk ID associated with your account matches the one in the database. Use the associate-clerk-id.js script to set it correctly.

### Database Connection Issues

If the database is temporarily unavailable, the system will fall back to JWT claims as a backup. Once database connectivity is restored, the system will revert to using the database as the source of truth. 