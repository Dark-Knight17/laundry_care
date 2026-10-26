import { createClient } from "@supabase/supabase-js";

if (typeof window !== "undefined" && typeof (window as unknown as { process?: unknown }).process === "undefined") {
  (window as unknown as { process: { env: Record<string, string | undefined> } }).process = { env: {} };
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  console.error("Error: SUPABASE_URL environment variable is required.");
}

if (!supabasePublishableKey) {
  console.error(
    "Error: SUPABASE_PUBLISHABLE_KEY environment variable is required."
  );
}

export const supabase = createClient(
  supabaseUrl || "",
  supabasePublishableKey || ""
);
