// D:\Khedme\Khedme-api\routes\admin.js
import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import pool from "../db.js"; // ✅ Centralized DB connection
import supabase from "../supabaseClient.js";

const router = express.Router();
const upload = multer();

// ---------------------------------------------------
// 🔐 Admin Login (Static Credentials for Now)
// ---------------------------------------------------
const ADMIN_EMAIL = "admin@khedme.com";
const ADMIN_PASSWORD = "123456";
const JWT_SECRET = "supersecretkey123";

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, {
      expiresIn: "2h",
    });
    return res.json({ success: true, token });
  }

  res.status(401).json({ success: false, message: "Invalid admin credentials ❌" });
});

// ---------------------------------------------------
// 📊 Admin Stats — Jobs, Providers, Clients, Applications
// ---------------------------------------------------
router.get("/stats", async (req, res) => {
  try {
    const [jobs, providers, pending, clients, applications] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM jobs"),
      pool.query("SELECT COUNT(*) FROM providers"),
      pool.query("SELECT COUNT(*) FROM providers WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) FROM clients"),
      pool.query("SELECT COUNT(*) FROM job_applications"),
    ]);

    const stats = {
      totalJobs: Number(jobs.rows[0].count),
      totalProviders: Number(providers.rows[0].count),
      pendingProviders: Number(pending.rows[0].count),
      totalClients: Number(clients.rows[0].count),
      totalApplications: Number(applications.rows[0].count),
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error("❌ Error fetching admin stats:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin stats ❌",
    });
  }
});

// ---------------------------------------------------
// 🏙️ Bulk City Import — Insert Districts
// ---------------------------------------------------
router.post("/cities/import", async (req, res) => {
  try {
    const { cities } = req.body;
    if (!Array.isArray(cities) || cities.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No cities provided" });
    }

    const inserts = cities.map((name) => ({
      name,
      name_ar: name, // temporary duplication
    }));

    const { data, error } = await supabase.from("districts").insert(inserts);
    if (error) throw error;

    res.json({ success: true, message: `${data.length} cities added ✅` });
  } catch (error) {
    console.error("❌ Error importing cities:", error.message);
    res.status(500).json({ success: false, message: "Failed to import cities" });
  }
});

// ---------------------------------------------------
// 🧩 Category Management (Insert/Update)
// ---------------------------------------------------
router.post("/categories/update", async (req, res) => {
  try {
    const { categories } = req.body;
    if (!Array.isArray(categories) || categories.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No categories provided" });
    }

    const inserts = categories.map((c) => ({
      name: c.name,
      name_ar: c.name_ar || c.name,
      branch: c.branch || "On-site",
    }));

    const { data, error } = await supabase
      .from("categories")
      .upsert(inserts, { onConflict: "name" });

    if (error) throw error;

    res.json({
      success: true,
      message: "Categories updated successfully ✅",
      data,
    });
  } catch (error) {
    console.error("❌ Error updating categories:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update categories",
    });
  }
});

// ---------------------------------------------------
// 🧾 Upload Wish Money QR (image → Supabase Storage)
// ---------------------------------------------------
router.post("/upload-qr", upload.single("qr"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer;
    const fileName = `qr_${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from("qr_uploads")
      .upload(fileName, fileBuffer, { contentType: "image/png" });

    if (error) throw error;

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/qr_uploads/${fileName}`;
    res.json({
      success: true,
      message: "QR uploaded successfully ✅",
      url: publicUrl,
    });
  } catch (error) {
    console.error("❌ QR upload error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to upload QR",
    });
  }
});

export default router;
