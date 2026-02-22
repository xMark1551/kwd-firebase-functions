import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";

export function requireAuth<T = any>(request: CallableRequest<T>) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in");
  }

  return {
    uid: request.auth.uid,
    token: request.auth.token, // includes custom claims
  };
}

export function requireAdmin<T = any>(request: CallableRequest<T>) {
  const { uid, token } = requireAuth(request);

  if (token.admin !== true) {
    throw new HttpsError("permission-denied", "Admin access required");
  }

  return { uid, token };
}

export function requireSuperAdmin<T = any>(request: CallableRequest<T>) {
  const { uid, token } = requireAuth(request);

  if (token.superadmin !== true) {
    throw new HttpsError("permission-denied", "Superadmin access required");
  }

  return { uid, token };
}
