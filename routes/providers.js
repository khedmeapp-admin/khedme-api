import express from "express";
import pkg from "pg";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;
const router = express.Router();

// ✅ PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase") ? { rejectUnauthorized: false } : false,
});

// ✅ Supabase client for file upload
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ✅ Multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ---------------------------------------------------
   ✅ Get all providers
--------------------------------------------------- */
router.get("/all", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM providers ORDER BY id ASC");
    res.json({ success: true, providers: rows });
  } catch (error) {
    console.error("❌ Error fetching providers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------------
   ✅ Toggle Provider Availability
--------------------------------------------------- */
router.post("/availability", async (req, res) => {
  try {
    const { provider_id, is_available } = req.body;
    if (!provider_id) return res.status(400).json({ success: false, message: "Missing provider_id" });

    const result = await pool.query(
      "UPDATE providers SET available = $1 WHERE id = $2 RETURNING id, full_name, phone, available;",
      [is_available, provider_id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ success: false, message: "Provider not found" });

    res.json({
      success: true,
      message: `Availability updated to ${is_available ? "Available ✅" : "Unavailable ❌"}`,
      provider: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error toggling availability:", error);
    res.status(500).json({ success: false, message: "Server error updating availability" });
  }
});

/* ---------------------------------------------------
   ✅ Update Provider Profile (name, category, district)
--------------------------------------------------- */
router.post("/update", async (req, res) => {
  try {
    const { id, full_name, category_id, district_id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Provider ID is required" });

    const { rows } = await pool.query(
      `UPDATE providers
       SET full_name = $1, category_id = $2, district_id = $3
       WHERE id = $4
       RETURNING id, full_name, phone, category_id, district_id, available;`,
      [full_name, category_id, district_id, id]
    );

    res.json({ success: true, message: "Profile updated successfully ✅", provider: rows[0] });
  } catch (error) {
    console.error("❌ Error updating provider:", error);
    res.status(500).json({ success: false, message: "Server error updating provider" });
  }
});

/* ---------------------------------------------------
   ✅ Upload Provider Profile Picture + Save to DB
--------------------------------------------------- */
router.post("/upload-profile", upload.single("image"), async (req, res) => {
  try {
    const { provider_id } = req.body;
    const file = req.file;

    if (!provider_id || !file) {
      return res.status(400).json({ success: false, message: "Missing provider_id or image file" });
    }

    const fileExt = path.extname(file.originalname);
    const filePath = `providers/${provider_id}${fileExt}`;
    const fileBuffer = file.buffer;

    // ✅ Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("profile_pics")
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    // ✅ Get public URL
    const { data: publicURL } = supabase.storage.from("profile_pics").getPublicUrl(filePath);
    const imageUrl = publicURL.publicUrl;

    // ✅ Save image URL in DB
    const { rows } = await pool.query(
      "UPDATE providers SET profile_image = $1 WHERE id = $2 RETURNING id, full_name, phone, profile_image;",
      [imageUrl, provider_id]
    );

    res.json({
      success: true,
      message: "Profile picture uploaded and saved successfully ✅",
      provider: rows[0],
    });
  } catch (error) {
    console.error("❌ Upload profile error:", error);
    res.status(500).json({ success: false, message: "Server error uploading profile picture" });
  }
});

/* ---------------------------------------------------
   ✅ Get all pending providers (for admin dashboard)
--------------------------------------------------- */
router.get("/pending", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM providers WHERE status = 'pending' ORDER BY id ASC");
    res.json({ success: true, providers: rows });
  } catch (error) {
    console.error("❌ Error fetching pending providers:", error);
    res.status(500).json({ success: false, message: "Server error fetching pending providers" });
  }
});

/* ---------------------------------------------------
   ✅ Approve Provider
--------------------------------------------------- */
router.post("/approve", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Provider ID is required" });

    const { rows } = await pool.query(
      `UPDATE providers
       SET status = 'approved', approved = TRUE
       WHERE id = $1
       RETURNING id, full_name, phone, status, approved;`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Provider not found" });

    res.json({ success: true, message: "Provider approved successfully ✅", provider: rows[0] });
  } catch (error) {
    console.error("❌ Error approving provider:", error);
    res.status(500).json({ success: false, message: "Server error approving provider" });
  }
});

/* ---------------------------------------------------
   ❌ Reject Provider
--------------------------------------------------- */
router.post("/reject", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Provider ID is required" });

    const { rows } = await pool.query(
      "DELETE FROM providers WHERE id = $1 RETURNING id, phone;",
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Provider not found" });

    res.json({ success: true, message: "Provider rejected and removed ❌", provider: rows[0] });
  } catch (error) {
    console.error("❌ Error rejecting provider:", error);
    res.status(500).json({ success: false, message: "Server error rejecting provider" });
  }
});

/* ---------------------------------------------------
   ✅ Get all applications by provider ID
--------------------------------------------------- */
router.get("/applications/:id", async (req, res) => {
  const pool = req.app.get("pool");
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT ja.id, j.service, j.description, j.district, j.budget, ja.status, ja.created_at
       FROM job_applications ja
       JOIN jobs j ON ja.job_id = j.id
       WHERE ja.provider_id = $1
       ORDER BY ja.created_at DESC`,
      [id]
    );

    res.json({ success: true, applications: rows });
  } catch (error) {
    console.error("Error fetching applications:", error.message);
    res.status(500).json({ success: false, message: "Failed to load applications ❌" });
  }
});

export default router;
