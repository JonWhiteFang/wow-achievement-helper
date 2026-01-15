import { describe, it, expect } from "vitest";
import { stripHtml } from "./types";

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("converts br to newline", () => {
    expect(stripHtml("Line 1<br>Line 2<br/>Line 3")).toBe("Line 1\nLine 2\nLine 3");
  });

  it("decodes HTML entities", () => {
    expect(stripHtml("&amp; &lt; &gt; &quot; &#39;")).toBe("& < > \" '");
  });

  it("handles nbsp", () => {
    expect(stripHtml("Hello&nbsp;World")).toBe("Hello World");
  });
});
