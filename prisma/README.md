# Database Seeding

## Overview

The seed script (`seed.ts`) creates a SUPER_ADMIN user with the email specified in the `ADMIN_EMAIL` environment variable.

## Usage

### Run the seed script

```bash
npm run seed
```

Or use Prisma's built-in seeding (runs automatically after `prisma migrate reset`):

```bash
npx prisma db seed
```

## What it does

1. Checks if a user with the admin email already exists
2. If the user exists:
   - Updates their role to SUPER_ADMIN (if not already set)
3. If the user doesn't exist:
   - Creates a new user with:
     - Email: from `ADMIN_EMAIL` env variable
     - Role: SUPER_ADMIN
     - Name: "Super Admin"
     - Email verified: true (so they can login immediately)

## Environment Variables Required

Make sure `ADMIN_EMAIL` is set in your `.env` file:

```env
ADMIN_EMAIL="your-admin-email@example.com"
```

## Login Flow

The admin user can login through NextAuth's email provider:

1. Go to the login page
2. Enter the admin email
3. Click the magic link sent to the email
4. The user will be logged in with SUPER_ADMIN role

The NextAuth callback ensures that the admin email always maintains SUPER_ADMIN role on every login.
