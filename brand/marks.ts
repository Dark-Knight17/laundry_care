export const BRAND_GREEN = "#1ED760";
export const DEFAULT_STROKE_WIDTH = 3.6;
export const FAVICON_STROKE_WIDTH = 4.5;

export interface MarkElement {
  type: "rect" | "circle" | "path";
  attrs: Record<string, string | number>;
}

export const TAG_MARK: MarkElement[] = [
  { type: "rect", attrs: { x: 15, y: 9, width: 34, height: 46, rx: 6 } },
  { type: "circle", attrs: { cx: 32, cy: 17, r: 2.8 } },
  {
    type: "path",
    attrs: {
      d: "M23 31h18l-2.4 12.5a3 3 0 0 1-3 2.5H28.4a3 3 0 0 1-3-2.5z",
    },
  },
  {
    type: "path",
    attrs: {
      d: "M25.5 36.5q1.9-1.9 3.6 0t3.6 0t3.6 0",
    },
  },
];

export function renderMarkElementsToString(
  strokeWidth: number = DEFAULT_STROKE_WIDTH,
  strokeColor: string = BRAND_GREEN
): string {
  return TAG_MARK
    .map((el) => {
      const attrs = Object.entries(el.attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${el.type} ${attrs} fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .join("\n  ");
}

export function buildSvgString(
  options?: {
    strokeWidth?: number;
    color?: string;
    width?: number;
    height?: number;
    viewBox?: string;
  }
): string {
  const strokeWidth = options?.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  const color = options?.color ?? BRAND_GREEN;
  const viewBox = options?.viewBox ?? "0 0 64 64";
  const widthAttr = options?.width !== undefined ? ` width="${options.width}"` : "";
  const heightAttr = options?.height !== undefined ? ` height="${options.height}"` : "";

  const inner = renderMarkElementsToString(strokeWidth, color);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${widthAttr}${heightAttr} fill="none">\n  ${inner}\n</svg>`;
}
