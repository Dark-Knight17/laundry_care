import React from "react";
import {
  DEFAULT_STROKE_WIDTH,
  MARKS,
  type LogoVariant,
} from "../../brand/marks.ts";

interface LogoMarkProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  role?: string;
  "aria-label"?: string;
  ariaLabel?: string;
  "aria-hidden"?: boolean | "true" | "false";
  ariaHidden?: boolean | "true" | "false";
}

export function LogoMark({
  size = 28,
  className,
  style,
  role,
  ariaLabel,
  "aria-label": ariaLabelAttr,
  ariaHidden,
  "aria-hidden": ariaHiddenAttr,
}: LogoMarkProps) {
  const envVariant = process.env.LOGO_VARIANT;
  const variant: LogoVariant = envVariant === "cloth" ? "cloth" : "tag";
  const elements = MARKS[variant];

  const resolvedAriaLabel = ariaLabelAttr ?? ariaLabel;
  const rawHidden = ariaHiddenAttr ?? ariaHidden;
  const resolvedAriaHidden =
    rawHidden !== undefined
      ? rawHidden
      : role || resolvedAriaLabel
      ? undefined
      : "true";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      role={role}
      aria-label={resolvedAriaLabel}
      aria-hidden={resolvedAriaHidden}
      className={className}
      style={style}
    >
      {elements.map((el, idx) => {
        if (el.type === "rect") {
          return (
            <rect
              key={idx}
              {...el.attrs}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth={DEFAULT_STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        }
        if (el.type === "circle") {
          return (
            <circle
              key={idx}
              {...el.attrs}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth={DEFAULT_STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        }
        if (el.type === "path") {
          return (
            <path
              key={idx}
              {...el.attrs}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth={DEFAULT_STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        }
        return null;
      })}
    </svg>
  );
}
