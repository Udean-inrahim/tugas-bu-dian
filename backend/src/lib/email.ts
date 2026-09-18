const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

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
    console.error("Gagal mengirim email:", err);
    return false;
  }
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
