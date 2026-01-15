import { describe, it, expect } from "vitest";
import { generateCodeChallenge } from "./session";

describe("generateCodeChallenge", () => {
  it("produces base64url encoded SHA256 hash", async () => {
    // Known test vector
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("produces URL-safe characters only", async () => {
    const challenge = await generateCodeChallenge("test-verifier-12345");
    expect(challenge).not.toMatch(/[+/=]/);
  });
});
