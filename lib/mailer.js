import "server-only";
import nodemailer from "nodemailer";

function getBaseUrl() {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");

  if (!baseUrl) {
    throw new Error("NEXTAUTH_URL or NEXT_PUBLIC_APP_URL must be configured to send authentication email.");
  }

  return baseUrl.replace(/\/$/, "");
}

function getMailerTransport() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    if (process.env.NODE_ENV !== "production") {
      return null;
    }

    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD are required in production.");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

function sendOrLogEmail({ email, subject, html, fallbackMessage }) {
  const transporter = getMailerTransport();

  if (!transporter) {
    console.log(`${fallbackMessage} for ${email}`);
    return;
  }

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail({ email, token }) {
  const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;
  await sendOrLogEmail({
    email,
    subject: "Reset your EchoFind password",
    fallbackMessage: `Password reset link: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1f2937;">Reset your EchoFind password</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          We received a request to reset your password. Use the button below to choose a new one.
        </p>
        <p style="margin: 24px 0;">
          <a
            href="${resetUrl}"
            style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700;"
          >
            Reset Password
          </a>
        </p>
        <p style="color: #6b7280; line-height: 1.6;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendEmailVerificationEmail({ email, token }) {
  const verificationUrl = `${getBaseUrl()}/api/auth/verify-email?token=${token}`;

  await sendOrLogEmail({
    email,
    subject: "Verify your EchoFind email",
    fallbackMessage: `Email verification link: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1f2937;">Verify your EchoFind email</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Confirm this email address to finish creating your EchoFind account.
        </p>
        <p style="margin: 24px 0;">
          <a
            href="${verificationUrl}"
            style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700;"
          >
            Verify Email
          </a>
        </p>
        <p style="color: #6b7280; line-height: 1.6;">
          This link expires in 24 hours. If you did not create an EchoFind account, you can ignore this email.
        </p>
      </div>
    `,
  });
}
