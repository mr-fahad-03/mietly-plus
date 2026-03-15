require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Stripe = require("stripe");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { connectDatabase } = require("./db");
const User = require("./models/User");
const SignupOtp = require("./models/SignupOtp");
const Admin = require("./models/Admin");
const Category = require("./models/Category");
const Banner = require("./models/Banner");
const Product = require("./models/Product");
const Brand = require("./models/Brand");
const BlogPost = require("./models/BlogPost");
const SupportRequest = require("./models/SupportRequest");
const Order = require("./models/Order");

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage() });
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_change_me";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const VALID_FULFILLMENT_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled", "returned"];
const WEBSITE_CURRENCY = "eur";
const hasCloudinaryConfig =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

const emailConfig = {
  host: String(process.env.SMTP_HOST || "").trim(),
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
  user: String(process.env.SMTP_USER || "").trim(),
  pass: String(process.env.SMTP_PASS || "").trim(),
  fromEmail: String(process.env.EMAIL_FROM || process.env.SMTP_USER || "").trim(),
  fromName: String(process.env.EMAIL_FROM_NAME || "MietlyPlus").trim(),
};

const canSendEmail =
  Boolean(emailConfig.host) &&
  Number.isFinite(emailConfig.port) &&
  Boolean(emailConfig.user) &&
  Boolean(emailConfig.pass) &&
  Boolean(emailConfig.fromEmail);

const mailTransporter = canSendEmail
  ? nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    })
  : null;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

app.use(cors());
app.use(express.json());

let appInitPromise = null;

async function initializeApp() {
  if (!appInitPromise) {
    appInitPromise = connectDatabase().catch((error) => {
      appInitPromise = null;
      throw error;
    });
  }

  await appInitPromise;
}


function buildAdminToken(admin) {

  return jwt.sign(
    {
      sub: String(admin._id),
      email: admin.email,
      role: "admin",
      name: admin.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function buildUserToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      role: "user",
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Forbidden." });
    }
    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token." });
  }
}

function requireUserAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "user") {
      return res.status(403).json({ message: "Forbidden." });
    }
    req.userAuth = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token." });
  }
}

function requireCronAuth(req, res, next) {
  const configuredSecret = String(process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET || "").trim();
  if (!configuredSecret) {
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ message: "Cron secret is not configured." });
    }
    return next();
  }

  const authorizationHeader = String(req.headers.authorization || "").trim();
  const bearerSecret = authorizationHeader.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : "";
  const querySecret = String(req.query?.secret || "").trim();

  if (bearerSecret !== configuredSecret && querySecret !== configuredSecret) {
    return res.status(401).json({ message: "Unauthorized cron request." });
  }

  return next();
}

function isValidGermanPhone(phone) {
  return /^\+49\d{7,13}$/.test(phone);
}

function getFrontendBaseUrl() {
  return (
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

function normalizeAddressInput(rawAddress) {
  const source = rawAddress && typeof rawAddress === "object" ? rawAddress : {};
  return {
    fullName: String(source.fullName || "").trim(),
    phone: String(source.phone || "").trim(),
    line1: String(source.line1 || "").trim(),
    line2: String(source.line2 || "").trim(),
    city: String(source.city || "").trim(),
    state: String(source.state || "").trim(),
    postalCode: String(source.postalCode || "").trim(),
    country: String(source.country || "").trim(),
  };
}

function buildOrderNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${yyyy}${mm}${dd}-${random}`;
}

function prettyFulfillmentStatus(status) {
  const normalized = String(status || "").toLowerCase();
  switch (normalized) {
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "returned":
      return "Returned";
    default:
      return "Unknown";
  }
}

function addDuration(startDate, durationValue, durationUnit) {
  const parsed = new Date(startDate);
  if (Number.isNaN(parsed.getTime())) return null;
  const endDate = new Date(parsed);
  const value = Math.max(1, Number(durationValue) || 1);
  if (durationUnit === "month") {
    endDate.setMonth(endDate.getMonth() + value);
    return endDate;
  }
  if (durationUnit === "week") {
    endDate.setDate(endDate.getDate() + value * 7);
    return endDate;
  }
  endDate.setDate(endDate.getDate() + value);
  return endDate;
}

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}

function getSoonestRentalEndDate(order) {
  const endDates = Array.isArray(order.items)
    ? order.items
        .map((item) => addDuration(item.startDate, item.durationValue, item.durationUnit))
        .filter((date) => date instanceof Date && !Number.isNaN(date.getTime()))
    : [];

  if (endDates.length === 0) return null;
  return endDates.sort((a, b) => a.getTime() - b.getTime())[0];
}

async function sendEmail({ to, subject, text, html }) {
  if (!mailTransporter || !to) return false;
  try {
    await mailTransporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email send failed:", error.message);
    return false;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function verifyGoogleIdToken(idToken) {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!response.ok) {
    throw new Error("Invalid Google token.");
  }
  return response.json();
}

function renderEmailTemplate({ eyebrow, title, intro, bodyHtml, ctaText, ctaHref, footerNote }) {
  const safeEyebrow = escapeHtml(eyebrow);
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeCtaText = escapeHtml(ctaText || "");
  const safeCtaHref = escapeHtml(ctaHref || "");
  const safeFooterNote = escapeHtml(footerNote || "");
  const logoUrl = escapeHtml(
    String(process.env.EMAIL_LOGO_URL || `${getFrontendBaseUrl()}/logo.png`).trim()
  );

  return `
    <div style="margin:0;padding:24px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
        <div style="padding:18px 24px 14px 24px;background:#ffffff;border-bottom:1px solid #eef2f7;text-align:center;">
          <img src="${logoUrl}" alt="MietlyPlus" style="height:34px;width:auto;max-width:180px;display:inline-block;" />
        </div>
        <div style="padding:20px 24px;background:#f0fdf4;color:#111827;border-bottom:1px solid #dcfce7;">
          <p style="margin:0;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;font-weight:700;color:#3f6212;">${safeEyebrow}</p>
          <h1 style="margin:8px 0 0 0;font-size:26px;line-height:1.2;color:#111827;">${safeTitle}</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">${safeIntro}</p>
          ${bodyHtml}
          ${
            ctaText && ctaHref
              ? `<div style="margin-top:22px;">
                   <a href="${safeCtaHref}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;font-size:14px;">${safeCtaText}</a>
                 </div>`
              : ""
          }
        </div>
        <div style="padding:14px 24px;border-top:1px solid #e5e7eb;background:#fafafa;">
          <p style="margin:0;font-size:12px;color:#6b7280;">${safeFooterNote || "Thanks for choosing MietlyPlus."}</p>
        </div>
      </div>
    </div>
  `;
}

async function sendOrderFulfillmentStatusEmail(order) {
  const statusLabel = prettyFulfillmentStatus(order.fulfillmentStatus);
  const orderUrl = `${getFrontendBaseUrl()}/profile`;
  const subject = `Order ${order.orderNumber} is now ${statusLabel}`;
  const text = [
    `Hi ${order.customer?.name || "Customer"},`,
    "",
    `Your order ${order.orderNumber} status changed to ${statusLabel}.`,
    `Track your order from your account: ${orderUrl}`,
    "",
    "Thank you,",
    "MietlyPlus",
  ].join("\n");
  const html = renderEmailTemplate({
    eyebrow: "Order Update",
    title: `Order ${order.orderNumber}`,
    intro: `Hi ${order.customer?.name || "Customer"}, your order status has changed.`,
    bodyHtml: `
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
        <p style="margin:0 0 6px 0;font-size:13px;color:#6b7280;">Current Status</p>
        <p style="margin:0;font-size:22px;font-weight:800;color:#111827;">${escapeHtml(statusLabel)}</p>
      </div>
    `,
    ctaText: "Track My Order",
    ctaHref: orderUrl,
    footerNote: "If you have any questions, reply to this email and our team will help you.",
  });
  return sendEmail({
    to: order.customer?.email || "",
    subject,
    text,
    html,
  });
}

async function sendRentalEndingReminderEmail(order, rentalEndDate) {
  if (!(rentalEndDate instanceof Date) || Number.isNaN(rentalEndDate.getTime())) return false;
  const orderUrl = `${getFrontendBaseUrl()}/profile`;
  const formattedDate = rentalEndDate.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const subject = `Rental period ending soon for order ${order.orderNumber}`;
  const text = [
    `Hi ${order.customer?.name || "Customer"},`,
    "",
    `Your rental period for order ${order.orderNumber} is ending on ${formattedDate}.`,
    `Please review your rental from your account: ${orderUrl}`,
    "",
    "Thank you,",
    "MietlyPlus",
  ].join("\n");
  const html = renderEmailTemplate({
    eyebrow: "Rental Reminder",
    title: "Your Rental Is Ending Soon",
    intro: `Hi ${order.customer?.name || "Customer"}, this is a reminder about your rental timeline.`,
    bodyHtml: `
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px;">
        <p style="margin:0 0 6px 0;font-size:13px;color:#9a3412;">Order</p>
        <p style="margin:0 0 8px 0;font-size:20px;font-weight:800;color:#7c2d12;">${escapeHtml(order.orderNumber)}</p>
        <p style="margin:0;font-size:14px;color:#7c2d12;">Rental end date: <strong>${escapeHtml(formattedDate)}</strong></p>
      </div>
    `,
    ctaText: "Review My Rental",
    ctaHref: orderUrl,
    footerNote: "Please return or extend your rental before the end date to avoid interruptions.",
  });

  const userSent = await sendEmail({
    to: order.customer?.email || "",
    subject,
    text,
    html,
  });

  const adminRecipient = String(process.env.ADMIN_NOTIFICATION_EMAIL || "").trim();
  if (adminRecipient) {
    await sendEmail({
      to: adminRecipient,
      subject: `[Admin] ${subject}`,
      text: `${text}\n\nCustomer email: ${order.customer?.email || "-"}`,
      html: `${html}<p>Customer email: ${order.customer?.email || "-"}</p>`,
    });
  }

  return userSent;
}

function buildSixDigitOtp() {
  const value = crypto.randomInt(0, 1000000);
  return String(value).padStart(6, "0");
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

async function sendSignupOtpEmail(email, otp, name) {
  const subject = "Your MietlyPlus verification code";
  const text = [
    `Hi ${name || "there"},`,
    "",
    `Your verification code is: ${otp}`,
    "This code expires in 10 minutes.",
    "",
    "If you did not request this, please ignore this email.",
    "MietlyPlus",
  ].join("\n");
  const html = renderEmailTemplate({
    eyebrow: "Email Verification",
    title: "Verify Your Account",
    intro: `Hi ${name || "there"}, use the code below to complete your signup.`,
    bodyHtml: `
      <div style="margin:8px 0 4px 0;border:1px dashed #a3e635;background:#f7fee7;border-radius:14px;padding:18px;text-align:center;">
        <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#4d7c0f;font-weight:700;">One-Time Password</p>
        <p style="margin:0;font-size:38px;letter-spacing:9px;font-weight:900;color:#365314;">${escapeHtml(otp)}</p>
      </div>
      <p style="margin:12px 0 0 0;font-size:13px;color:#6b7280;">This OTP expires in 10 minutes.</p>
    `,
    footerNote: "If you did not request this code, you can safely ignore this email.",
  });
  return sendEmail({ to: email, subject, text, html });
}

function formatCurrencyAmount(amount, currency = WEBSITE_CURRENCY) {
  const numericAmount = Number(amount) || 0;
  const normalizedCurrency = String(currency || WEBSITE_CURRENCY).toUpperCase();
  try {
    return new Intl.NumberFormat("en-DE", {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${normalizedCurrency} ${numericAmount.toFixed(2)}`;
  }
}

function buildOrderItemsEmailRows(order) {
  if (!Array.isArray(order.items) || order.items.length === 0) {
    return `<p style="margin:0;font-size:14px;color:#374151;">No line items available.</p>`;
  }

  return order.items
    .map((item) => {
      const title = escapeHtml(item.title || "Item");
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const lineTotal = formatCurrencyAmount(item.lineTotal, order.currency || WEBSITE_CURRENCY);
      const durationLabel = escapeHtml(item.durationLabel || "");
      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">
            <strong>${title}</strong>${durationLabel ? `<div style="margin-top:4px;color:#6b7280;font-size:12px;">${durationLabel}</div>` : ""}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:center;">${quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:right;">${escapeHtml(
            lineTotal
          )}</td>
        </tr>
      `;
    })
    .join("");
}

async function sendWelcomeEmail(user) {
  if (!user?.email) return false;
  const profileUrl = `${getFrontendBaseUrl()}/profile`;
  const name = user.name || "there";
  const subject = "Welcome to MietlyPlus";
  const text = [
    `Hi ${name},`,
    "",
    "Welcome to MietlyPlus. Your account is ready and you can start renting now.",
    `Manage your account here: ${profileUrl}`,
    "",
    "Thank you,",
    "MietlyPlus",
  ].join("\n");

  const html = renderEmailTemplate({
    eyebrow: "Welcome",
    title: "Your MietlyPlus account is ready",
    intro: `Hi ${name}, welcome to MietlyPlus.`,
    bodyHtml: `
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
        <p style="margin:0;font-size:14px;color:#374151;">You can now explore products and place your first rental order.</p>
      </div>
    `,
    ctaText: "Go To My Account",
    ctaHref: profileUrl,
    footerNote: "Need help? Reply to this email and our team will assist you.",
  });

  return sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
}

async function sendOrderCreatedEmail(order) {
  if (!order?.customer?.email) return false;
  const orderUrl = `${getFrontendBaseUrl()}/profile`;
  const currency = order.currency || WEBSITE_CURRENCY;
  const totalLabel = formatCurrencyAmount(order.total, currency);
  const subject = `Order placed successfully: ${order.orderNumber}`;
  const text = [
    `Hi ${order.customer?.name || "Customer"},`,
    "",
    `We received your order ${order.orderNumber}.`,
    `Order total: ${totalLabel}`,
    "Payment is pending until your checkout is completed.",
    `View your order: ${orderUrl}`,
    "",
    "Thank you,",
    "MietlyPlus",
  ].join("\n");

  const html = renderEmailTemplate({
    eyebrow: "Order Received",
    title: `Order ${order.orderNumber} created`,
    intro: `Hi ${order.customer?.name || "Customer"}, we received your order and are waiting for payment confirmation.`,
    bodyHtml: `
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
        <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">Order Total</p>
        <p style="margin:0;font-size:24px;font-weight:800;color:#111827;">${escapeHtml(totalLabel)}</p>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-collapse:collapse;">
        <thead>
          <tr>
            <th align="left" style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-transform:uppercase;">Item</th>
            <th align="center" style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-transform:uppercase;">Qty</th>
            <th align="right" style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${buildOrderItemsEmailRows(order)}
        </tbody>
      </table>
    `,
    ctaText: "View My Orders",
    ctaHref: orderUrl,
    footerNote: "This order will be processed after payment is confirmed.",
  });

  return sendEmail({
    to: order.customer.email,
    subject,
    text,
    html,
  });
}

async function sendOrderPaymentConfirmedEmail(order) {
  if (!order?.customer?.email) return false;
  const orderUrl = `${getFrontendBaseUrl()}/profile`;
  const currency = order.currency || WEBSITE_CURRENCY;
  const totalLabel = formatCurrencyAmount(order.total, currency);
  const subject = `Payment confirmed for order ${order.orderNumber}`;
  const text = [
    `Hi ${order.customer?.name || "Customer"},`,
    "",
    `Payment for order ${order.orderNumber} is confirmed.`,
    `Paid amount: ${totalLabel}`,
    `Track order updates here: ${orderUrl}`,
    "",
    "Thank you,",
    "MietlyPlus",
  ].join("\n");

  const html = renderEmailTemplate({
    eyebrow: "Payment Confirmed",
    title: `Payment received for ${order.orderNumber}`,
    intro: `Hi ${order.customer?.name || "Customer"}, your payment is successful and your order is now in processing.`,
    bodyHtml: `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px;">
        <p style="margin:0 0 6px 0;font-size:13px;color:#166534;">Paid Amount</p>
        <p style="margin:0;font-size:24px;font-weight:800;color:#14532d;">${escapeHtml(totalLabel)}</p>
      </div>
    `,
    ctaText: "Track My Order",
    ctaHref: orderUrl,
    footerNote: "We will email you again when the order status changes.",
  });

  return sendEmail({
    to: order.customer.email,
    subject,
    text,
    html,
  });
}

function getSupportRequestRecipientEmail() {
  const recipient = String(
    process.env.SUPPORT_REQUEST_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || "support@mietlyplus.de"
  ).trim();
  return recipient || "support@mietlyplus.de";
}

async function sendSupportRequestNotificationEmail(supportRequest) {
  const supportRecipient = getSupportRequestRecipientEmail();
  const submittedAt = new Date(supportRequest.createdAt || Date.now());
  const submittedAtLabel = Number.isNaN(submittedAt.getTime())
    ? new Date().toISOString()
    : submittedAt.toISOString();
  const safeMessageHtml = escapeHtml(supportRequest.message || "").replace(/\r?\n/g, "<br />");
  const subjectLine = `New support request from ${supportRequest.name || "Website visitor"}`;
  const requestPageUrl = supportRequest.pageUrl || "-";

  const adminText = [
    "A new support request has been submitted.",
    "",
    `Name: ${supportRequest.name || "-"}`,
    `Email: ${supportRequest.email || "-"}`,
    `Phone: ${supportRequest.phone || "-"}`,
    `Subject: ${supportRequest.subject || "-"}`,
    `Locale: ${supportRequest.locale || "en"}`,
    `Source: ${supportRequest.source || "website"}`,
    `Page URL: ${requestPageUrl}`,
    `Submitted At (UTC): ${submittedAtLabel}`,
    "",
    "Message:",
    supportRequest.message || "-",
  ].join("\n");

  const adminHtml = renderEmailTemplate({
    eyebrow: "Support Request",
    title: "New Contact Submission",
    intro: "A user has submitted a new support request from your website.",
    bodyHtml: `
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
        <p style="margin:0 0 6px 0;font-size:13px;color:#6b7280;">From</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#111827;">${escapeHtml(supportRequest.name || "-")}</p>
        <p style="margin:6px 0 0 0;font-size:14px;color:#1f2937;">${escapeHtml(supportRequest.email || "-")}</p>
      </div>
      <div style="margin-top:12px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
        <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">Details</p>
        <p style="margin:0;font-size:14px;color:#111827;"><strong>Phone:</strong> ${escapeHtml(supportRequest.phone || "-")}</p>
        <p style="margin:6px 0 0 0;font-size:14px;color:#111827;"><strong>Subject:</strong> ${escapeHtml(supportRequest.subject || "-")}</p>
        <p style="margin:6px 0 0 0;font-size:14px;color:#111827;"><strong>Source:</strong> ${escapeHtml(supportRequest.source || "website")}</p>
        <p style="margin:6px 0 0 0;font-size:14px;color:#111827;"><strong>Locale:</strong> ${escapeHtml((supportRequest.locale || "en").toUpperCase())}</p>
        <p style="margin:6px 0 0 0;font-size:14px;color:#111827;"><strong>Page URL:</strong> ${escapeHtml(requestPageUrl)}</p>
        <p style="margin:6px 0 0 0;font-size:14px;color:#111827;"><strong>Submitted At (UTC):</strong> ${escapeHtml(submittedAtLabel)}</p>
      </div>
      <div style="margin-top:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
        <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">Message</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#111827;">${safeMessageHtml || "-"}</p>
      </div>
    `,
    footerNote: "This is an automated support notification from MietlyPlus.",
  });

  const adminSent = await sendEmail({
    to: supportRecipient,
    subject: subjectLine,
    text: adminText,
    html: adminHtml,
  });

  if (!supportRequest.email) {
    return { adminSent, customerAcknowledgementSent: false };
  }

  const customerText = [
    `Hi ${supportRequest.name || "there"},`,
    "",
    "Thanks for reaching out to MietlyPlus support.",
    "We received your request and our team will reply as soon as possible.",
    "",
    "Summary:",
    `Subject: ${supportRequest.subject || "-"}`,
    `Message: ${supportRequest.message || "-"}`,
    "",
    "Best regards,",
    "MietlyPlus Support",
  ].join("\n");

  const customerHtml = renderEmailTemplate({
    eyebrow: "Support Confirmation",
    title: "We Received Your Request",
    intro: `Hi ${supportRequest.name || "there"}, thanks for contacting MietlyPlus support.`,
    bodyHtml: `
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
        <p style="margin:0 0 6px 0;font-size:13px;color:#6b7280;">Subject</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#111827;">${escapeHtml(supportRequest.subject || "General inquiry")}</p>
      </div>
      <div style="margin-top:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
        <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">Your Message</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#111827;">${safeMessageHtml || "-"}</p>
      </div>
    `,
    footerNote: "Our support team will get back to you shortly.",
  });

  const customerAcknowledgementSent = await sendEmail({
    to: supportRequest.email,
    subject: "We received your support request",
    text: customerText,
    html: customerHtml,
  });

  return { adminSent, customerAcknowledgementSent };
}

async function runRentalEndingReminderSweep() {
  const now = new Date();
  const target = new Date(now);
  target.setDate(now.getDate() + 1);
  target.setHours(0, 0, 0, 0);

  const targetDateKey = target.toISOString().slice(0, 10);
  const orders = await Order.find({
    paymentStatus: "paid",
    status: { $ne: "cancelled" },
    fulfillmentStatus: { $nin: ["cancelled", "returned"] },
  }).select(
    "_id orderNumber customer items paymentStatus status fulfillmentStatus rentalReminderSentForDates"
  );

  for (const order of orders) {
    const endDate = getSoonestRentalEndDate(order);
    if (!endDate) continue;
    const normalizedEnd = new Date(endDate);
    normalizedEnd.setHours(0, 0, 0, 0);
    const endDateKey = normalizedEnd.toISOString().slice(0, 10);
    if (endDateKey !== targetDateKey) continue;

    const alreadySent = Array.isArray(order.rentalReminderSentForDates)
      ? order.rentalReminderSentForDates.includes(targetDateKey)
      : false;
    if (alreadySent) continue;

    const sent = await sendRentalEndingReminderEmail(order, endDate);
    if (!sent) continue;

    order.rentalReminderSentForDates = Array.isArray(order.rentalReminderSentForDates)
      ? [...new Set([...order.rentalReminderSentForDates, targetDateKey])].slice(-20)
      : [targetDateKey];
    await order.save();
  }
}

function mapCategory(category) {
  const rawSeo = category?.seo || {};
  const rawContentHtml = rawSeo.contentHtml || {};
  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    image: category.image || null,
    parentId: category.parentId ? String(category.parentId) : null,
    seo: {
      metaTitle: String(rawSeo.metaTitle || ""),
      metaDescription: String(rawSeo.metaDescription || ""),
      metaKeywords: Array.isArray(rawSeo.metaKeywords)
        ? rawSeo.metaKeywords.map((keyword) => String(keyword || "").trim()).filter(Boolean)
        : [],
      canonicalUrl: String(rawSeo.canonicalUrl || ""),
      contentHtml: {
        en: String(rawContentHtml.en || ""),
        de: String(rawContentHtml.de || ""),
      },
    },
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

function normalizeCategorySeo(rawSeo) {
  const seo = rawSeo && typeof rawSeo === "object" ? rawSeo : {};
  const contentHtml = seo.contentHtml && typeof seo.contentHtml === "object" ? seo.contentHtml : {};
  const metaKeywordsInput = Array.isArray(seo.metaKeywords)
    ? seo.metaKeywords
    : String(seo.metaKeywords || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    metaTitle: String(seo.metaTitle || "").trim(),
    metaDescription: String(seo.metaDescription || "").trim(),
    metaKeywords: [...new Set(metaKeywordsInput.map((item) => String(item || "").trim()).filter(Boolean))],
    canonicalUrl: String(seo.canonicalUrl || "").trim(),
    contentHtml: {
      en: String(contentHtml.en || "").trim(),
      de: String(contentHtml.de || "").trim(),
    },
  };
}

function mapBanner(banner) {
  return {
    id: String(banner._id),
    title: banner.title,
    subtitle: banner.subtitle || "",
    description: banner.description || "",
    imageUrl: banner.imageUrl,
    buttonText: banner.buttonText || "",
    buttonLink: banner.buttonLink || "",
    position: banner.position,
    device: banner.device,
    sortOrder: banner.sortOrder || 0,
    validFrom: banner.validFrom,
    validUntil: banner.validUntil,
    isActive: banner.isActive,
    createdAt: banner.createdAt,
    updatedAt: banner.updatedAt,
  };
}

function mapBrand(brand) {
  return {
    id: String(brand._id),
    name: brand.name,
    slug: brand.slug,
    image: brand.image || null,
    isActive: Boolean(brand.isActive),
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
  };
}

function mapProduct(product) {
  const rawCategory = product.categoryId;
  const rawBrand = product.brandId;
  const category =
    rawCategory && typeof rawCategory === "object" && rawCategory._id
      ? {
          id: String(rawCategory._id),
          name: rawCategory.name,
          slug: rawCategory.slug,
        }
      : null;
  const brand =
    rawBrand && typeof rawBrand === "object" && rawBrand._id
      ? {
          id: String(rawBrand._id),
          name: rawBrand.name,
          slug: rawBrand.slug,
          image: rawBrand.image || null,
        }
      : null;
  const minDays = Math.max(1, Number(product.minimumRentalDays) || 7);
  const maxDays = Math.max(minDays, Number(product.maximumRentalDays) || 30);
  const fallbackMinWeeks = Math.max(1, Math.ceil(minDays / 7));
  const fallbackMaxWeeks = Math.max(fallbackMinWeeks, Math.ceil(maxDays / 7));
  const minWeeks = Math.max(1, Number(product.minimumRentalWeeks) || fallbackMinWeeks);
  const maxWeeks = Math.max(minWeeks, Number(product.maximumRentalWeeks) || fallbackMaxWeeks);

  return {
    id: String(product._id),
    title: product.title,
    titleI18n: {
      en: product.titleI18n?.en || product.title || "",
      de: product.titleI18n?.de || "",
    },
    slug: product.slug,
    description: product.description || "",
    descriptionI18n: {
      en: product.descriptionI18n?.en || product.description || "",
      de: product.descriptionI18n?.de || "",
    },
    shortDescription: product.shortDescription || "",
    shortDescriptionI18n: {
      en: product.shortDescriptionI18n?.en || product.shortDescription || "",
      de: product.shortDescriptionI18n?.de || "",
    },
    imageUrl: product.imageUrl,
    galleryImages: product.galleryImages || [],
    sku: product.sku || "",
    tags: product.tags || [],
    brandId: brand ? brand.id : String(product.brandId || ""),
    brand: brand ? brand.name : product.brand || "",
    brandData: brand,
    categoryId: category ? category.id : String(product.categoryId),
    category,
    monthlyPrice: product.monthlyPrice,
    buyerPrice: product.buyerPrice || 0,
    offerPrice: product.offerPrice || 0,
    stock: product.stock || 0,
    stockStatus: product.stockStatus || "in_stock",
    lowStockWarning: product.lowStockWarning || 0,
    maxRentalQuantity: product.maxRentalQuantity || 1,
    unit: product.unit || "piece",
    weightKg: product.weightKg || 0,
    minimumRentalMonths: product.minimumRentalMonths || 1,
    maximumRentalMonths: product.maximumRentalMonths || 24,
    minimumRentalWeeks: minWeeks,
    maximumRentalWeeks: maxWeeks,
    minimumRentalDays: minDays,
    maximumRentalDays: maxDays,
    rentalPeriodUnit: product.rentalPeriodUnit || "week",
    deliveryFee: product.deliveryFee || 0,
    verificationRequired: product.verificationRequired !== false,
    depositEnabled: Boolean(product.depositEnabled),
    securityDeposit: product.securityDeposit || 0,
    replacementValue: product.replacementValue || 0,
    refundable: Boolean(product.refundable),
    specifications: product.specifications || [],
    seo: product.seo || {},
    isMostPopular: Boolean(product.isMostPopular),
    isActive: Boolean(product.isActive),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function normalizeLocalizedText(rawValue) {
  const value = rawValue && typeof rawValue === "object" ? rawValue : {};
  return {
    en: String(value.en || "").trim(),
    de: String(value.de || "").trim(),
  };
}

function normalizeBlogSeo(rawSeo) {
  const seo = rawSeo && typeof rawSeo === "object" ? rawSeo : {};
  const metaKeywordsInput = Array.isArray(seo.metaKeywords)
    ? seo.metaKeywords
    : String(seo.metaKeywords || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    metaTitle: String(seo.metaTitle || "").trim(),
    metaDescription: String(seo.metaDescription || "").trim(),
    metaKeywords: [...new Set(metaKeywordsInput.map((item) => String(item || "").trim()).filter(Boolean))],
    canonicalUrl: String(seo.canonicalUrl || "").trim(),
    ogTitle: String(seo.ogTitle || "").trim(),
    ogDescription: String(seo.ogDescription || "").trim(),
    ogImageUrl: String(seo.ogImageUrl || "").trim(),
  };
}

function mapBlogPost(post) {
  const rawCategory = post.categoryId;
  const category =
    rawCategory && typeof rawCategory === "object" && rawCategory._id
      ? {
          id: String(rawCategory._id),
          name: rawCategory.name,
          slug: rawCategory.slug,
        }
      : null;

  return {
    id: String(post._id),
    titleI18n: normalizeLocalizedText(post.titleI18n),
    excerptI18n: normalizeLocalizedText(post.excerptI18n),
    contentHtmlI18n: normalizeLocalizedText(post.contentHtmlI18n),
    categoryId: category ? category.id : String(post.categoryId || ""),
    category,
    slug: String(post.slug || ""),
    coverImageUrl: String(post.coverImageUrl || ""),
    tags: Array.isArray(post.tags) ? post.tags.map((tag) => String(tag || "").trim()).filter(Boolean) : [],
    readingTimeMinutes: Math.max(0, Number(post.readingTimeMinutes) || 0),
    seo: normalizeBlogSeo(post.seo),
    status: post.status === "published" ? "published" : "draft",
    publishedAt: post.publishedAt || null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

function mapSupportRequest(request) {
  return {
    id: String(request._id),
    name: request.name,
    email: request.email,
    phone: request.phone || "",
    subject: request.subject || "",
    message: request.message,
    locale: request.locale || "en",
    source: request.source || "footer",
    pageUrl: request.pageUrl || "",
    status: request.status || "new",
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

function mapOrder(order) {
  const rentalEndDate = getSoonestRentalEndDate(order);
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    userId: String(order.userId),
    customer: {
      name: order.customer?.name || "",
      email: order.customer?.email || "",
      phone: order.customer?.phone || "",
    },
    shippingAddress: {
      fullName: order.shippingAddress?.fullName || "",
      phone: order.shippingAddress?.phone || "",
      line1: order.shippingAddress?.line1 || "",
      line2: order.shippingAddress?.line2 || "",
      city: order.shippingAddress?.city || "",
      state: order.shippingAddress?.state || "",
      postalCode: order.shippingAddress?.postalCode || "",
      country: order.shippingAddress?.country || "",
    },
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          productId: item.productId ? String(item.productId) : "",
          title: item.title,
          slug: item.slug || "",
          imageUrl: item.imageUrl || "",
          categoryName: item.categoryName || "",
          brandName: item.brandName || "",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          baseUnitPrice: item.baseUnitPrice || 0,
          durationValue: item.durationValue || 1,
          durationUnit: item.durationUnit || "week",
          startDate: item.startDate || "",
          depositEnabled: Boolean(item.depositEnabled),
          securityDeposit: item.securityDeposit || 0,
          deliveryFee: item.deliveryFee || 0,
          lineSubtotal: item.lineSubtotal || 0,
          lineDeposit: item.lineDeposit || 0,
          lineDelivery: item.lineDelivery || 0,
          lineTotal: item.lineTotal || 0,
        }))
      : [],
    currency: WEBSITE_CURRENCY.toUpperCase(),
    subtotal: order.subtotal || 0,
    depositTotal: order.depositTotal || 0,
    deliveryTotal: order.deliveryTotal || 0,
    total: order.total || 0,
    status: order.status || "pending_payment",
    fulfillmentStatus: order.fulfillmentStatus || "pending",
    paymentStatus: order.paymentStatus || "unpaid",
    stripeCheckoutSessionId: order.stripeCheckoutSessionId || "",
    stripePaymentIntentId: order.stripePaymentIntentId || "",
    rentalEndDate: rentalEndDate ? rentalEndDate.toISOString() : "",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function buildCategoryTree(categories) {
  const nodes = new Map();
  const roots = [];

  categories.forEach((category) => {
    const mapped = { ...mapCategory(category), children: [] };
    nodes.set(mapped.id, mapped);
  });

  nodes.forEach((node) => {
    if (!node.parentId) {
      roots.push(node);
      return;
    }
    const parent = nodes.get(node.parentId);
    if (parent) {
      parent.children.push(node);
    }
  });

  return roots;
}

app.get("/health", (_, res) => {
  res.json({ ok: true, message: "Backend is running" });
});

app.get("/api/internal/cron/rental-reminders", requireCronAuth, async (_, res) => {
  try {
    await runRentalEndingReminderSweep();
    return res.json({ ok: true, message: "Rental reminder sweep completed." });
  } catch (error) {
    console.error("Rental reminder sweep failed:", error.message);
    return res.status(500).json({ ok: false, message: "Rental reminder sweep failed." });
  }
});

app.get("/api/categories", async (req, res) => {
  const categories = await Category.find().sort({ createdAt: 1 });
  const tree = req.query.tree === "true";
  if (tree) {
    return res.json(buildCategoryTree(categories));
  }
  return res.json(categories.map(mapCategory));
});

app.get("/api/admin/categories", requireAdminAuth, async (req, res) => {
  const categories = await Category.find().sort({ createdAt: 1 });
  const tree = req.query.tree === "true";
  if (tree) {
    return res.json(buildCategoryTree(categories));
  }
  return res.json(categories.map(mapCategory));
});

app.get("/api/brands", async (_, res) => {
  const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
  return res.json(brands.map(mapBrand));
});

app.get("/api/admin/brands", requireAdminAuth, async (_, res) => {
  const brands = await Brand.find().sort({ name: 1 });
  return res.json(brands.map(mapBrand));
});

app.post("/api/admin/brands", requireAdminAuth, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const slug = String(req.body?.slug || "").trim().toLowerCase();
  const image = req.body?.image ? String(req.body.image).trim() : null;
  const isActive = req.body?.isActive !== false;

  if (!name || !slug) {
    return res.status(400).json({ message: "name and slug are required." });
  }

  const exists = await Brand.findOne({ slug }).select("_id").lean();
  if (exists) {
    return res.status(409).json({ message: "Brand slug already exists." });
  }

  const brand = await Brand.create({ name, slug, image, isActive: Boolean(isActive) });
  return res.status(201).json(mapBrand(brand));
});

app.put("/api/admin/brands/:id", requireAdminAuth, async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return res.status(404).json({ message: "Brand not found." });
  }

  const name = String(req.body?.name || "").trim();
  const slug = String(req.body?.slug || "").trim().toLowerCase();
  const image = req.body?.image ? String(req.body.image).trim() : null;
  const isActive = req.body?.isActive !== false;

  if (!name || !slug) {
    return res.status(400).json({ message: "name and slug are required." });
  }

  const duplicate = await Brand.findOne({ slug, _id: { $ne: brand._id } }).select("_id").lean();
  if (duplicate) {
    return res.status(409).json({ message: "Brand slug already exists." });
  }

  brand.name = name;
  brand.slug = slug;
  brand.image = image;
  brand.isActive = Boolean(isActive);
  await brand.save();
  return res.json(mapBrand(brand));
});

app.delete("/api/admin/brands/:id", requireAdminAuth, async (req, res) => {
  const brand = await Brand.findById(req.params.id).lean();
  if (!brand) {
    return res.status(404).json({ message: "Brand not found." });
  }

  const linkedProducts = await Product.countDocuments({ brandId: brand._id });
  if (linkedProducts > 0) {
    return res.status(400).json({ message: "Cannot delete brand linked to products." });
  }

  await Brand.deleteOne({ _id: brand._id });
  return res.json({ message: "Brand deleted successfully." });
});

app.post("/api/admin/auth/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "").trim();
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required." });
  }

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(401).json({ message: "Invalid admin credentials." });
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid admin credentials." });
  }

  const token = buildAdminToken(admin);
  return res.json({
    message: "Admin login successful.",
    token,
    admin: {
      id: String(admin._id),
      name: admin.name,
      email: admin.email,
    },
  });
});

app.get("/api/admin/auth/me", requireAdminAuth, (req, res) => {
  return res.json({
    admin: {
      id: req.admin.sub,
      email: req.admin.email,
      name: req.admin.name,
      role: req.admin.role,
    },
  });
});

app.post("/api/uploads/category-image", requireAdminAuth, upload.single("image"), async (req, res) => {
  if (!hasCloudinaryConfig) {
    return res.status(500).json({
      message:
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
    });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Image file is required." });
  }

  try {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "mietlyplus/categories",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    return res.status(201).json({
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Image upload failed.",
      error: error.message,
    });
  }
});

app.post("/api/uploads/banner-image", requireAdminAuth, upload.single("image"), async (req, res) => {
  if (!hasCloudinaryConfig) {
    return res.status(500).json({
      message:
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
    });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Image file is required." });
  }

  try {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "mietlyplus/banners",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    return res.status(201).json({
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Banner image upload failed.",
      error: error.message,
    });
  }
});

app.post("/api/uploads/brand-image", requireAdminAuth, upload.single("image"), async (req, res) => {
  if (!hasCloudinaryConfig) {
    return res.status(500).json({
      message:
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
    });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Image file is required." });
  }

  try {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "mietlyplus/brands",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    return res.status(201).json({
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Brand image upload failed.",
      error: error.message,
    });
  }
});

app.post("/api/uploads/product-image", requireAdminAuth, upload.single("image"), async (req, res) => {
  if (!hasCloudinaryConfig) {
    return res.status(500).json({
      message:
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
    });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Image file is required." });
  }

  try {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "mietlyplus/products",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    return res.status(201).json({
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Product image upload failed.",
      error: error.message,
    });
  }
});

app.post("/api/uploads/blog-image", requireAdminAuth, upload.single("image"), async (req, res) => {
  if (!hasCloudinaryConfig) {
    return res.status(500).json({
      message:
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
    });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Image file is required." });
  }

  try {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "mietlyplus/blogs",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    return res.status(201).json({
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Blog image upload failed.",
      error: error.message,
    });
  }
});

app.post("/api/categories", requireAdminAuth, async (req, res) => {
  const { name, slug, image = null, parentId = null, seo = {} } = req.body;
  if (!name?.en || !name?.de || !slug) {
    return res.status(400).json({
      message: "name.en, name.de, and slug are required.",
    });
  }

  const slugValue = String(slug).trim().toLowerCase();
  const exists = await Category.findOne({ slug: slugValue }).select("_id").lean();
  if (exists) {
    return res.status(409).json({ message: "Category slug already exists." });
  }

  if (parentId) {
    const parent = await Category.findById(parentId).select("_id").lean();
    if (!parent) {
      return res.status(400).json({ message: "parentId not found." });
    }
  }

  const newCategory = await Category.create({
    name: {
      en: String(name.en).trim(),
      de: String(name.de).trim(),
    },
    slug: slugValue,
    image: image ? String(image).trim() : null,
    parentId: parentId || null,
    seo: normalizeCategorySeo(seo),
  });

  return res.status(201).json(mapCategory(newCategory));
});

app.put("/api/categories/:id", requireAdminAuth, async (req, res) => {
  const categoryId = req.params.id;
  const { name, slug, image = null, parentId = null, seo = {} } = req.body;

  if (!name?.en || !name?.de || !slug) {
    return res.status(400).json({
      message: "name.en, name.de, and slug are required.",
    });
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: "Category not found." });
  }

  const slugValue = String(slug).trim().toLowerCase();
  const duplicate = await Category.findOne({ slug: slugValue, _id: { $ne: categoryId } })
    .select("_id")
    .lean();
  if (duplicate) {
    return res.status(409).json({ message: "Category slug already exists." });
  }

  if (parentId && String(parentId) === String(categoryId)) {
    return res.status(400).json({ message: "Category cannot be set as its parent." });
  }

  if (parentId) {
    const parent = await Category.findById(parentId).select("_id").lean();
    if (!parent) {
      return res.status(400).json({ message: "parentId not found." });
    }
  }

  category.name = {
    en: String(name.en).trim(),
    de: String(name.de).trim(),
  };
  category.slug = slugValue;
  category.image = image ? String(image).trim() : null;
  category.parentId = parentId || null;
  category.seo = normalizeCategorySeo(seo);
  await category.save();

  return res.json(mapCategory(category));
});

app.delete("/api/categories/:id", requireAdminAuth, async (req, res) => {
  const categoryId = req.params.id;
  const cascade = req.query.cascade === "true";

  const categories = await Category.find().select("_id parentId").lean();
  const exists = categories.some((item) => String(item._id) === String(categoryId));
  if (!exists) {
    return res.status(404).json({ message: "Category not found." });
  }

  const directChildren = categories.filter(
    (item) => item.parentId && String(item.parentId) === String(categoryId)
  );
  if (directChildren.length > 0 && !cascade) {
    return res.status(400).json({
      message: "Category has subcategories. Use cascade=true to delete all children.",
    });
  }

  const idsToDelete = new Set([String(categoryId)]);
  let changed = true;
  while (changed) {
    changed = false;
    categories.forEach((item) => {
      if (item.parentId && idsToDelete.has(String(item.parentId)) && !idsToDelete.has(String(item._id))) {
        idsToDelete.add(String(item._id));
        changed = true;
      }
    });
  }

  await Category.deleteMany({ _id: { $in: [...idsToDelete] } });

  return res.json({
    message: "Category deleted successfully.",
    deletedCount: idsToDelete.size,
  });
});

app.get("/api/banners", async (req, res) => {
  const now = new Date();
  const device = String(req.query.device || "").trim().toLowerCase();
  const position = String(req.query.position || "home").trim().toLowerCase();

  const query = {
    isActive: true,
    position,
    ...(device ? { device } : {}),
    $and: [
      { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
      { $or: [{ validUntil: null }, { validUntil: { $gte: now } }] },
    ],
  };

  const banners = await Banner.find(query).sort({ sortOrder: 1, createdAt: -1 });
  return res.json(banners.map(mapBanner));
});

app.get("/api/admin/banners", requireAdminAuth, async (req, res) => {
  const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });
  return res.json(banners.map(mapBanner));
});

app.post("/api/admin/banners", requireAdminAuth, async (req, res) => {
  const {
    title,
    subtitle = "",
    description = "",
    imageUrl,
    buttonText = "",
    buttonLink = "",
    position = "home",
    device,
    sortOrder = 0,
    validFrom = null,
    validUntil = null,
    isActive = true,
  } = req.body;

  if (!title || !imageUrl || !device) {
    return res.status(400).json({ message: "title, imageUrl and device are required." });
  }

  if (!["desktop", "mobile"].includes(String(device).toLowerCase())) {
    return res.status(400).json({ message: "device must be desktop or mobile." });
  }

  const banner = await Banner.create({
    title: String(title).trim(),
    subtitle: String(subtitle).trim(),
    description: String(description).trim(),
    imageUrl: String(imageUrl).trim(),
    buttonText: String(buttonText).trim(),
    buttonLink: String(buttonLink).trim(),
    position: String(position).trim().toLowerCase(),
    device: String(device).trim().toLowerCase(),
    sortOrder: Number(sortOrder) || 0,
    validFrom: validFrom ? new Date(validFrom) : null,
    validUntil: validUntil ? new Date(validUntil) : null,
    isActive: Boolean(isActive),
  });

  return res.status(201).json(mapBanner(banner));
});

app.put("/api/admin/banners/:id", requireAdminAuth, async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    return res.status(404).json({ message: "Banner not found." });
  }

  const {
    title,
    subtitle = "",
    description = "",
    imageUrl,
    buttonText = "",
    buttonLink = "",
    position = "home",
    device,
    sortOrder = 0,
    validFrom = null,
    validUntil = null,
    isActive = true,
  } = req.body;

  if (!title || !imageUrl || !device) {
    return res.status(400).json({ message: "title, imageUrl and device are required." });
  }

  if (!["desktop", "mobile"].includes(String(device).toLowerCase())) {
    return res.status(400).json({ message: "device must be desktop or mobile." });
  }

  banner.title = String(title).trim();
  banner.subtitle = String(subtitle).trim();
  banner.description = String(description).trim();
  banner.imageUrl = String(imageUrl).trim();
  banner.buttonText = String(buttonText).trim();
  banner.buttonLink = String(buttonLink).trim();
  banner.position = String(position).trim().toLowerCase();
  banner.device = String(device).trim().toLowerCase();
  banner.sortOrder = Number(sortOrder) || 0;
  banner.validFrom = validFrom ? new Date(validFrom) : null;
  banner.validUntil = validUntil ? new Date(validUntil) : null;
  banner.isActive = Boolean(isActive);
  await banner.save();

  return res.json(mapBanner(banner));
});

app.delete("/api/admin/banners/:id", requireAdminAuth, async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    return res.status(404).json({ message: "Banner not found." });
  }

  await Banner.deleteOne({ _id: banner._id });
  return res.json({ message: "Banner deleted successfully." });
});

app.get("/api/blogs", async (_, res) => {
  const posts = await BlogPost.find({ status: "published" })
    .populate("categoryId", "name slug")
    .sort({ publishedAt: -1, createdAt: -1 });
  return res.json(posts.map(mapBlogPost));
});

app.get("/api/blogs/:slug", async (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  if (!slug) {
    return res.status(400).json({ message: "Blog slug is required." });
  }

  const post = await BlogPost.findOne({ slug, status: "published" }).populate("categoryId", "name slug");
  if (!post) {
    return res.status(404).json({ message: "Blog post not found." });
  }

  return res.json(mapBlogPost(post));
});

app.get("/api/admin/blogs", requireAdminAuth, async (_, res) => {
  const posts = await BlogPost.find()
    .populate("categoryId", "name slug")
    .sort({ updatedAt: -1, createdAt: -1 });
  return res.json(posts.map(mapBlogPost));
});

app.post("/api/admin/blogs", requireAdminAuth, async (req, res) => {
  const titleI18n = normalizeLocalizedText(req.body?.titleI18n);
  const excerptI18n = normalizeLocalizedText(req.body?.excerptI18n);
  const contentHtmlI18n = normalizeLocalizedText(req.body?.contentHtmlI18n);
  const categoryId = String(req.body?.categoryId || "").trim();
  const slug = String(req.body?.slug || "").trim().toLowerCase();
  const coverImageUrl = String(req.body?.coverImageUrl || "").trim();
  const tags = Array.isArray(req.body?.tags)
    ? req.body.tags.map((tag) => String(tag || "").trim()).filter(Boolean)
    : [];
  const readingTimeMinutes = Math.max(0, Number(req.body?.readingTimeMinutes) || 0);
  const seo = normalizeBlogSeo(req.body?.seo);
  const status = String(req.body?.status || "draft").trim().toLowerCase();

  if (!slug || !categoryId || !titleI18n.en || !contentHtmlI18n.en) {
    return res.status(400).json({ message: "categoryId, slug, titleI18n.en and contentHtmlI18n.en are required." });
  }

  if (!["draft", "published"].includes(status)) {
    return res.status(400).json({ message: "status must be draft or published." });
  }

  const existing = await BlogPost.findOne({ slug }).select("_id").lean();
  if (existing) {
    return res.status(409).json({ message: "Blog slug already exists." });
  }

  const category = await Category.findById(categoryId).select("_id").lean();
  if (!category) {
    return res.status(400).json({ message: "categoryId not found." });
  }

  const nextStatus = status === "published" ? "published" : "draft";
  const rawPublishedAt = req.body?.publishedAt ? new Date(req.body.publishedAt) : null;
  const publishedAt =
    nextStatus === "published"
      ? rawPublishedAt && !Number.isNaN(rawPublishedAt.getTime())
        ? rawPublishedAt
        : new Date()
      : null;

  const post = await BlogPost.create({
    titleI18n,
    excerptI18n,
    contentHtmlI18n,
    categoryId,
    slug,
    coverImageUrl,
    tags,
    readingTimeMinutes,
    seo,
    status: nextStatus,
    publishedAt,
  });

  const populated = await BlogPost.findById(post._id).populate("categoryId", "name slug");
  return res.status(201).json(mapBlogPost(populated));
});

app.put("/api/admin/blogs/:id", requireAdminAuth, async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Blog post not found." });
  }

  const titleI18n = normalizeLocalizedText(req.body?.titleI18n);
  const excerptI18n = normalizeLocalizedText(req.body?.excerptI18n);
  const contentHtmlI18n = normalizeLocalizedText(req.body?.contentHtmlI18n);
  const categoryId = String(req.body?.categoryId || "").trim();
  const slug = String(req.body?.slug || "").trim().toLowerCase();
  const coverImageUrl = String(req.body?.coverImageUrl || "").trim();
  const tags = Array.isArray(req.body?.tags)
    ? req.body.tags.map((tag) => String(tag || "").trim()).filter(Boolean)
    : [];
  const readingTimeMinutes = Math.max(0, Number(req.body?.readingTimeMinutes) || 0);
  const seo = normalizeBlogSeo(req.body?.seo);
  const status = String(req.body?.status || "draft").trim().toLowerCase();

  if (!slug || !categoryId || !titleI18n.en || !contentHtmlI18n.en) {
    return res.status(400).json({ message: "categoryId, slug, titleI18n.en and contentHtmlI18n.en are required." });
  }

  if (!["draft", "published"].includes(status)) {
    return res.status(400).json({ message: "status must be draft or published." });
  }

  const duplicate = await BlogPost.findOne({ slug, _id: { $ne: post._id } }).select("_id").lean();
  if (duplicate) {
    return res.status(409).json({ message: "Blog slug already exists." });
  }

  const category = await Category.findById(categoryId).select("_id").lean();
  if (!category) {
    return res.status(400).json({ message: "categoryId not found." });
  }

  const nextStatus = status === "published" ? "published" : "draft";
  const rawPublishedAt = req.body?.publishedAt ? new Date(req.body.publishedAt) : null;
  const publishDateFromPayload = rawPublishedAt && !Number.isNaN(rawPublishedAt.getTime()) ? rawPublishedAt : null;
  const publishedAt =
    nextStatus === "published"
      ? publishDateFromPayload || post.publishedAt || new Date()
      : null;

  post.titleI18n = titleI18n;
  post.excerptI18n = excerptI18n;
  post.contentHtmlI18n = contentHtmlI18n;
  post.categoryId = categoryId;
  post.slug = slug;
  post.coverImageUrl = coverImageUrl;
  post.tags = tags;
  post.readingTimeMinutes = readingTimeMinutes;
  post.seo = seo;
  post.status = nextStatus;
  post.publishedAt = publishedAt;
  await post.save();

  const populated = await BlogPost.findById(post._id).populate("categoryId", "name slug");
  return res.json(mapBlogPost(populated));
});

app.delete("/api/admin/blogs/:id", requireAdminAuth, async (req, res) => {
  const post = await BlogPost.findById(req.params.id).lean();
  if (!post) {
    return res.status(404).json({ message: "Blog post not found." });
  }

  await BlogPost.deleteOne({ _id: post._id });
  return res.json({ message: "Blog post deleted successfully." });
});

app.get("/api/products/popular", async (_, res) => {
  const products = await Product.find({ isActive: true, isMostPopular: true })
    .populate("categoryId", "name slug")
    .populate("brandId", "name slug image")
    .sort({ createdAt: -1 })
    .limit(12);

  return res.json(products.map(mapProduct));
});

app.get("/api/products/:slug", async (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  if (!slug) {
    return res.status(400).json({ message: "Product slug is required." });
  }

  const product = await Product.findOne({ slug, isActive: true })
    .populate("categoryId", "name slug")
    .populate("brandId", "name slug image");

  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  return res.json(mapProduct(product));
});

app.get("/api/products", async (_, res) => {
  const products = await Product.find({ isActive: true })
    .populate("categoryId", "name slug")
    .populate("brandId", "name slug image")
    .sort({ createdAt: -1 });

  return res.json(products.map(mapProduct));
});

app.get("/api/admin/products", requireAdminAuth, async (_, res) => {
  const products = await Product.find()
    .populate("categoryId", "name slug")
    .populate("brandId", "name slug image")
    .sort({ createdAt: -1 });
  return res.json(products.map(mapProduct));
});

app.post("/api/admin/products", requireAdminAuth, async (req, res) => {
  const {
    title,
    titleI18n = {},
    slug,
    description = "",
    descriptionI18n = {},
    shortDescription = "",
    shortDescriptionI18n = {},
    imageUrl,
    galleryImages = [],
    sku = "",
    tags = [],
    categoryId,
    brandId,
    monthlyPrice,
    buyerPrice = 0,
    offerPrice = 0,
    stock = 0,
    stockStatus = "in_stock",
    lowStockWarning = 5,
    maxRentalQuantity = 1,
    unit = "piece",
    weightKg = 0,
    minimumRentalMonths = 1,
    maximumRentalMonths = 24,
    minimumRentalWeeks,
    maximumRentalWeeks,
    minimumRentalDays = 7,
    maximumRentalDays = 30,
    rentalPeriodUnit = "week",
    deliveryFee = 0,
    verificationRequired = true,
    depositEnabled = false,
    securityDeposit = 0,
    replacementValue = 0,
    refundable = true,
    specifications = [],
    seo = {},
    isMostPopular = false,
    isActive = true,
  } = req.body;

  if (!(title || titleI18n?.en) || !slug || !imageUrl || !categoryId || !brandId || monthlyPrice === undefined) {
    return res.status(400).json({
      message: "title (or titleI18n.en), slug, imageUrl, categoryId, brandId, monthlyPrice are required.",
    });
  }

  const minimumRentalMonthsValue = toPositiveNumber(minimumRentalMonths, 1);
  const maximumRentalMonthsValue = toPositiveNumber(maximumRentalMonths, 24);
  if (minimumRentalMonthsValue > maximumRentalMonthsValue) {
    return res.status(400).json({ message: "minimumRentalMonths cannot be greater than maximumRentalMonths." });
  }

  const minimumRentalDaysValue = toPositiveNumber(minimumRentalDays, 7);
  const maximumRentalDaysValue = toPositiveNumber(maximumRentalDays, 30);
  if (minimumRentalDaysValue > maximumRentalDaysValue) {
    return res.status(400).json({ message: "minimumRentalDays cannot be greater than maximumRentalDays." });
  }

  const minimumRentalWeeksValue = toPositiveNumber(minimumRentalWeeks, Math.ceil(minimumRentalDaysValue / 7));
  const maximumRentalWeeksValue = toPositiveNumber(maximumRentalWeeks, Math.ceil(maximumRentalDaysValue / 7));
  if (minimumRentalWeeksValue > maximumRentalWeeksValue) {
    return res.status(400).json({ message: "minimumRentalWeeks cannot be greater than maximumRentalWeeks." });
  }

  const category = await Category.findById(categoryId).select("_id").lean();
  if (!category) {
    return res.status(400).json({ message: "categoryId not found." });
  }
  const brandRecord = await Brand.findById(brandId).select("_id name").lean();
  if (!brandRecord) {
    return res.status(400).json({ message: "brandId not found." });
  }

  const slugValue = String(slug).trim().toLowerCase();
  const existing = await Product.findOne({ slug: slugValue }).select("_id").lean();
  if (existing) {
    return res.status(409).json({ message: "Product slug already exists." });
  }

  const product = await Product.create({
    title: String(title || titleI18n?.en || "").trim(),
    titleI18n: {
      en: String(titleI18n?.en || title || "").trim(),
      de: String(titleI18n?.de || "").trim(),
    },
    slug: slugValue,
    description: String(description).trim(),
    descriptionI18n: {
      en: String(descriptionI18n?.en || description || "").trim(),
      de: String(descriptionI18n?.de || "").trim(),
    },
    shortDescription: String(shortDescription).trim(),
    shortDescriptionI18n: {
      en: String(shortDescriptionI18n?.en || shortDescription || "").trim(),
      de: String(shortDescriptionI18n?.de || "").trim(),
    },
    imageUrl: String(imageUrl).trim(),
    galleryImages: Array.isArray(galleryImages) ? galleryImages.filter(Boolean).map(String) : [],
    sku: String(sku).trim(),
    brand: brandRecord.name,
    brandId: brandRecord._id,
    tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    categoryId,
    monthlyPrice: Number(monthlyPrice),
    buyerPrice: Number(buyerPrice) || 0,
    offerPrice: Number(offerPrice) || 0,
    stock: Number(stock) || 0,
    stockStatus: String(stockStatus || "in_stock").trim(),
    lowStockWarning: Number(lowStockWarning) || 0,
    maxRentalQuantity: Number(maxRentalQuantity) || 1,
    unit: String(unit || "piece").trim(),
    weightKg: Number(weightKg) || 0,
    minimumRentalMonths: minimumRentalMonthsValue,
    maximumRentalMonths: maximumRentalMonthsValue,
    minimumRentalWeeks: minimumRentalWeeksValue,
    maximumRentalWeeks: maximumRentalWeeksValue,
    minimumRentalDays: minimumRentalDaysValue,
    maximumRentalDays: maximumRentalDaysValue,
    rentalPeriodUnit: ["day", "week", "month"].includes(String(rentalPeriodUnit))
      ? String(rentalPeriodUnit)
      : "week",
    deliveryFee: Math.max(0, Number(deliveryFee) || 0),
    verificationRequired: Boolean(verificationRequired),
    depositEnabled: Boolean(depositEnabled),
    securityDeposit: Boolean(depositEnabled) ? Number(securityDeposit) || 0 : 0,
    replacementValue: Number(replacementValue) || 0,
    refundable: Boolean(refundable),
    specifications: Array.isArray(specifications)
      ? specifications
          .map((spec) => ({
            key: String(spec?.key || "").trim(),
            value: String(spec?.value || "").trim(),
          }))
          .filter((spec) => spec.key && spec.value)
      : [],
    seo: {
      metaTitle: String(seo?.metaTitle || "").trim(),
      metaDescription: String(seo?.metaDescription || "").trim(),
      metaKeywords: Array.isArray(seo?.metaKeywords)
        ? seo.metaKeywords.map((keyword) => String(keyword).trim()).filter(Boolean)
        : [],
      canonicalUrl: String(seo?.canonicalUrl || "").trim(),
      ogTitle: String(seo?.ogTitle || "").trim(),
      ogDescription: String(seo?.ogDescription || "").trim(),
      ogImageUrl: String(seo?.ogImageUrl || "").trim(),
    },
    isMostPopular: Boolean(isMostPopular),
    isActive: Boolean(isActive),
  });

  const populated = await Product.findById(product._id)
    .populate("categoryId", "name slug")
    .populate("brandId", "name slug image");
  return res.status(201).json(mapProduct(populated));
});

app.put("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const {
    title,
    titleI18n = {},
    slug,
    description = "",
    descriptionI18n = {},
    shortDescription = "",
    shortDescriptionI18n = {},
    imageUrl,
    galleryImages = [],
    sku = "",
    tags = [],
    categoryId,
    brandId,
    monthlyPrice,
    buyerPrice = 0,
    offerPrice = 0,
    stock = 0,
    stockStatus = "in_stock",
    lowStockWarning = 5,
    maxRentalQuantity = 1,
    unit = "piece",
    weightKg = 0,
    minimumRentalMonths = 1,
    maximumRentalMonths = 24,
    minimumRentalWeeks,
    maximumRentalWeeks,
    minimumRentalDays = 7,
    maximumRentalDays = 30,
    rentalPeriodUnit = "week",
    deliveryFee = 0,
    verificationRequired = true,
    depositEnabled = false,
    securityDeposit = 0,
    replacementValue = 0,
    refundable = true,
    specifications = [],
    seo = {},
    isMostPopular = false,
    isActive = true,
  } = req.body;

  if (!(title || titleI18n?.en) || !slug || !imageUrl || !categoryId || !brandId || monthlyPrice === undefined) {
    return res.status(400).json({
      message: "title (or titleI18n.en), slug, imageUrl, categoryId, brandId, monthlyPrice are required.",
    });
  }

  const minimumRentalMonthsValue = toPositiveNumber(minimumRentalMonths, 1);
  const maximumRentalMonthsValue = toPositiveNumber(maximumRentalMonths, 24);
  if (minimumRentalMonthsValue > maximumRentalMonthsValue) {
    return res.status(400).json({ message: "minimumRentalMonths cannot be greater than maximumRentalMonths." });
  }

  const minimumRentalDaysValue = toPositiveNumber(minimumRentalDays, 7);
  const maximumRentalDaysValue = toPositiveNumber(maximumRentalDays, 30);
  if (minimumRentalDaysValue > maximumRentalDaysValue) {
    return res.status(400).json({ message: "minimumRentalDays cannot be greater than maximumRentalDays." });
  }

  const minimumRentalWeeksValue = toPositiveNumber(minimumRentalWeeks, Math.ceil(minimumRentalDaysValue / 7));
  const maximumRentalWeeksValue = toPositiveNumber(maximumRentalWeeks, Math.ceil(maximumRentalDaysValue / 7));
  if (minimumRentalWeeksValue > maximumRentalWeeksValue) {
    return res.status(400).json({ message: "minimumRentalWeeks cannot be greater than maximumRentalWeeks." });
  }

  const category = await Category.findById(categoryId).select("_id").lean();
  if (!category) {
    return res.status(400).json({ message: "categoryId not found." });
  }
  const brandRecord = await Brand.findById(brandId).select("_id name").lean();
  if (!brandRecord) {
    return res.status(400).json({ message: "brandId not found." });
  }

  const slugValue = String(slug).trim().toLowerCase();
  const duplicate = await Product.findOne({ slug: slugValue, _id: { $ne: product._id } })
    .select("_id")
    .lean();
  if (duplicate) {
    return res.status(409).json({ message: "Product slug already exists." });
  }

  product.title = String(title || titleI18n?.en || "").trim();
  product.titleI18n = {
    en: String(titleI18n?.en || title || "").trim(),
    de: String(titleI18n?.de || "").trim(),
  };
  product.slug = slugValue;
  product.description = String(description).trim();
  product.descriptionI18n = {
    en: String(descriptionI18n?.en || description || "").trim(),
    de: String(descriptionI18n?.de || "").trim(),
  };
  product.shortDescription = String(shortDescription).trim();
  product.shortDescriptionI18n = {
    en: String(shortDescriptionI18n?.en || shortDescription || "").trim(),
    de: String(shortDescriptionI18n?.de || "").trim(),
  };
  product.imageUrl = String(imageUrl).trim();
  product.galleryImages = Array.isArray(galleryImages) ? galleryImages.filter(Boolean).map(String) : [];
  product.sku = String(sku).trim();
  product.brand = brandRecord.name;
  product.brandId = brandRecord._id;
  product.tags = Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [];
  product.categoryId = categoryId;
  product.monthlyPrice = Number(monthlyPrice);
  product.buyerPrice = Number(buyerPrice) || 0;
  product.offerPrice = Number(offerPrice) || 0;
  product.stock = Number(stock) || 0;
  product.stockStatus = String(stockStatus || "in_stock").trim();
  product.lowStockWarning = Number(lowStockWarning) || 0;
  product.maxRentalQuantity = Number(maxRentalQuantity) || 1;
  product.unit = String(unit || "piece").trim();
  product.weightKg = Number(weightKg) || 0;
  product.minimumRentalMonths = minimumRentalMonthsValue;
  product.maximumRentalMonths = maximumRentalMonthsValue;
  product.minimumRentalWeeks = minimumRentalWeeksValue;
  product.maximumRentalWeeks = maximumRentalWeeksValue;
  product.minimumRentalDays = minimumRentalDaysValue;
  product.maximumRentalDays = maximumRentalDaysValue;
  product.rentalPeriodUnit = ["day", "week", "month"].includes(String(rentalPeriodUnit))
    ? String(rentalPeriodUnit)
    : "week";
  product.deliveryFee = Math.max(0, Number(deliveryFee) || 0);
  product.verificationRequired = Boolean(verificationRequired);
  product.depositEnabled = Boolean(depositEnabled);
  product.securityDeposit = Boolean(depositEnabled) ? Number(securityDeposit) || 0 : 0;
  product.replacementValue = Number(replacementValue) || 0;
  product.refundable = Boolean(refundable);
  product.specifications = Array.isArray(specifications)
    ? specifications
        .map((spec) => ({
          key: String(spec?.key || "").trim(),
          value: String(spec?.value || "").trim(),
        }))
        .filter((spec) => spec.key && spec.value)
    : [];
  product.seo = {
    metaTitle: String(seo?.metaTitle || "").trim(),
    metaDescription: String(seo?.metaDescription || "").trim(),
    metaKeywords: Array.isArray(seo?.metaKeywords)
      ? seo.metaKeywords.map((keyword) => String(keyword).trim()).filter(Boolean)
      : [],
    canonicalUrl: String(seo?.canonicalUrl || "").trim(),
    ogTitle: String(seo?.ogTitle || "").trim(),
    ogDescription: String(seo?.ogDescription || "").trim(),
    ogImageUrl: String(seo?.ogImageUrl || "").trim(),
  };
  product.isMostPopular = Boolean(isMostPopular);
  product.isActive = Boolean(isActive);
  await product.save();

  const populated = await Product.findById(product._id)
    .populate("categoryId", "name slug")
    .populate("brandId", "name slug image");
  return res.json(mapProduct(populated));
});

app.delete("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  await Product.deleteOne({ _id: product._id });
  return res.json({ message: "Product deleted successfully." });
});

app.post("/api/auth/check-email", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const existingUser = await User.findOne({ email }).select("_id").lean();
  return res.json({ exists: !!existingUser });
});

app.post("/api/support-requests", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const phone = String(req.body?.phone || "").trim();
  const subject = String(req.body?.subject || "").trim();
  const message = String(req.body?.message || "").trim();
  const source = String(req.body?.source || "footer").trim();
  const pageUrl = String(req.body?.pageUrl || "").trim();
  const locale = String(req.body?.locale || "en").trim().toLowerCase();

  if (!name || !email || !message) {
    return res.status(400).json({ message: "name, email and message are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Please provide a valid email address." });
  }

  const supportRequest = await SupportRequest.create({
    name,
    email,
    phone,
    subject,
    message,
    locale: locale === "de" ? "de" : "en",
    source,
    pageUrl,
    status: "new",
  });

  const notificationResult = await sendSupportRequestNotificationEmail(supportRequest);
  if (!notificationResult.adminSent) {
    console.warn("Support request email notification failed for request:", String(supportRequest._id));
  }

  return res.status(201).json({
    message: "Support request submitted successfully.",
    request: mapSupportRequest(supportRequest),
  });
});

app.get("/api/admin/support-requests", requireAdminAuth, async (_, res) => {
  const requests = await SupportRequest.find().sort({ createdAt: -1 });
  return res.json(requests.map(mapSupportRequest));
});

app.patch("/api/admin/support-requests/:id/status", requireAdminAuth, async (req, res) => {
  const status = String(req.body?.status || "").trim();
  if (!["new", "in_progress", "resolved"].includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  const supportRequest = await SupportRequest.findById(req.params.id);
  if (!supportRequest) {
    return res.status(404).json({ message: "Support request not found." });
  }

  supportRequest.status = status;
  await supportRequest.save();
  return res.json(mapSupportRequest(supportRequest));
});

app.get("/api/admin/orders", requireAdminAuth, async (_, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  return res.json(orders.map(mapOrder));
});

app.patch("/api/admin/orders/:id/fulfillment-status", requireAdminAuth, async (req, res) => {
  const fulfillmentStatus = String(req.body?.fulfillmentStatus || "")
    .trim()
    .toLowerCase();
  if (!VALID_FULFILLMENT_STATUSES.includes(fulfillmentStatus)) {
    return res.status(400).json({ message: "Invalid fulfillment status." });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  order.fulfillmentStatus = fulfillmentStatus;
  await order.save();
  await sendOrderFulfillmentStatusEmail(order);

  return res.json({
    message: "Order fulfillment status updated.",
    order: mapOrder(order),
  });
});

app.post("/api/auth/signup/request-otp", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const name = String(req.body?.name || "").trim();
  const password = String(req.body?.password || "").trim();
  const phone = req.body?.phone ? String(req.body.phone).trim() : null;

  if (!email || !name || !password) {
    return res.status(400).json({ message: "name, email and password are required." });
  }

  if (phone && !isValidGermanPhone(phone)) {
    return res.status(400).json({
      message: "Phone must be a valid Germany number in +49 format.",
    });
  }

  const existingUser = await User.findOne({ email }).select("_id").lean();
  if (existingUser) {
    return res.status(409).json({ message: "User already exists." });
  }

  if (!canSendEmail) {
    return res.status(500).json({ message: "Email service is not configured." });
  }

  const otp = buildSixDigitOtp();
  const otpHash = hashOtp(otp);
  const expiresInMinutes = Math.max(1, Number(process.env.SIGNUP_OTP_EXPIRES_MINUTES || 10));
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  const passwordHash = await bcrypt.hash(password, 10);

  await SignupOtp.findOneAndUpdate(
    { email },
    {
      email,
      name,
      passwordHash,
      phone,
      otpHash,
      expiresAt,
      attempts: 0,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  const sent = await sendSignupOtpEmail(email, otp, name);
  if (!sent) {
    return res.status(500).json({ message: "Could not send verification email. Please try again." });
  }

  return res.status(201).json({
    message: "Verification code sent to your email.",
    email,
    expiresInMinutes,
  });
});

app.post("/api/auth/signup/verify-otp", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const otp = String(req.body?.otp || "").trim();

  if (!email || !otp) {
    return res.status(400).json({ message: "email and otp are required." });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: "OTP must be a 6-digit code." });
  }

  const pendingSignup = await SignupOtp.findOne({ email });
  if (!pendingSignup) {
    return res.status(404).json({ message: "No pending signup found for this email." });
  }

  if (pendingSignup.expiresAt.getTime() < Date.now()) {
    await SignupOtp.deleteOne({ _id: pendingSignup._id });
    return res.status(400).json({ message: "OTP expired. Please request a new code." });
  }

  const expectedHash = hashOtp(otp);
  if (expectedHash !== pendingSignup.otpHash) {
    pendingSignup.attempts = (pendingSignup.attempts || 0) + 1;
    if (pendingSignup.attempts >= 5) {
      await SignupOtp.deleteOne({ _id: pendingSignup._id });
      return res.status(400).json({ message: "Too many incorrect attempts. Request a new code." });
    }
    await pendingSignup.save();
    return res.status(400).json({ message: "Invalid OTP code." });
  }

  const existingUser = await User.findOne({ email }).select("_id").lean();
  if (existingUser) {
    await SignupOtp.deleteOne({ _id: pendingSignup._id });
    return res.status(409).json({ message: "User already exists." });
  }

  const user = await User.create({
    name: pendingSignup.name,
    email: pendingSignup.email,
    passwordHash: pendingSignup.passwordHash,
    phone: pendingSignup.phone || null,
  });

  await SignupOtp.deleteOne({ _id: pendingSignup._id });

  const token = buildUserToken(user);
  return res.status(201).json({
    message: "Signup successful.",
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: normalizeAddressInput(user.address),
      wishlistProductIds: [],
      identityVerified: Boolean(user.identityVerified),
    },
  });
});

app.post("/api/auth/signup", async (req, res) => {
  return res.status(400).json({
    message: "Use /api/auth/signup/request-otp and /api/auth/signup/verify-otp for signup.",
  });
});

app.post("/api/auth/signin", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "").trim();
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required." });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = buildUserToken(user);
  return res.json({
    message: "Signin successful.",
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: normalizeAddressInput(user.address),
      wishlistProductIds: Array.isArray(user.wishlistProductIds)
        ? user.wishlistProductIds.map((id) => String(id))
        : [],
      identityVerified: Boolean(user.identityVerified),
    },
  });
});

app.post("/api/auth/google", async (req, res) => {
  const credential = String(req.body?.credential || req.body?.idToken || "").trim();
  if (!credential) {
    return res.status(400).json({ message: "Google credential is required." });
  }

  const configuredGoogleClientId = String(
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
  ).trim();
  if (!configuredGoogleClientId) {
    return res.status(500).json({ message: "Google Sign-In is not configured on the server." });
  }

  let tokenPayload;
  try {
    tokenPayload = await verifyGoogleIdToken(credential);
  } catch {
    return res.status(401).json({ message: "Invalid Google credential." });
  }

  const aud = String(tokenPayload?.aud || "").trim();
  const sub = String(tokenPayload?.sub || "").trim();
  const email = String(tokenPayload?.email || "").trim().toLowerCase();
  const emailVerified = String(tokenPayload?.email_verified || "").toLowerCase() === "true";
  const name = String(tokenPayload?.name || "").trim();

  if (!sub || !email || !emailVerified) {
    return res.status(401).json({ message: "Google account verification failed." });
  }

  if (aud !== configuredGoogleClientId) {
    return res.status(401).json({ message: "Google client ID mismatch." });
  }

  let user = await User.findOne({ email });
  if (!user) {
    const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
    user = await User.create({
      name: name || email.split("@")[0] || "Google User",
      email,
      passwordHash,
      phone: null,
    });
  } else if (!user.name && name) {
    user.name = name;
    await user.save();
  }

  const token = buildUserToken(user);
  return res.json({
    message: "Google signin successful.",
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: normalizeAddressInput(user.address),
      wishlistProductIds: Array.isArray(user.wishlistProductIds)
        ? user.wishlistProductIds.map((id) => String(id))
        : [],
      identityVerified: Boolean(user.identityVerified),
    },
  });
});

app.get("/api/auth/me", requireUserAuth, async (req, res) => {
  const user = await User.findById(req.userAuth.sub);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: normalizeAddressInput(user.address),
      wishlistProductIds: Array.isArray(user.wishlistProductIds)
        ? user.wishlistProductIds.map((id) => String(id))
        : [],
      identityVerified: Boolean(user.identityVerified),
    },
  });
});

app.get("/api/wishlist", requireUserAuth, async (req, res) => {
  const user = await User.findById(req.userAuth.sub).populate({
    path: "wishlistProductIds",
    populate: [
      { path: "categoryId", select: "name slug" },
      { path: "brandId", select: "name slug image" },
    ],
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const products = (user.wishlistProductIds || []).filter(Boolean).map(mapProduct);
  return res.json({
    productIds: products.map((product) => product.id),
    products,
  });
});

app.post("/api/wishlist/:productId", requireUserAuth, async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  const user = await User.findById(req.userAuth.sub);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const product = await Product.findById(productId).select("_id isActive").lean();
  if (!product || !product.isActive) {
    return res.status(404).json({ message: "Product not found." });
  }

  const exists = (user.wishlistProductIds || []).some((id) => String(id) === String(product._id));
  if (!exists) {
    user.wishlistProductIds.push(product._id);
    await user.save();
  }

  return res.status(201).json({
    message: "Added to wishlist.",
    productIds: (user.wishlistProductIds || []).map((id) => String(id)),
  });
});

app.delete("/api/wishlist/:productId", requireUserAuth, async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  const user = await User.findById(req.userAuth.sub);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  user.wishlistProductIds = (user.wishlistProductIds || []).filter((id) => String(id) !== productId);
  await user.save();

  return res.json({
    message: "Removed from wishlist.",
    productIds: (user.wishlistProductIds || []).map((id) => String(id)),
  });
});

app.get("/api/payments/identity-status", requireUserAuth, async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured." });
  }

  const user = await User.findById(req.userAuth.sub);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (!user.identityVerified && user.stripeIdentitySessionId) {
    try {
      const verificationSession = await stripe.identity.verificationSessions.retrieve(
        user.stripeIdentitySessionId
      );
      if (verificationSession.status === "verified") {
        user.identityVerified = true;
        await user.save();
      }
    } catch {}
  }

  return res.json({
    verified: Boolean(user.identityVerified),
    verificationSessionId: user.stripeIdentitySessionId || "",
  });
});

app.post("/api/payments/identity-session", requireUserAuth, async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured." });
  }

  const user = await User.findById(req.userAuth.sub);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (user.identityVerified) {
    return res.json({ verified: true });
  }

  const frontendBaseUrl = getFrontendBaseUrl();
  const verificationSession = await stripe.identity.verificationSessions.create({
    type: "document",
    metadata: {
      userId: String(user._id),
      email: user.email,
    },
    return_url: `${frontendBaseUrl}/checkout?identity_return=1`,
  });

  user.stripeIdentitySessionId = verificationSession.id;
  await user.save();

  return res.status(201).json({
    verified: false,
    sessionId: verificationSession.id,
    url: verificationSession.url,
  });
});

app.post("/api/payments/checkout-session", requireUserAuth, async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured." });
  }

  const user = await User.findById(req.userAuth.sub);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const shippingAddressRaw = req.body?.shippingAddress || {};
  if (items.length === 0) {
    return res.status(400).json({ message: "Cart items are required." });
  }

  const shippingAddress = {
    fullName: String(shippingAddressRaw.fullName || "").trim(),
    phone: String(shippingAddressRaw.phone || "").trim(),
    line1: String(shippingAddressRaw.line1 || "").trim(),
    line2: String(shippingAddressRaw.line2 || "").trim(),
    city: String(shippingAddressRaw.city || "").trim(),
    state: String(shippingAddressRaw.state || "").trim(),
    postalCode: String(shippingAddressRaw.postalCode || "").trim(),
    country: String(shippingAddressRaw.country || "").trim(),
  };

  if (
    !shippingAddress.fullName ||
    !shippingAddress.phone ||
    !shippingAddress.line1 ||
    !shippingAddress.city ||
    !shippingAddress.postalCode ||
    !shippingAddress.country
  ) {
    return res.status(400).json({ message: "Shipping address is required." });
  }

  const normalizedItems = items
    .map((item) => {
      const title = String(item?.title || "").trim();
      const quantity = Math.max(1, Number(item?.quantity) || 1);
      const amount = Number(item?.unitPrice) || 0;
      const baseUnitPrice = Number(item?.baseUnitPrice) || amount;
      const durationLabel = String(item?.durationLabel || "").trim();
      const durationValue = Math.max(1, Number(item?.durationValue) || 1);
      const durationUnit = ["day", "week", "month"].includes(String(item?.durationUnit))
        ? String(item?.durationUnit)
        : "week";
      const startDate = String(item?.startDate || "").trim();
      const depositEnabled = Boolean(item?.depositEnabled);
      const securityDeposit = depositEnabled ? Number(item?.securityDeposit) || 0 : 0;
      const deliveryFee = Math.max(0, Number(item?.deliveryFee) || 0);
      const productId = String(item?.productId || "").trim();
      const slug = String(item?.slug || "").trim();
      const imageUrl = String(item?.imageUrl || "").trim();
      const categoryName = String(item?.categoryName || "").trim();
      const brandName = String(item?.brandName || "").trim();

      if (!title || amount <= 0) return null;

      const lineSubtotal = amount * quantity;
      const lineDeposit = securityDeposit * quantity;
      return {
        productId,
        title,
        slug,
        imageUrl,
        categoryName,
        brandName,
        quantity,
        unitPrice: amount,
        baseUnitPrice,
        durationValue,
        durationUnit,
        startDate,
        depositEnabled,
        securityDeposit,
        deliveryFee,
        lineSubtotal,
        lineDeposit,
        lineDelivery: 0,
        lineTotal: lineSubtotal + lineDeposit,
        currency: WEBSITE_CURRENCY,
        durationLabel,
      };
    })
    .filter(Boolean);

  if (normalizedItems.length === 0) {
    return res.status(400).json({ message: "No valid cart line items found." });
  }

  const productIds = [
    ...new Set(
      normalizedItems
        .map((item) => String(item.productId || "").trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    ),
  ];

  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).select("_id verificationRequired deliveryFee").lean()
    : [];
  const productById = new Map(products.map((product) => [String(product._id), product]));

  const itemsWithDelivery = normalizedItems.map((item) => {
    const productId = String(item.productId || "").trim();
    const product = mongoose.Types.ObjectId.isValid(productId) ? productById.get(productId) : null;
    const deliveryFeeFromProduct = product ? Math.max(0, Number(product.deliveryFee) || 0) : null;
    const deliveryFee = deliveryFeeFromProduct ?? Math.max(0, Number(item.deliveryFee) || 0);
    const lineDelivery = deliveryFee * item.quantity;
    return {
      ...item,
      deliveryFee,
      lineDelivery,
      lineTotal: item.lineSubtotal + item.lineDeposit + lineDelivery,
    };
  });

  const requiresIdentityVerification = itemsWithDelivery.some((item) => {
    const productId = String(item.productId || "").trim();
    if (!mongoose.Types.ObjectId.isValid(productId)) return true;
    const product = productById.get(productId);
    if (!product) return true;
    return product.verificationRequired !== false;
  });

  if (requiresIdentityVerification && !user.identityVerified) {
    return res.status(403).json({
      message: "Identity verification is required for one or more selected products.",
    });
  }

  const lineItems = itemsWithDelivery
    .map((item) => {
      const perUnitTotal = item.unitPrice + item.securityDeposit + item.deliveryFee;
      return {
        quantity: item.quantity,
        price_data: {
          currency: WEBSITE_CURRENCY,
          unit_amount: Math.round(perUnitTotal * 100),
          product_data: {
            name: item.title,
            description: item.durationLabel ? `Rental period: ${item.durationLabel}` : undefined,
          },
        },
      };
    });

  const subtotal = itemsWithDelivery.reduce((sum, item) => sum + item.lineSubtotal, 0);
  const depositTotal = itemsWithDelivery.reduce((sum, item) => sum + item.lineDeposit, 0);
  const deliveryTotal = itemsWithDelivery.reduce((sum, item) => sum + item.lineDelivery, 0);
  const total = subtotal + depositTotal + deliveryTotal;
  const orderNumber = buildOrderNumber();
  const order = await Order.create({
    orderNumber,
    userId: user._id,
    customer: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
    },
    shippingAddress,
    items: itemsWithDelivery.map((item) => ({
      productId: /^[a-f\d]{24}$/i.test(item.productId || "") ? item.productId : null,
      title: item.title,
      slug: item.slug,
      imageUrl: item.imageUrl,
      categoryName: item.categoryName,
      brandName: item.brandName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      baseUnitPrice: item.baseUnitPrice,
      durationValue: item.durationValue,
      durationUnit: item.durationUnit,
      startDate: item.startDate,
      depositEnabled: item.depositEnabled,
      securityDeposit: item.securityDeposit,
      deliveryFee: item.deliveryFee,
      lineSubtotal: item.lineSubtotal,
      lineDeposit: item.lineDeposit,
      lineDelivery: item.lineDelivery,
      lineTotal: item.lineTotal,
    })),
    currency: WEBSITE_CURRENCY,
    subtotal,
    depositTotal,
    deliveryTotal,
    total,
    status: "pending_payment",
    fulfillmentStatus: "pending",
    paymentStatus: "unpaid",
  });

  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
      metadata: {
        userId: String(user._id),
      },
    });
    user.stripeCustomerId = customer.id;
    await user.save();
  }

  const frontendBaseUrl = getFrontendBaseUrl();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: user.stripeCustomerId,
    line_items: lineItems,
    metadata: {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      userId: String(user._id),
    },
    success_url: `${frontendBaseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendBaseUrl}/checkout?canceled=1`,
  });

  order.stripeCheckoutSessionId = checkoutSession.id;
  await order.save();

  return res.status(201).json({
    id: checkoutSession.id,
    url: checkoutSession.url,
    orderId: String(order._id),
    orderNumber: order.orderNumber,
  });
});

app.post("/api/payments/checkout-confirm", requireUserAuth, async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured." });
  }

  const sessionId = String(req.body?.sessionId || "").trim();
  if (!sessionId) {
    return res.status(400).json({ message: "sessionId is required." });
  }

  const user = await User.findById(req.userAuth.sub).select("_id").lean();
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  const order = await Order.findOne({
    stripeCheckoutSessionId: sessionId,
    userId: user._id,
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found for this checkout session." });
  }

  if (checkoutSession.payment_status !== "paid") {
    if (order.status !== "pending_payment") {
      order.status = "pending_payment";
      order.fulfillmentStatus = "pending";
      order.paymentStatus = "unpaid";
      await order.save();
    }
    return res.status(409).json({ message: "Payment is not completed yet." });
  }

  order.status = "paid";
  order.fulfillmentStatus = order.fulfillmentStatus === "pending" ? "processing" : order.fulfillmentStatus;
  order.paymentStatus = "paid";
  order.stripePaymentIntentId = String(checkoutSession.payment_intent || "");
  await order.save();

  return res.json({
    message: "Order payment confirmed.",
    order: mapOrder(order),
  });
});

app.put("/api/auth/profile", requireUserAuth, async (req, res) => {
  const user = await User.findById(req.userAuth.sub);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const name = req.body?.name ? String(req.body.name).trim() : user.name;
  const phone = req.body?.phone !== undefined ? String(req.body.phone || "").trim() : user.phone;
  const address =
    req.body?.address !== undefined ? normalizeAddressInput(req.body.address) : normalizeAddressInput(user.address);

  if (!name) {
    return res.status(400).json({ message: "Name is required." });
  }

  if (phone && !isValidGermanPhone(phone)) {
    return res.status(400).json({
      message: "Phone must be a valid Germany number in +49 format.",
    });
  }

  user.name = name;
  user.phone = phone || null;
  user.address = address;
  await user.save();

  return res.json({
    message: "Profile updated successfully.",
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: normalizeAddressInput(user.address),
    },
  });
});

app.put("/api/auth/change-password", requireUserAuth, async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || "").trim();
  const newPassword = String(req.body?.newPassword || "").trim();

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

  const user = await User.findById(req.userAuth.sub);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: "Current password is incorrect." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.json({ message: "Password changed successfully." });
});

app.delete("/api/auth/account", requireUserAuth, async (req, res) => {
  const password = String(req.body?.password || "").trim();
  if (!password) {
    return res.status(400).json({ message: "Password is required to delete account." });
  }

  const user = await User.findById(req.userAuth.sub);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: "Password is incorrect." });
  }

  await User.deleteOne({ _id: user._id });
  return res.json({ message: "Account deleted successfully." });
});

async function startServer() {
  await initializeApp();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!canSendEmail) {
      console.warn("SMTP is not fully configured. Email notifications are disabled.");
    }

    const reminderIntervalMs = Math.max(10, Number(process.env.RENTAL_REMINDER_INTERVAL_MINUTES || 60)) * 60 * 1000;
    const runSweep = async () => {
      try {
        await runRentalEndingReminderSweep();
      } catch (error) {
        console.error("Rental reminder sweep failed:", error.message);
      }
    };

    runSweep();
    setInterval(runSweep, reminderIntervalMs);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
}

module.exports = {
  app,
  initializeApp,
  runRentalEndingReminderSweep,
};
