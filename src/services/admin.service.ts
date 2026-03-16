import { auth } from "../config/firebase";

import { serviceHandler } from "../middleware/handler";

export async function setAdminClaim(uid: string, isAdmin: boolean) {
  // Keep any existing claims (optional)
  const user = await serviceHandler("GET USER", () => auth.getUser(uid));
  const current = user.customClaims ?? {};

  const nextClaims = {
    ...current,
    admin: isAdmin,
  };

  // If turning admin off, remove the claim entirely (cleaner)
  if (!isAdmin) {
    delete (nextClaims as any).admin;
  }

  await serviceHandler("SET ADMIN CLAIM", () => auth.setCustomUserClaims(uid, nextClaims));
}
