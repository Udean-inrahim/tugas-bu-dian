import nodemailer, { type Transporter } from "nodemailer";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

type Sender = { name: string; email: string };

function parseFrom(fallbackEmail: string): Sender {
  const raw = (process.env.EMAIL_FROM ?? "").trim();
  const match = /^(.*?)\s*<([^>]+)>\s*$/.exec(raw);
  if (match) {
    return { name: match[1].replace(/^"|"$/g, "") || "Smart Temp Monitor", email: match[2] };
  }
  if (raw.includes("@")) {
    return { name: process.env.EMAIL_SENDER_NAME ?? "Smart Temp Monitor", email: raw };
  }
  return { name: "Smart Temp Monitor", email: fallbackEmail };
}

export function emailConfigured() {
  return Boolean(process.env.SMTP_HOST || process.env.BREVO_API_KEY || process.env.RESEND_API_KEY);
}

let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: (process.env.SMTP_SECURE ?? "true") !== "false",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return smtpTransporter;
}

async function sendViaSmtp(to: string, subject: string, html: string): Promise<boolean> {
  const transporter = getSmtpTransporter();
  if (!transporter) return false;
  const sender = parseFrom(process.env.EMAIL_SENDER ?? process.env.SMTP_USER ?? "");
  if (!sender.email) {
    console.error("SMTP: set EMAIL_FROM (mis. 'Smart Temp Monitor <kamu@gmail.com>')");
    return false;
  }
  try {
    await transporter.sendMail({
      from: `${sender.name} <${sender.email}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("Gagal mengirim email via SMTP:", err);
    return false;
  }
}

async function sendViaBrevo(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY as string;
  const sender = parseFrom(process.env.EMAIL_SENDER ?? "");
  if (!sender.email) {
    console.error("Brevo: set EMAIL_FROM (mis. 'Smart Temp Monitor <email@verified.com>')");
    return false;
  }
  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      console.error("Brevo error:", res.status, await res.text().catch(() => ""));
    }
    return res.ok;
  } catch (err) {
    console.error("Gagal mengirim email via Brevo:", err);
    return false;
  }
}

async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY as string;
  const from = process.env.EMAIL_FROM ?? "Smart Temp Monitor <onboarding@resend.dev>";
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error("Resend error:", res.status, await res.text().catch(() => ""));
    }
    return res.ok;
  } catch (err) {
    console.error("Gagal mengirim email via Resend:", err);
    return false;
  }
}

function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (process.env.SMTP_HOST) return sendViaSmtp(to, subject, html);
  if (process.env.BREVO_API_KEY) return sendViaBrevo(to, subject, html);
  if (process.env.RESEND_API_KEY) return sendViaResend(to, subject, html);
  return Promise.resolve(false);
}

function codeBlock(code: string) {
  return `
    <div style="font-family:sans-serif;line-height:1.5">
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
      <p>Kode berlaku 15 menit.</p>
    </div>
  `;
}

export function sendVerificationEmail(to: string, code: string): Promise<boolean> {
  return sendEmail(
    to,
    "Kode Verifikasi Email — Smart Temp Monitor",
    `
      <div style="font-family:sans-serif;line-height:1.5">
        <h2>Verifikasi Email</h2>
        <p>Masukkan kode berikut untuk mengaktifkan akunmu:</p>
        ${codeBlock(code)}
        <p>Jika kamu tidak mendaftar, abaikan email ini.</p>
      </div>
    `
  );
}

export function sendResetEmail(to: string, code: string): Promise<boolean> {
  return sendEmail(
    to,
    "Kode Reset Password — Smart Temp Monitor",
    `
      <div style="font-family:sans-serif;line-height:1.5">
        <h2>Reset Password</h2>
        <p>Masukkan kode berikut untuk mengatur ulang password akunmu:</p>
        ${codeBlock(code)}
        <p>Jika kamu tidak meminta reset, abaikan email ini.</p>
      </div>
    `
  );
}
