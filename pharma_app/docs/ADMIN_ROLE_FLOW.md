# Admin Role Authentication Flow

This document explains the admin role verification flow in the PharmaAI application.

## Overview

The application uses a multi-layered approach to verify admin access, balancing performance and security:

1. **Middleware Layer** - First line of defense (fast but less secure)
2. **API Middleware** - Specialized for admin API routes (configurable security)
3. **Admin Layout** - Final verification layer (most secure, database-driven)

## Authentication Components

### 1. JWT-based Admin Check (`hasAdminRoleInJWT`)

- **Location**: `lib/auth-config.ts`
- **Purpose**: Quick admin verification without database access
- **How it works**: Checks JWT claims for admin role in `role` or `publicMetadata.role`
- **Performance**: Very fast (no database queries)
- **Security Level**: Basic (JWT could be stale)

### 2. Database Admin Check (`isAdminFromDB`)

- **Location**: `lib/db-auth.ts`
- **Purpose**: Authoritative admin verification from database
- **How it works**: Queries database for user's role with caching
- **Performance**: Moderate (database query with caching)
- **Security Level**: High (source of truth)

### 3. Comprehensive Admin Check (`isAdminComprehensive`)

- **Location**: `lib/db-auth.ts` 
- **Purpose**: Complete admin verification combining JWT and database
- **How it works**: Checks JWT first, then always verifies with database
- **Performance**: Moderate (requires database access)
- **Security Level**: Highest (always checks database as source of truth)

## Security Flow in Detail

### Middleware (`middleware.ts`)

When a user attempts to access an admin route:

1. First checks JWT claims using `hasAdminRoleInJWT`
2. If JWT doesn't show admin role, checks database using `isAdminFromDB`
3. If neither check passes, redirects to dashboard
4. If either check passes, allows access to proceed

### Admin API Middleware (`app/api/admin/middleware.ts`)

Configurable middleware for admin API routes:

- **Default**: Checks both JWT and database, passes if either shows admin
- **High Security**: Set `requireBoth: true` to require admin in both JWT and DB
- **Performance Mode**: Set `checkDatabase: false` to only check JWT (less secure)

### Admin Layout (`app/admin/layout.tsx`)

Final verification layer for all admin UI routes:

1. Always performs comprehensive check using `isAdminComprehensive()`
2. Always checks database regardless of JWT status
3. If not admin in database, redirects to dashboard
4. Serves as final security layer even if middleware allowed access

## Flow Diagram

```
User Access Request → JWT Check → Database Check → Allow/Deny Access
                    ↓              ↓                ↓
                Admin in JWT?   Admin in DB?     Access Decision
```

## Best Practices

1. **API Security**: Use `adminApiMiddleware` with appropriate options based on sensitivity
2. **New Admin Routes**: Add to `adminRoutes` array in `lib/auth-config.ts`
3. **Database as Truth**: Always consider database as the source of truth for roles
4. **JWT Updates**: When changing roles, update JWT claims to match database

## Performance Considerations

The system uses caching to minimize database queries:

- In-memory cache in `isAdminFromDB` reduces database load
- JWT checks first to avoid database queries when possible
- Database checks only when necessary or for critical operations 