// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

// Import routes
import jobsRouter from "./routes/jobs.js";
import providerRouter from "./routes/providers.js";
import authRouter from "./routes/auth.js"; // 👈 added

dotenv.config();
const { Pool } = pkg;
const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ PostgreSQL connection (shared pool)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false },
});

// ✅ Attach pool globally
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// ✅ Health Check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ✅ Root
app.get("/", (req, res) => res.send("Khedme API is running ✅"));

// ✅ Routes
app.use("/api/jobs", jobsRouter);
app.use("/api/providers", providerRouter);
app.use("/auth", authRouter); // 👈 new clean mount

// ✅ Keep container alive (Render)
setInterval(() => console.log("⏳ Keeping container alive..."), 60000);

// ✅ Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Khedme API running on port ${PORT}`));
