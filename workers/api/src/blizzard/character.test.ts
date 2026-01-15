import { describe, it, expect } from "vitest";
import { normalizeRealmSlug } from "./character";

describe("normalizeRealmSlug", () => {
  it("lowercases realm names", () => {
    expect(normalizeRealmSlug("Silvermoon")).toBe("silvermoon");
  });

  it("replaces spaces with hyphens", () => {
    expect(normalizeRealmSlug("Argent Dawn")).toBe("argent-dawn");
  });

  it("removes apostrophes and replaces with hyphen", () => {
    expect(normalizeRealmSlug("Quel'Thalas")).toBe("quel-thalas");
  });

  it("removes diacritics", () => {
    expect(normalizeRealmSlug("Médivh")).toBe("medivh");
  });

  it("handles complex realm names", () => {
    expect(normalizeRealmSlug("Die Aldor")).toBe("die-aldor");
    expect(normalizeRealmSlug("Pozzo dell'Eternità")).toBe("pozzo-dell-eternita");
  });

  it("collapses multiple hyphens", () => {
    expect(normalizeRealmSlug("Test--Realm")).toBe("test-realm");
  });
});
