import { corsHeaders } from "../config.ts";

export function handleHealth(): Response {
  return new Response("Laundry Tag Scanner API running", {
    headers: { "Content-Type": "text/plain", ...corsHeaders },
  });
}
