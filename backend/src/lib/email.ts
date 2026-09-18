const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail(to: string, code: string): Promise<boolean> {
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
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Kode Verifikasi Email — Smart Temp Monitor",
        html: `
          <div style="font-family:sans-serif;line-height:1.5">
            <h2>Verifikasi Email</h2>
            <p>Masukkan kode berikut untuk mengaktifkan akunmu:</p>
            <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
            <p>Kode berlaku 15 menit. Jika kamu tidak mendaftar, abaikan email ini.</p>
          </div>
        `,
      }),
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
