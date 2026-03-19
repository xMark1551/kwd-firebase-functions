import { auth } from "../config/firebase";

import { logService, LogService } from "./logger.service";
import { activityLogService } from "./activity.log.service";

import type { LoginInput } from "../validation/auth.schema";
import type { User } from "../validation/auth.schema";

export class AuthService {
  constructor(private readonly logger: LogService) {}

  async signIn(credentials: LoginInput) {
    const { email, password } = credentials;

    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    );

    return firebaseRes;
  }

  async login(query: LoginInput) {
    // 1. Sign in
    const result = await this.signIn(query);

    const data = (await result.json()) as any;
    if (!result.ok) throw new Error(data.error.message);

    // 2. Create a custom token so frontend can restore auth state
    const customToken = await auth.createCustomToken(data.localId);

    // 3. Check if user is admin
    const userRecord = await auth.getUser(data.localId);
    const isAdmin = !!userRecord.customClaims?.admin;

    const user: User = {
      admin: isAdmin,
      uid: data.localId,
      email: data.email,
      username: data.displayName ?? "",
      customToken: customToken,
    };

    // 3. Create activity log
    await activityLogService.success("LOGIN", {
      snapshot: {
        context: {
          name: user.username,
          email: user.email,
        },
      },
    });

    return user;
  }
}

export const authService = new AuthService(logService.withContext("auth"));
