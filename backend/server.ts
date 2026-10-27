import { PORT, corsHeaders } from "./config.ts";
import { requireAuth } from "./middleware/auth.ts";
import { handleDbHealth, handleHealth } from "./routes/health.ts";
import { handleScan } from "./routes/scan.ts";
import { handleCreateScan } from "./routes/scans.ts";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is required to start the server.");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) {
  console.error("Error: SUPABASE_URL environment variable is required to start the server.");
  process.exit(1);
}

const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseSecretKey) {
  console.error("Error: SUPABASE_SECRET_KEY environment variable is required to start the server.");
  process.exit(1);
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method === "GET" && url.pathname === "/") {
      return handleHealth();
    }

    if (req.method === "GET" && url.pathname === "/health/db") {
      return handleDbHealth();
    }

    if (req.method === "POST" && url.pathname === "/scan") {
      return requireAuth(handleScan)(req);
    }

    if (req.method === "POST" && url.pathname === "/scans") {
      return requireAuth(handleCreateScan)(req);
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
});

console.log(`Server listening on port ${server.port}`);
