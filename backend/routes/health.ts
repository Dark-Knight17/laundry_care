import { SCANS_TABLE, corsHeaders } from "../config.ts";
import { supabase } from "../services/supabase.ts";

export function handleHealth(): Response {
  return new Response("Laundry Tag Scanner API running", {
    headers: { "Content-Type": "text/plain", ...corsHeaders },
  });
}

export async function handleDbHealth(): Promise<Response> {
  try {
    const { count, error } = await supabase
      .from(SCANS_TABLE)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Supabase health check failed:", error);
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Database connection failed",
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        table: SCANS_TABLE,
        count: count ?? 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (err: unknown) {
    console.error("Supabase unexpected health check error:", err);
    const message = err instanceof Error ? err.message : "Unexpected database error";
    return new Response(
      JSON.stringify({
        status: "error",
        message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
