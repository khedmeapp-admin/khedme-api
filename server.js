// Load environment variables
import "./loadEnv.js";

import express from "express";
import cors from "cors";
import pg from "pg";

// Import routes
import authRouter from "./routes/auth.js";
import adminRoutes from "./routes/admin.js"; // <-- NEW

// ---------------------------------------------------
// Express setup
// ---------------------------------------------------
const { Pool } = pg;
const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------
// Database connection
// ---------------------------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

app.set("pool", pool);

// ---------------------------------------------------
// Health check
// ---------------------------------------------------
app.get("/", (_, res) => res.send("Khedme API is running ✅"));

// ---------------------------------------------------
// Mount routes
// ---------------------------------------------------
app.use("/auth", authRouter);
app.use("/api/admin", adminRoutes); // <-- NEW

// ---------------------------------------------------
// Start server
// ---------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Khedme API running on port ${PORT}`));