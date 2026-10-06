import "server-only";
import nodemailer from "nodemailer";

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

function getMailerTransport() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    return null;
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

export async function sendPasswordResetEmail({ email, token }) {
  const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;
  const transporter = getMailerTransport();

  if (!transporter) {
    console.log(`Password reset link for ${email}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Reset your EchoFind password",
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
