import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// ✅ Create Supabase client safely
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables in .env");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ---------------------------------------------------
// GET /api/meta
// Returns categories and districts (bilingual)
// ---------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const [categoriesRes, districtsRes] = await Promise.all([
      supabase.from("categories").select("id, name, name_ar, branch"),
      supabase.from("districts").select("id, name, name_ar"),
    ]);

    if (categoriesRes.error) throw categoriesRes.error;
    if (districtsRes.error) throw districtsRes.error;

    res.json({
      success: true,
      categories: categoriesRes.data,
      districts: districtsRes.data,
    });
  } catch (error) {
    console.error("❌ Meta route error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch meta data",
    });
  }
});

export default router;
