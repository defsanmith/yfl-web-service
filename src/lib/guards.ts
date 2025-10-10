import { auth } from "@/auth";
import Router from "@/constants/router";
import { Role } from "@/generated/prisma";
import { redirect } from "next/navigation";

/**
 * Require user to be authenticated
 * Redirects to sign in page if not authenticated
 *
 * @returns The authenticated session
 *
 * @example
 * ```tsx
 * export default async function ProtectedPage() {
 *   const session = await requireAuth();
 *   return <div>Hello {session.user.email}</div>;
 * }
 * ```
 */
export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect(Router.SIGN_IN);
  }
  return session;
}

/**
 * Require user to have one of the specified roles
 * Redirects to sign in if not authenticated, or to /unauthorized if user doesn't have required role
 *
 * @param allowedRoles - Array of roles that are allowed to access the resource
 * @returns The authenticated session with verified role
 *
 * @example
 * ```tsx
 * export default async function AdminPage() {
 *   const session = await requireRole([Role.SUPER_ADMIN, Role.ORG_ADMIN]);
 *   return <div>Admin Content</div>;
 * }
 * ```
 */
export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    redirect(Router.UNAUTHORIZED);
  }

  return session;
}

/**
 * Require user to be a super admin
 * Redirects to sign in if not authenticated, or to /unauthorized if not super admin
 *
 * @returns The authenticated session
 *
 * @example
 * ```tsx
 * export default async function SuperAdminPage() {
 *   await requireSuperAdmin();
 *   return <div>Super Admin Content</div>;
 * }
 * ```
 */
export async function requireSuperAdmin() {
  return requireRole([Role.SUPER_ADMIN]);
}

/**
 * Require user to be an admin (super admin or org admin)
 * Redirects to sign in if not authenticated, or to /unauthorized if not an admin
 *
 * @returns The authenticated session
 *
 * @example
 * ```tsx
 * export default async function AdminPage() {
 *   await requireAdmin();
 *   return <div>Admin Content</div>;
 * }
 * ```
 */
export async function requireAdmin() {
  return requireRole([Role.SUPER_ADMIN, Role.ORG_ADMIN]);
}
