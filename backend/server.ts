import { PORT, corsHeaders } from "./config.ts";
import { handleHealth } from "./routes/health.ts";
import { handleScan } from "./routes/scan.ts";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is required to start the server.");
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

    if (req.method === "POST" && url.pathname === "/scan") {
      return handleScan(req);
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
});

console.log(`Server listening on port ${server.port}`);
