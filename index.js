import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json());

// ✅ PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Khedme API is running ✅");
});

// ✅ Pending providers
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

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Prevent Railway from shutting down
setInterval(() => {
  console.log("⏳ Keeping container alive...");
}, 60000);
