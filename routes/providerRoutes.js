import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

// ✅ Get all pending providers (used by admin dashboard)
router.get("/pending", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM providers WHERE approved = FALSE ORDER BY created_at ASC"
    );
    res.status(200).json({ providers: rows });
  } catch (err) {
    console.error("[GET PENDING PROVIDERS ERROR]:", err);
    res.status(500).json({ message: "Error fetching pending providers" });
  }
});

// ✅ Approve a provider by ID
router.post("/approve", async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: "Missing provider ID" });
  }

  try {
    const { rowCount } = await pool.query(
      "UPDATE providers SET approved = TRUE WHERE id = $1",
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.status(200).json({ message: "Provider approved successfully" });
  } catch (err) {
    console.error("[APPROVE PROVIDER ERROR]:", err);
    res.status(500).json({ message: "Error approving provider" });
  }
});

// ✅ Get a single provider by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query("SELECT * FROM providers WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Provider not found" });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("[GET PROVIDER ERROR]:", err);
    res.status(500).json({ message: "Error fetching provider" });
  }
});

export default router;
