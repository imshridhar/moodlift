/**
 * Email Service
 * Nodemailer-based transactional email
 */

const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const FROM = process.env.EMAIL_FROM || 'MoodLift <noreply@moodlift.app>';

// ─── Email Templates ──────────────────────────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: 'DM Sans', Arial, sans-serif; background: #fafaf8; color: #1c1a16; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #f2751a, #f93060); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
    .body { padding: 32px; }
    .body p { line-height: 1.7; color: #3c3a36; }
    .btn { display: inline-block; padding: 14px 28px; background: #f2751a; color: white; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { padding: 20px 32px; background: #f4f3ef; text-align: center; font-size: 12px; color: #9e9588; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ MoodLift</h1>
      <p>Your emotional well-being platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MoodLift. All rights reserved.</p>
      <p>You received this because you have a MoodLift account.</p>
    </div>
  </div>
</body>
</html>`;

// ─── Email Senders ────────────────────────────────────────────────────────────

const sendVerificationEmail = async (email, name, token) => {
  const url = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  const html = baseTemplate(`
    <p>Hi ${name || 'there'}! 👋</p>
    <p>Thanks for joining MoodLift! Please verify your email address to unlock all features.</p>
    <p style="text-align:center"><a href="${url}" class="btn">Verify Email</a></p>
    <p style="font-size:13px;color:#9e9588;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
  `);

  try {
    await getTransporter().sendMail({ from: FROM, to: email, subject: 'Verify your MoodLift email', html });
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error);
  }
};

const sendPasswordResetEmail = async (email, name, token) => {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = baseTemplate(`
    <p>Hi ${name || 'there'},</p>
    <p>We received a request to reset your MoodLift password.</p>
    <p style="text-align:center"><a href="${url}" class="btn">Reset Password</a></p>
    <p style="font-size:13px;color:#9e9588;">This link expires in 1 hour. If you didn't request this, ignore this email — your account is safe.</p>
  `);

  try {
    await getTransporter().sendMail({ from: FROM, to: email, subject: 'Reset your MoodLift password', html });
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send reset email to ${email}:`, error);
  }
};

const sendStreakReminderEmail = async (email, name, streakCount) => {
  const html = baseTemplate(`
    <p>Hi ${name || 'there'}! 🌟</p>
    <p>You haven't checked in today — don't break your <strong>${streakCount}-day streak!</strong></p>
    <p>Taking just 2 minutes to log your mood keeps the momentum going and helps you build lasting self-awareness.</p>
    <p style="text-align:center"><a href="${process.env.FRONTEND_URL}/check-in" class="btn">Check In Now 🔥</a></p>
  `);

  try {
    await getTransporter().sendMail({ from: FROM, to: email, subject: `Don't break your ${streakCount}-day streak! 🔥`, html });
  } catch (error) {
    logger.error('Failed to send streak reminder:', error);
  }
};

const sendWeeklyInsightEmail = async (email, name, stats) => {
  const avgMood = parseFloat(stats.avg_mood || 0).toFixed(1);
  const html = baseTemplate(`
    <p>Hi ${name || 'there'}! 📊</p>
    <p>Here's your emotional well-being summary for this week:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #e8e6e0;color:#6b6458;">Average mood</td><td style="font-weight:bold;text-align:right">${avgMood}/10</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e8e6e0;color:#6b6458;">Check-ins</td><td style="font-weight:bold;text-align:right">${stats.total_entries || 0}</td></tr>
      <tr><td style="padding:8px 0;color:#6b6458;">Current streak</td><td style="font-weight:bold;text-align:right">${stats.streak || 0} days 🔥</td></tr>
    </table>
    <p style="text-align:center"><a href="${process.env.FRONTEND_URL}/insights" class="btn">View Full Insights</a></p>
  `);

  try {
    await getTransporter().sendMail({ from: FROM, to: email, subject: 'Your weekly MoodLift insights 📊', html });
  } catch (error) {
    logger.error('Failed to send weekly insight email:', error);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendStreakReminderEmail,
  sendWeeklyInsightEmail,
};
