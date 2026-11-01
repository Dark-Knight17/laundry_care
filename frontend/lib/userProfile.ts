import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string;
  email: string;
}

/**
 * Normalizes user profile information from Supabase auth user object and metadata.
 * Fallbacks:
 * - firstName: first_name -> given_name -> first word of full_name or name
 * - lastName: last_name -> family_name -> subsequent words of full_name or name
 * - fullName: full_name -> name -> "firstName lastName"
 * - avatarUrl: avatar_url -> picture
 */
export function getUserProfile(user: User | null | undefined): UserProfile {
  if (!user) {
    return {
      firstName: "",
      lastName: "",
      fullName: "",
      avatarUrl: "",
      email: "",
    };
  }

  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const email = (user.email || "").trim();

  // Full name / name from metadata
  const metaFullName =
    typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const metaName = typeof meta.name === "string" ? meta.name.trim() : "";
  const rawCombinedName = metaFullName || metaName;

  const words = rawCombinedName
    ? rawCombinedName.split(/\s+/).filter(Boolean)
    : [];
  const firstWord = words[0] || "";
  const subsequentWords = words.slice(1).join(" ");

  // First name: first_name, then given_name, then first word of full_name or name
  let firstName = "";
  if (typeof meta.first_name === "string" && meta.first_name.trim()) {
    firstName = meta.first_name.trim();
  } else if (typeof meta.given_name === "string" && meta.given_name.trim()) {
    firstName = meta.given_name.trim();
  } else if (firstWord) {
    firstName = firstWord;
  }

  // Last name: last_name, then family_name, then subsequent words of full_name or name
  let lastName = "";
  if (typeof meta.last_name === "string" && meta.last_name.trim()) {
    lastName = meta.last_name.trim();
  } else if (typeof meta.family_name === "string" && meta.family_name.trim()) {
    lastName = meta.family_name.trim();
  } else if (subsequentWords) {
    lastName = subsequentWords;
  }

  // Full name
  let fullName = rawCombinedName;
  if (!fullName) {
    fullName = [firstName, lastName].filter(Boolean).join(" ");
  }

  // Avatar URL: avatar_url, picture
  let avatarUrl = "";
  if (typeof meta.avatar_url === "string" && meta.avatar_url.trim()) {
    avatarUrl = meta.avatar_url.trim();
  } else if (typeof meta.picture === "string" && meta.picture.trim()) {
    avatarUrl = meta.picture.trim();
  }

  return {
    firstName,
    lastName,
    fullName,
    avatarUrl,
    email,
  };
}
