import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// OTP routes
app.post("/auth/request-otp", async (req, res) => {
  const { phone, role } = req.body;
  if (!phone || !phone.startsWith("+961"))
    return res.status(400).json({ message: "Invalid Lebanese number" });

  // TODO: send real OTP via SMS
  return res.json({ providerId: "demo-123", message: "OTP sent (demo code: 123456)" });
});

app.post("/auth/verify-otp", async (req, res) => {
  const { providerId, otp } = req.body;
  if (otp !== "123456") return res.status(400).json({ message: "Wrong code" });
  return res.json({ message: "Provider verified" });
});

// Root route
app.get("/", (req, res) => {
  res.send("Khedme API is running ✅");
});

// Pending providers
app.get("/api/providers/pending", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM providers WHERE approved = false"
    );
    res.status(200).json({ providers: rows });
  } catch (err) {
    console.error("[PENDING PROVIDERS ERROR]:", err);
    res.status(500).json({ message: "Server error while fetching providers" });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Keep Railway alive
setInterval(() => console.log("⏳ Keeping container alive..."), 60000);