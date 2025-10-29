// routes/meta.js
import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const router = express.Router();

// ✅ Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ✅ Get all meta (categories + districts)
router.get("/", async (req, res) => {
  try {
    const [catRes, distRes] = await Promise.all([
      supabase.from("categories").select("id, name, name_ar, branch").order("id"),
      supabase.from("districts").select("id, name, name_ar").order("id"),
    ]);

    if (catRes.error) throw catRes.error;
    if (distRes.error) throw distRes.error;

    res.json({
      success: true,
      categories: catRes.data,
      districts: distRes.data,
    });
  } catch (err) {
    console.error("❌ Failed to fetch meta:", err.message);
    res.status(500).json({ error: "Failed to fetch meta data" });
  }
});

// ✅ Get categories (kept for compatibility)
router.get("/categories", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, name_ar, branch")
      .order("id");

    if (error) throw error;
    res.json({ success: true, categories: data });
  } catch (err) {
    console.error("❌ Failed to fetch categories:", err.message);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ✅ Get districts (kept for compatibility)
router.get("/districts", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("districts")
      .select("id, name, name_ar")
      .order("id");

    if (error) throw error;
    res.json({ success: true, districts: data });
  } catch (err) {
    console.error("❌ Failed to fetch districts:", err.message);
    res.status(500).json({ error: "Failed to fetch districts" });
  }
});

export default router;
