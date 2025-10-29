// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";

// ✅ Import routes
import adminRouter from "./routes/admin.js";
import jobsRouter from "./routes/jobs.js";
import providerRouter from "./routes/providers.js";
import authRouter from "./routes/auth.js";
import applyRouter from "./routes/apply.js";
import metaRouter from "./routes/meta.js"; // ✅ Meta route (categories + districts)

dotenv.config();
const { Pool } = pg;
const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ PostgreSQL connection (shared pool)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Supabase SSL
});

// ✅ Attach pool to every request
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// ✅ Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ✅ Root
app.get("/", (req, res) => res.send("Khedme API is running ✅"));

// ✅ Routes
app.use("/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/providers", providerRouter);
app.use("/api/jobs", applyRouter);
app.use("/api/meta", metaRouter); // ✅ Unified meta endpoint

// ✅ Keep Render container awake
setInterval(() => console.log("⏳ Keeping container alive..."), 60000);

// ✅ Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Khedme API running on port ${PORT}`)
);
