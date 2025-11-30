// -----------------------------------------
// Load environment variables
// -----------------------------------------
import "./loadEnv.js";

import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;
const app = express();

// -----------------------------------------
// Middleware
// -----------------------------------------
app.use(cors());
app.use(express.json());

// -----------------------------------------
// PostgreSQL Connection (Supabase)
// -----------------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

// Test DB connection
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connection successful");
    client.release();
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  }
})();

// Make pool globally available
app.set("pool", pool);

// -----------------------------------------
// Health Checks
// -----------------------------------------
app.get("/", (_, res) =>
  res.send("Khedme API is running ✅")
);

app.get("/health", (_, res) =>
  res.json({ success: true, message: "Khedme API is healthy 🚀" })
);

app.get("/api/health", (_, res) =>
  res.json({ success: true, message: "Khedme API is healthy 🚀" })
);

// -----------------------------------------
// Import Routes
// -----------------------------------------
import authRouter from "./routes/auth.js";
import jobsRouter from "./routes/jobs.js";
import providerRouter from "./routes/providers.js";
import adminRouter from "./routes/admin.js";
import applyRouter from "./routes/apply.js";
import adsRouter from "./routes/ads.js";

// -----------------------------------------
// Mount Routes (Correct order)
// -----------------------------------------
app.use("/auth", authRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/jobs", applyRouter);
app.use("/api/providers", providerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/ads", adsRouter);

// -----------------------------------------
// Lazy load meta after environment is ready
// -----------------------------------------
const loadMetaRoute = async () => {
  try {
    const { default: metaRouter } = await import("./routes/meta.js");
    app.use("/api/meta", metaRouter);
    console.log("✅ /api/meta route loaded");
  } catch (err) {
    console.error("❌ Failed to load /api/meta route:", err.message);
  }
};

await loadMetaRoute();

// -----------------------------------------
// Keep Alive (Render)
// -----------------------------------------
setInterval(() => {
  console.log("⏳ Keep-alive ping...");
}, 60000);

// -----------------------------------------
// Start Server
// -----------------------------------------
const PORT = process.env.PORT || 10000;

app.listen(PORT, () =>
  console.log(`🚀 Khedme API running on port ${PORT}`)
);

export default app;
