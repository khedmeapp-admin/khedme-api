// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import jobsRouter from "./routes/jobs.js";

dotenv.config();

const { Pool } = pg;
const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ PostgreSQL connection (shared pool)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Render + Supabase
});

// ✅ Test connection once
pool
  .connect()
  .then(() => console.log("✅ Connected to Supabase PostgreSQL (SSL enabled)"))
  .catch((err) => console.error("❌ Database connection failed:", err.message))
  .finally(() => console.log("💡 Connection test complete"));

// ✅ Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Khedme API is running ✅");
});

// ✅ JOB ROUTES (with pool middleware)
app.use(
  "/api/jobs",
  (req, res, next) => {
    req.pool = pool;
    next();
  },
  jobsRouter
);

// ✅ OTP demo routes
app.post("/auth/request-otp", async (req, res) => {
  const { phone, role } = req.body;
  if (!phone || !phone.startsWith("+961")) {
    return res.status(400).json({ message: "Invalid Lebanese number" });
  }
  return res.json({
    providerId: "demo-123",
    message: "OTP sent (demo code: 123456)",
  });
});

app.post("/auth/verify-otp", async (req, res) => {
  const { providerId, otp } = req.body;
  if (otp !== "123456") {
    return res.status(400).json({ message: "Wrong code" });
  }
  return res.json({ message: "Provider verified" });
});

// ✅ Provider management
app.get("/api/providers/pending", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM providers WHERE approved = false"
    );
    res.status(200).json({ providers: rows });
  } catch (err) {
    console.error("[GET PENDING PROVIDERS ERROR]:", err.message);
    res.status(500).json({ message: "Server error while fetching providers" });
  }
});

app.all("/api/providers/approve", async (req, res) => {
  try {
    const providerId = req.query.id;
    if (!providerId)
      return res.status(400).json({ message: "Missing provider ID" });

    const result = await pool.query(
      "UPDATE providers SET approved = true WHERE id = $1 RETURNING *",
      [providerId]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Provider not found" });

    res.status(200).json({
      message: "Provider approved successfully",
      provider: result.rows[0],
    });
  } catch (err) {
    console.error("[APPROVE PROVIDER ERROR]:", err.message);
    res.status(500).json({ message: "Server error while approving provider" });
  }
});

app.get("/api/provider/:id", async (req, res) => {
  try {
    const providerId = req.params.id;
    const result = await pool.query("SELECT * FROM providers WHERE id = $1", [
      providerId,
    ]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Provider not found" });

    res.status(200).json({ provider: result.rows[0] });
  } catch (err) {
    console.error("[GET PROVIDER ERROR]:", err.message);
    res.status(500).json({ message: "Server error while fetching provider" });
  }
});

// ✅ Keep Render container alive
setInterval(() => console.log("⏳ Keeping container alive..."), 60000);

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Khedme API running on port ${PORT}`);
});
