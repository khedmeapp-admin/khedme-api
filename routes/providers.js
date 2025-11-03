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
   ✅ Upload Profile Picture
--------------------------------------------------- */
router.post("/upload-profile", upload.single("image"), async (req, res) => {
  try {
    const { provider_id } = req.body;
    const file = req.file;

    if (!provider_id || !file)
      return res.status(400).json({ success: false, message: "Missing provider_id or image" });

    const filePath = `providers/${provider_id}.jpg`;

    // 🟠 Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("profile_pics")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 🟢 Get public URL
    const { data } = supabase.storage.from("profile_pics").getPublicUrl(filePath);
    const imageUrl = data.publicUrl;

    // 🟢 Save to DB
    await pool.query("UPDATE providers SET profile_image = $1 WHERE id = $2", [imageUrl, provider_id]);

    res.json({
      success: true,
      message: "Profile picture uploaded successfully ✅",
      image_url: imageUrl,
    });
  } catch (error) {
    console.error("❌ Error uploading profile picture:", error);
    res.status(500).json({ success: false, message: "Server error uploading image" });
  }
});

export default router;
