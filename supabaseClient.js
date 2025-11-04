// D:\Khedme\Khedme-api\supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Debug log (optional, can remove after test)
console.log("🔍 Supabase URL:", process.env.SUPABASE_URL);
console.log("🔍 Supabase Key exists:", !!process.env.SUPABASE_SERVICE_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default supabase;
