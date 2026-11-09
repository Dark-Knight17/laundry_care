export type AuthMode = "signin" | "signup";

export interface AuthErrorLike {
  code?: string;
  status?: number;
  message?: string;
  name?: string;
}

export function authErrorMessage(
  error: unknown,
  mode: AuthMode
): string {
  if (!error) {
    return mode === "signin"
      ? "Incorrect email or password."
      : "We couldn't create your account with those details. If you already have one, try signing in.";
  }

  let code: string | undefined;
  let status: number | undefined;
  let message = "";
  let name = "";

  if (error instanceof Error) {
    message = error.message;
    name = error.name;
    const err = error as unknown as Record<string, unknown>;
    if (typeof err.code === "string") code = err.code.toLowerCase();
    if (typeof err.status === "number") status = err.status as number;
  } else if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.code === "string") code = err.code.toLowerCase();
    if (typeof err.status === "number") status = err.status;
    if (typeof err.message === "string") message = err.message;
    if (typeof err.name === "string") name = err.name;
  } else if (typeof error === "string") {
    message = error;
  }

  // 1. Rate limit errors (HTTP 429, over_request_rate_limit, over_email_send_rate_limit)
  if (
    status === 429 ||
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    code === "429"
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // 2. Network failures
  const lowerMsg = message.toLowerCase();
  const lowerName = name.toLowerCase();
  if (
    code === "network_error" ||
    lowerName === "authretryablefetcherror" ||
    lowerName.includes("network") ||
    lowerMsg.includes("failed to fetch") ||
    lowerMsg.includes("network") ||
    lowerMsg.includes("fetch") ||
    lowerMsg.includes("could not reach") ||
    lowerMsg.includes("connection")
  ) {
    return "Couldn't reach the server. Check your connection and try again.";
  }

  // 3. Mode-specific mappings
  if (mode === "signin") {
    if (code === "email_not_confirmed") {
      return "Please confirm your email first. Check your inbox for the link.";
    }
    // invalid_credentials or anything unrecognized
    return "Incorrect email or password.";
  }

  // mode === "signup"
  if (code === "weak_password") {
    return "Choose a stronger password.";
  }

  // sign-up, any other error, including "User already registered" or similar existing-user errors
  return "We couldn't create your account with those details. If you already have one, try signing in.";
}
