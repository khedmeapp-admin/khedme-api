// backend/routes/auth.js – real OTP email + debug logs (zero raw keys)
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import nodemailer from "nodemailer";

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const OTP_EXPIRY_MINUTES = 10;

// in-memory OTP store (move to Redis later)
const otpStore = {};

// real transporter + debug
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // 16-char app password
  },
  logger: true,
  debug: true,
});

transporter.verify(function (error, success) {
  if (error) console.log("❌ SMTP verify error:", error);
  else console.log("✅ SMTP ready:", success);
});

// Lebanese phone formatter
function formatLebanesePhone(phone) {
  let p = phone.replace(/[^0-9+]/g, "");
  if (p.startsWith("+961")) return p;
  if (p.startsWith("0")) p = p.slice(1);
  if (/^[1-9]\d{7}$/.test(p)) return "+961" + p;
  return null;
}

/* ---------- POST /auth/request-otp  ---------- */
router.post("/request-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = dayjs().tz("Asia/Beirut").add(OTP_EXPIRY_MINUTES, "minute").toISOString();
  otpStore[email] = { code, expiresAt };

  try {
    await transporter.sendMail({
      from: `"Khedme" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Khedme verification code",
      text: `Your OTP is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    });
    console.log(`[OTP] ${email}: ${code}`);
    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("❌ Send OTP error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP", debug: err.message });
  }
});

/* ---------- POST /auth/verify-otp ---------- */
router.post("/verify-otp", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: "Email and code required" });

  const record = otpStore[email];
  if (!record) return res.status(400).json({ message: "OTP not requested" });
  if (dayjs().tz("Asia/Beirut").isAfter(dayjs(record.expiresAt))) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP expired" });
  }
  if (record.code !== code) return res.status(400).json({ message: "Invalid OTP" });

  delete otpStore[email];
  res.json({ success: true, message: "OTP verified" });
});

/* ---------- POST /auth/create-user ---------- */
router.post("/create-user", async (req, res) => {
  const pool = req.app.get("pool");
  let { full_name, dob, district, email, phone, password } = req.body;

  if (!full_name || !dob || !district || !email || !phone || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const formattedPhone = formatLebanesePhone(phone);
  if (!formattedPhone) return res.status(400).json({ message: "Invalid Lebanese number" });

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR phone = $2",
      [email, formattedPhone]
    );
    if (existing.rowCount > 0) return res.status(400).json({ message: "Email or phone already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (full_name, dob, district_id, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'client')
       RETURNING id, full_name, email, role`,
      [full_name, dob, district, email, formattedPhone, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, user });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- POST /auth/login ---------- */
router.post("/login", async (req, res) => {
  const pool = req.app.get("pool");
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const result = await pool.query("SELECT id, full_name, email, password, role FROM users WHERE email = $1", [email]);
    if (result.rowCount === 0) return res.status(400).json({ message: "Invalid credentials" });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;