import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { LogoMark } from "./LogoMark.tsx";

describe("LogoMark", () => {
  test("default render produces aria-hidden='true' and 28px size", () => {
    const html = renderToString(<LogoMark />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('width="28"');
    expect(html).toContain('height="28"');
  });

  test("size prop scales width and height", () => {
    const html = renderToString(<LogoMark size={34} />);
    expect(html).toContain('width="34"');
    expect(html).toContain('height="34"');
  });

  test("accessibility props provide role and aria-label while overriding default aria-hidden", () => {
    const html = renderToString(
      <LogoMark size={34} role="img" aria-label="Polymer" />
    );
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Polymer"');
    expect(html).not.toContain('aria-hidden="true"');
  });

  test("explicit aria-hidden prop can override default or inferred behavior", () => {
    const html = renderToString(
      <LogoMark size={34} role="img" aria-label="Polymer" aria-hidden="true" />
    );
    expect(html).toContain('aria-hidden="true"');
  });
});
