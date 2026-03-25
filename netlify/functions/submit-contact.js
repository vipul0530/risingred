const { getStore } = require("@netlify/blobs");
const nodemailer = require("nodemailer");

const NOTIFY_EMAILS = "rising.red14@gmail.com, vipul30@gmail.com";

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  let name, email, reason, message;
  try {
    ({ name, email, reason, message } = JSON.parse(event.body));
    if (!name || !email || !message) throw new Error("Missing fields");
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Please fill in name, email, and message." }) };
  }

  // ── 1. Save submission to Netlify Blobs ───────────────────────────────────
  try {
    const store = getStore({
      name: "risingred",
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });
    const existing = await store.get("contacts", { type: "json" }) || [];
    existing.unshift({ name, email, reason: reason || "", message, date: new Date().toISOString() });
    await store.setJSON("contacts", existing);
  } catch (err) {
    console.log("submit-contact blob error:", err.message);
    // Non-fatal — continue to send email anyway
  }

  // ── 2. Send email notification via Gmail SMTP ─────────────────────────────
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass }
      });

      const subject = `Rising Red: ${reason || "General inquiry"} — ${name}`;
      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
          <div style="background:#c0392b;padding:24px 32px">
            <h2 style="color:white;margin:0;font-size:20px">New Message — Rising Red</h2>
          </div>
          <div style="padding:32px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#888;font-size:13px;width:90px">Name</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:13px">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#c0392b">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:13px">Reason</td><td style="padding:8px 0">${reason || "—"}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
            <p style="color:#444;line-height:1.7;white-space:pre-wrap">${message}</p>
          </div>
          <div style="background:#fdf0ee;padding:16px 32px;font-size:12px;color:#999">
            Submitted via risingred.org · ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} PT
          </div>
        </div>`;

      await transporter.sendMail({
        from: `"Rising Red Website" <${gmailUser}>`,
        to: NOTIFY_EMAILS,
        replyTo: email,
        subject,
        html
      });

      console.log("Email sent to:", NOTIFY_EMAILS);
    } catch (err) {
      console.log("Email send error:", err.message);
      // Submission already saved — email failure is non-fatal
    }
  } else {
    console.log("GMAIL_USER / GMAIL_APP_PASSWORD env vars not set — email skipped.");
  }

  return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
};
