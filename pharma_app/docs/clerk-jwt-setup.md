# Setting Up JWT Templates in Clerk for Role-Based Authorization

This guide will help you configure Clerk to include user roles directly in the JWT token claims, making role-based authorization simpler and more secure.

## Background

Currently, your application is accessing user roles via `auth.sessionClaims?.publicMetadata.role`, but this approach:
1. Requires extra processing in the middleware
2. Is not as secure as having the role directly in the JWT claims

## Step 1: Access Clerk Dashboard

1. Log in to your [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to **JWT Templates** in the left sidebar

## Step 2: Create or Edit JWT Template

1. If you don't have a template, click **Add New Template**
2. If you have an existing template, select it to edit

## Step 3: Add Role Claim

Add the following claim to your JWT template:

```json
{
  "role": "{{user.public_metadata.role}}"
}
```

This will include the user's role directly in the JWT claims, making it accessible via `auth().sessionClaims.role`.

## Step 4: Save and Publish Template

1. Click **Save Template**
2. Make sure the template is set as the active template

## Step 5: Test the Setup

After saving your JWT template:

1. Sign out any existing users
2. Sign in again to generate new JWTs with the updated template
3. Check the JWT claims by logging them to the console:

```typescript
const { sessionClaims } = auth();
console.log("Session claims:", sessionClaims);
```

## Accessing the Role in Code

Now you can access the role directly from the session claims:

```typescript
const { sessionClaims } = auth();
const role = sessionClaims?.role;

if (role === "ADMIN") {
  // Allow admin actions
} else {
  // Redirect or deny access
}
```

## Troubleshooting

If the role is not appearing in the sessionClaims:

1. Make sure the user has the role set in their publicMetadata
2. Sign out and sign in again to generate a fresh JWT
3. Check the JWT template in the Clerk dashboard for any syntax errors
4. Inspect the raw JWT token at [jwt.io](https://jwt.io) to verify the claims

## Security Benefits

Having the role as a direct claim in the JWT:

1. Follows security best practices
2. Simplifies authorization logic
3. Reduces the risk of authorization bugs
4. Makes role validation more efficient