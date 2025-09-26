import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT || 587),
  secure: false,
  auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASS },
});

export async function sendOTPEmail(to, code) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "HelperBee: Verify your account",
    html: `<p>Your OTP code is <b>${code}</b>. It expires in 10 minutes.</p>`,
  });
}

export async function sendNotificationEmail(to, subject, bodyHtml) {
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html: bodyHtml });
}