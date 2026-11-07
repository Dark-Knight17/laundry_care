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
}

export function LogoMark({ size = 28, className, style }: LogoMarkProps) {
  const envVariant = process.env.LOGO_VARIANT;
  const variant: LogoVariant = envVariant === "cloth" ? "cloth" : "tag";
  const elements = MARKS[variant];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
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
