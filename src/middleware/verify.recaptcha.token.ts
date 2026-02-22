import type { Request, Response, NextFunction } from "express";

// Define your environment parameter
const RECAPTCHA_SECRET = "6LexsQksAAAAAO45-P9FQRAFvbrursuNucsmsD6S";

export const verifyRecaptchaToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recaptchaToken } = req.body;

    console.log("recaptchaToken", recaptchaToken);

    if (!recaptchaToken) {
      return res.status(400).json({ error: "Missing token" });
    }

    const secret = RECAPTCHA_SECRET;

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: recaptchaToken,
      }),
    });

    const data = (await response.json()) as any;

    console.log("Recaptcha verify result:", data);

    if (!data.success) {
      return res.status(403).json({
        error: "Captcha verification failed",
        details: data["error-codes"],
      });
    }

    next();
  } catch (err) {
    console.error("Recaptcha verification error:", err);
    return res.status(500).json({ error: "Captcha verification failed" });
  }
};
