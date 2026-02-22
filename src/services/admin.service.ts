import { auth } from "../config/firebase";

export async function setAdminClaim(uid: string, isAdmin: boolean) {
  // Keep any existing claims (optional)
  const user = await auth.getUser(uid);
  const current = user.customClaims ?? {};

  const nextClaims = {
    ...current,
    admin: isAdmin,
  };

  // If turning admin off, remove the claim entirely (cleaner)
  if (!isAdmin) {
    delete (nextClaims as any).admin;
  }

  await auth.setCustomUserClaims(uid, nextClaims);
}

export async function setSuperAdminClaim(uid: string, isSuper: boolean) {
  const user = await auth.getUser(uid);
  const current = user.customClaims ?? {};

  const nextClaims = {
    ...current,
    superadmin: isSuper,
  };

  if (!isSuper) {
    delete (nextClaims as any).superadmin;
  }

  await auth.setCustomUserClaims(uid, nextClaims);
}

/**
 * IMPORTANT: After changing claims, user must refresh token to receive new claims.
 * Easiest: sign out + sign in.
 */
