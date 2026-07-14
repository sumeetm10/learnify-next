import { Resend } from "resend";

// Construct the client lazily. Building it at module load would throw during
// `next build` if RESEND_API_KEY isn't set (e.g. on Vercel before the env var
// is added), which would fail the whole build. This defers that to send-time.
function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

// Sender address. With a verified domain on Resend, use something like
// "Learnify <noreply@yourdomain.com>". Without a domain, Resend's test sender
// only delivers to your own account email.
const FROM = process.env.EMAIL_FROM || "Learnify <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string | null
): Promise<void> {
  const link = `${APP_URL}/api/auth/verify?token=${token}`;
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Verify your email — Learnify",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #427da6; font-size: 24px; margin-bottom: 8px;">Learnify</h1>
        <p style="font-size: 16px; color: #333;">Hi ${name || "there"},</p>
        <p style="font-size: 16px; color: #333;">
          Thanks for registering. Please confirm your email address to activate your account.
        </p>
        <a href="${link}"
           style="display: inline-block; background: #427da6; color: #fff; text-decoration: none;
                  padding: 12px 28px; border-radius: 9999px; font-weight: 600; margin: 20px 0;">
          Verify Email
        </a>
        <p style="font-size: 13px; color: #888;">
          Or paste this link into your browser:<br>
          <a href="${link}" style="color: #427da6;">${link}</a>
        </p>
        <p style="font-size: 13px; color: #888;">This link expires in 24 hours.</p>
      </div>
    `,
  });
}
