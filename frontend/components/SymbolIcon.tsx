import React from "react";

export interface SymbolIconProps {
  symbolId: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const SUPPORTED_SYMBOL_IDS = [
  "wash_30_normal",
  "wash_40_normal",
  "wash_40_gentle",
  "wash_hand",
  "wash_do_not",
  "bleach_any",
  "bleach_non_chlorine",
  "bleach_do_not",
  "dry_tumble_normal",
  "dry_tumble_low",
  "dry_tumble_do_not",
  "dry_line",
  "dry_flat",
  "iron_low",
  "iron_medium",
  "iron_high",
  "iron_do_not",
  "dry_clean_any",
  "dry_clean_do_not",
] as const;

export type SupportedSymbolId = (typeof SUPPORTED_SYMBOL_IDS)[number];

const SUPPORTED_SET = new Set<string>(SUPPORTED_SYMBOL_IDS);

// --- DRY Primitive Components ---

function TubOutline() {
  return (
    <>
      <path d="M 8 17 L 11 34 C 11.5 37 13.5 38 16 38 L 32 38 C 34.5 38 36.5 37 37 34 L 40 17" />
      <path d="M 8 17 Q 12 13 16 17 T 24 17 T 32 17 T 40 17" />
    </>
  );
}

function TriangleOutline() {
  return <path d="M 24 7 L 41 39 L 7 39 Z" />;
}

function SquareOutline() {
  return <path d="M 8 8 H 40 V 40 H 8 Z" />;
}

function InscribedCircle() {
  return <circle cx="24" cy="24" r="13" />;
}

function StandaloneCircle() {
  return <circle cx="24" cy="24" r="15" />;
}

function IronOutline() {
  return (
    <>
      <path d="M 7 34 L 41 34 C 41 28 37 28 33 28 L 18 28 C 13 28 9 31 7 34 Z" />
      <path d="M 15 28 C 15 16 20 15 26 15 L 34 15 C 38 15 39 19 39 28" />
    </>
  );
}

function Cross({
  x1 = 8,
  y1 = 8,
  x2 = 40,
  y2 = 40,
}: {
  x1?: number | string;
  y1?: number | string;
  x2?: number | string;
  y2?: number | string;
}) {
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <line x1={x2} y1={y1} x2={x1} y2={y2} />
    </>
  );
}

function Bars({ count = 1, y = 43 }: { count?: number; y?: number }) {
  if (count === 1) {
    return <line x1="11" y1={y} x2="37" y2={y} />;
  }
  return (
    <>
      <line x1="11" y1={y - 2.5} x2="37" y2={y - 2.5} />
      <line x1="11" y1={y + 2.5} x2="37" y2={y + 2.5} />
    </>
  );
}

function Dots({ count = 1, y = 24 }: { count?: number; y?: number }) {
  const r = 2.2;
  if (count === 1) {
    return <circle cx="24" cy={y} r={r} fill="currentColor" stroke="none" />;
  }
  if (count === 2) {
    return (
      <>
        <circle cx="20" cy={y} r={r} fill="currentColor" stroke="none" />
        <circle cx="28" cy={y} r={r} fill="currentColor" stroke="none" />
      </>
    );
  }
  return (
    <>
      <circle cx="16" cy={y} r={r} fill="currentColor" stroke="none" />
      <circle cx="24" cy={y} r={r} fill="currentColor" stroke="none" />
      <circle cx="32" cy={y} r={r} fill="currentColor" stroke="none" />
    </>
  );
}

function HandInWater() {
  return (
    <path d="M 33 6 L 27 16 C 25 16 22 17 22 19 C 22 21 24 21 25 20 L 20 27 C 19 29 22 30 24 29 L 29 20 C 30 18 30 16 31 15 L 38 9" />
  );
}

// --- Main Icon Component ---

export function SymbolIcon({
  symbolId,
  size = 44,
  className,
  style,
}: SymbolIconProps) {
  if (!SUPPORTED_SET.has(symbolId)) {
    console.warn(`SymbolIcon: unknown symbolId "${symbolId}"`);
    return (
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        stroke="currentColor"
        fill="none"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
        style={style}
      >
        <rect x="8" y="8" width="32" height="32" rx="6" />
        <text
          x="24"
          y="25.5"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="18"
          fontWeight="600"
          fill="currentColor"
          stroke="none"
          fontFamily="var(--font-sans)"
        >
          ?
        </text>
      </svg>
    );
  }

  const renderContent = () => {
    switch (symbolId) {
      // Wash
      case "wash_30_normal":
        return (
          <>
            <TubOutline />
            <text
              x="24"
              y="30"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="13"
              fontWeight="600"
              fill="currentColor"
              stroke="none"
              fontFamily="var(--font-sans)"
            >
              30
            </text>
          </>
        );

      case "wash_40_normal":
        return (
          <>
            <TubOutline />
            <text
              x="24"
              y="30"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="13"
              fontWeight="600"
              fill="currentColor"
              stroke="none"
              fontFamily="var(--font-sans)"
            >
              40
            </text>
          </>
        );

      case "wash_40_gentle":
        return (
          <>
            <TubOutline />
            <text
              x="24"
              y="30"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="13"
              fontWeight="600"
              fill="currentColor"
              stroke="none"
              fontFamily="var(--font-sans)"
            >
              40
            </text>
            <Bars count={1} y={43} />
          </>
        );

      case "wash_hand":
        return (
          <>
            <TubOutline />
            <HandInWater />
          </>
        );

      case "wash_do_not":
        return (
          <>
            <TubOutline />
            <Cross x1="8" y1="13" x2="40" y2="39" />
          </>
        );

      // Bleach
      case "bleach_any":
        return <TriangleOutline />;

      case "bleach_non_chlorine":
        return (
          <>
            <TriangleOutline />
            <line x1="17" y1="38" x2="26" y2="21" />
            <line x1="25" y1="38" x2="34" y2="21" />
          </>
        );

      case "bleach_do_not":
        return (
          <>
            <TriangleOutline />
            <Cross x1="8" y1="9" x2="40" y2="39" />
          </>
        );

      // Dry
      case "dry_tumble_normal":
        return (
          <>
            <SquareOutline />
            <InscribedCircle />
            <Dots count={2} y={24} />
          </>
        );

      case "dry_tumble_low":
        return (
          <>
            <SquareOutline />
            <InscribedCircle />
            <Dots count={1} y={24} />
          </>
        );

      case "dry_tumble_do_not":
        return (
          <>
            <SquareOutline />
            <InscribedCircle />
            <Cross x1="8" y1="8" x2="40" y2="40" />
          </>
        );

      case "dry_line":
        return (
          <>
            <SquareOutline />
            <path d="M 8 11 C 14 18 34 18 40 11" />
          </>
        );

      case "dry_flat":
        return (
          <>
            <SquareOutline />
            <line x1="8" y1="24" x2="40" y2="24" />
          </>
        );

      // Iron
      case "iron_low":
        return (
          <>
            <IronOutline />
            <Dots count={1} y={24} />
          </>
        );

      case "iron_medium":
        return (
          <>
            <IronOutline />
            <Dots count={2} y={24} />
          </>
        );

      case "iron_high":
        return (
          <>
            <IronOutline />
            <Dots count={3} y={24} />
          </>
        );

      case "iron_do_not":
        return (
          <>
            <IronOutline />
            <Cross x1="7" y1="13" x2="41" y2="36" />
          </>
        );

      // Professional care
      case "dry_clean_any":
        return (
          <>
            <StandaloneCircle />
            <text
              x="24"
              y="25"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="16"
              fontWeight="600"
              fill="currentColor"
              stroke="none"
              fontFamily="var(--font-sans)"
            >
              A
            </text>
          </>
        );

      case "dry_clean_do_not":
        return (
          <>
            <StandaloneCircle />
            <Cross x1="9" y1="9" x2="39" y2="39" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      stroke="currentColor"
      fill="none"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {renderContent()}
    </svg>
  );
}
