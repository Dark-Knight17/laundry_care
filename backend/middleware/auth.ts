import { corsHeaders } from "../config.ts";
import { supabase } from "../services/supabase.ts";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

/**
 * Extracts Bearer token from the Authorization header and verifies it via Supabase Auth.
 * If missing or invalid, returns a 401 Response.
 * If valid, attaches the user id to req.userId and returns null.
 */
export async function authenticateRequest(
  req: Request
): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Missing or invalid Authorization header" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Access token is missing" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    (req as AuthenticatedRequest).userId = data.user.id;
    return null;
  } catch (err) {
    console.error("Auth verification error:", err);
    return new Response(
      JSON.stringify({ error: "Unauthorized: Failed to verify token" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

/**
 * Middleware wrapper that enforces authentication on a route handler.
 */
export function requireAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response> | Response
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const errorResponse = await authenticateRequest(req);
    if (errorResponse) {
      return errorResponse;
    }
    return handler(req as AuthenticatedRequest);
  };
}
