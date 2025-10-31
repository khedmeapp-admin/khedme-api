// ✅ Load environment variables first
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import pg from "pg";

// ---------------------------------------------------
// Express setup
// ---------------------------------------------------
const { Pool } = pg;
const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------
// Database connection (SSL enforced for Supabase)
// ---------------------------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connection successful");
    client.release();
  } catch (err) {
    console.error("❌ DB test failed:", err.message);
  }
})();

// Attach pool to all requests
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// ---------------------------------------------------
// Health check routes (for Render + local testing)
// ---------------------------------------------------
app.get("/", (_, res) => res.send("Khedme API is running ✅"));
app.get("/health", (_, res) =>
  res.json({ success: true, message: "Khedme API is healthy 🚀" })
);
app.get("/api/health", (_, res) =>
  res.json({ success: true, message: "Khedme API is healthy 🚀" })
);

// ---------------------------------------------------
// Core routes
// ---------------------------------------------------
import adminRouter from "./routes/admin.js";
import jobsRouter from "./routes/jobs.js";
import providerRouter from "./routes/providers.js";
import authRouter from "./routes/auth.js";
import applyRouter from "./routes/apply.js";

app.use("/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/providers", providerRouter);
app.use("/api/jobs", applyRouter);

// ---------------------------------------------------
// 🪄 Lazy-load meta route AFTER envs are guaranteed loaded
// ---------------------------------------------------
const loadMetaRoute = async () => {
  try {
    const { default: metaRouter } = await import("./routes/meta.js");
    app.use("/api/meta", metaRouter);
    console.log("✅ Meta route loaded successfully");
  } catch (err) {
    console.error("❌ Failed to load meta route:", err.message);
  }
};
loadMetaRoute();

// ---------------------------------------------------
// Keep alive + start server
// ---------------------------------------------------
setInterval(() => console.log("⏳ Keeping container alive..."), 60000);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🚀 Khedme API running on port ${PORT}`)
);
