// routes/providers.js
import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* ---------------------------------------------------
   ✅ Get all pending providers (for admin dashboard)
--------------------------------------------------- */
router.get("/pending", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM providers WHERE status = 'pending'"
    );
    res.json({ success: true, providers: rows });
  } catch (error) {
    console.error("Error fetching pending providers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------------
   ✅ Approve provider
--------------------------------------------------- */
router.post("/approve", async (req, res) => {
  try {
    const { id } = req.body;
    const { rows } = await pool.query(
      "UPDATE providers SET status = 'approved' WHERE id = $1 RETURNING *",
      [id]
    );
    res.json({
      success: true,
      message: "Provider approved ✅",
      provider: rows[0],
    });
  } catch (error) {
    console.error("Error approving provider:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------------
   ✅ Reject provider
--------------------------------------------------- */
router.post("/reject", async (req, res) => {
  try {
    const { id } = req.body;
    await pool.query("DELETE FROM providers WHERE id = $1", [id]);
    res.json({ success: true, message: "Provider rejected ❌" });
  } catch (error) {
    console.error("Error rejecting provider:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------------
   ✅ Toggle provider availability
--------------------------------------------------- */
router.post("/availability", async (req, res) => {
  try {
    const { provider_id, is_available } = req.body;
    const { rows } = await pool.query(
      "UPDATE providers SET available = $1 WHERE id = $2 RETURNING id, full_name, phone, available",
      [is_available, provider_id]
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });

    res.json({
      success: true,
      message: `Availability updated to ${
        is_available ? "Available ✅" : "Unavailable ❌"
      }`,
      provider: rows[0],
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating availability",
      error: error.message,
    });
  }
});

/* ---------------------------------------------------
   ✅ Get provider applications
--------------------------------------------------- */
router.get("/applications/:provider_id", async (req, res) => {
  try {
    const { provider_id } = req.params;
    const query = `
      SELECT 
        ja.id AS application_id,
        ja.message,
        ja.status,
        ja.created_at,
        j.id AS job_id,
        j.service,
        j.description,
        j.district,
        j.budget
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.provider_id = $1
      ORDER BY ja.created_at DESC
    `;
    const { rows } = await pool.query(query, [provider_id]);
    res.json({ success: true, applications: rows });
  } catch (error) {
    console.error("Error fetching provider applications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------------
   ✅ Update provider profile (name, category, district)
--------------------------------------------------- */
router.post("/update", async (req, res) => {
  try {
    const { id, full_name, category_id, district_id } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Provider ID is required" });
    }

    const fields = [];
    const values = [];
    let i = 1;

    if (full_name) {
      fields.push(`full_name = $${i++}`);
      values.push(full_name);
    }
    if (category_id) {
      fields.push(`category_id = $${i++}`);
      values.push(category_id);
    }
    if (district_id) {
      fields.push(`district_id = $${i++}`);
      values.push(district_id);
    }

    if (fields.length === 0) {
      return res.json({ success: false, message: "No updates provided" });
    }

    values.push(id);

    const query = `
      UPDATE providers
      SET ${fields.join(", ")}
      WHERE id = $${i}
      RETURNING id, full_name, phone, category_id, district_id, available;
    `;

    const { rows } = await pool.query(query, values);
    res.json({
      success: true,
      message: "Profile updated successfully ✅",
      provider: rows[0],
    });
  } catch (error) {
    console.error("Error updating provider profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;
