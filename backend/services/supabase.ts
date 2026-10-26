import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  console.error("Error: SUPABASE_URL environment variable is required.");
  process.exit(1);
}

if (!supabaseSecretKey) {
  console.error("Error: SUPABASE_SECRET_KEY environment variable is required.");
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseSecretKey);
