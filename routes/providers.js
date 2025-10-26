// routes/providers.js
import express from "express";
const router = express.Router();

/* ---------------------------------------------------
   ✅ Get all pending providers (for admin dashboard)
--------------------------------------------------- */
router.get("/pending", async (req, res) => {
  const pool = req.pool;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM providers WHERE approved = false ORDER BY created_at ASC"
    );
    res.status(200).json({ providers: rows });
  } catch (err) {
    console.error("[GET PENDING PROVIDERS ERROR]:", err.message);
    res.status(500).json({ message: "Error fetching pending providers" });
  }
});

/* ---------------------------------------------------
   ✅ Approve provider by ID (used by admin)
   Usage: POST /api/providers/approve?id=123
--------------------------------------------------- */
router.post("/approve", async (req, res) => {
  const pool = req.pool;
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Missing provider ID" });

  try {
    const { rowCount } = await pool.query(
      "UPDATE providers SET approved = true WHERE id = $1",
      [id]
    );
    if (rowCount === 0) return res.status(404).json({ message: "Provider not found" });

    res.status(200).json({ message: "Provider approved successfully" });
  } catch (err) {
    console.error("[APPROVE PROVIDER ERROR]:", err.message);
    res.status(500).json({ message: "Error approving provider" });
  }
});

/* ---------------------------------------------------
   ✅ Reject provider by ID (mark as rejected)
--------------------------------------------------- */
router.post("/reject", async (req, res) => {
  const pool = req.pool;
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Missing provider ID" });

  try {
    const { rowCount } = await pool.query(
      "UPDATE providers SET rejected = true, approved = false WHERE id = $1",
      [id]
    );

    if (rowCount === 0)
      return res.status(404).json({ message: "Provider not found" });

    res.status(200).json({ message: "Provider rejected successfully" });
  } catch (err) {
    console.error("[REJECT PROVIDER ERROR]:", err.message);
    res.status(500).json({ message: "Error rejecting provider" });
  }
});

router.post("/reject", async (req, res) => {
  const pool = req.pool;
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Missing provider ID" });

  try {
    const { rowCount } = await pool.query("DELETE FROM providers WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ message: "Provider not found" });

    res.status(200).json({ message: "Provider rejected and removed" });
  } catch (err) {
    console.error("[REJECT PROVIDER ERROR]:", err.message);
    res.status(500).json({ message: "Error rejecting provider" });
  }
});

/* ---------------------------------------------------
   ✅ Get a single provider by ID
   Usage: GET /api/providers/:id
--------------------------------------------------- */
router.get("/:id", async (req, res) => {
  const pool = req.pool;
  const { id } = req.params;

  try {
    const { rows } = await pool.query("SELECT * FROM providers WHERE id = $1", [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Provider not found" });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("[GET PROVIDER ERROR]:", err.message);
    res.status(500).json({ message: "Error fetching provider" });
  }
});

export default router;
