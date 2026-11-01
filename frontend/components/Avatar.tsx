import React, { useState } from "react";

export interface AvatarProps {
  imageUrl?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Small palette of muted tones that read well with white text against pure black (#000000)
const AVATAR_PALETTE = [
  "#2E4057", // muted slate blue
  "#395B50", // muted pine / eucalyptus
  "#6D4C41", // muted warm chestnut
  "#5E4B56", // muted dusk mauve
  "#435058", // muted charcoal slate
  "#60523C", // muted olive bronze
  "#4A5859", // muted sage teal
  "#5C3C43", // muted berry / plum
];

function getInitials(
  firstName?: string,
  lastName?: string,
  email?: string
): string {
  const first = (firstName || "").trim();
  const last = (lastName || "").trim();
  const mail = (email || "").trim();

  if (first && last) {
    const f = first[0] || "";
    const l = last[0] || "";
    return `${f}${l}`.toUpperCase();
  }
  if (first) {
    return (first[0] || "").toUpperCase();
  }
  if (last) {
    return (last[0] || "").toUpperCase();
  }
  if (mail) {
    return (mail[0] || "").toUpperCase();
  }
  return "?";
}

function getAvatarBgColor(email?: string): string {
  if (!email) return AVATAR_PALETTE[0]!;
  let hash = 0;
  const str = email.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index]!;
}

export function Avatar({
  imageUrl,
  firstName,
  lastName,
  email,
  size = 36,
  className,
  style,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = getInitials(firstName, lastName, email);
  const bgColor = getAvatarBgColor(email);

  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={
          firstName || lastName
            ? `${firstName || ""} ${lastName || ""}`.trim()
            : email || "User avatar"
        }
        onError={() => setImageError(true)}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          display: "block",
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: bgColor,
        color: "#FFFFFF",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: Math.round(size * 0.42),
        fontFamily: "var(--font-sans)",
        userSelect: "none",
        flexShrink: 0,
        letterSpacing: "0.02em",
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
