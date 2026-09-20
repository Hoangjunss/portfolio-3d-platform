import { describe, expect, it } from "vitest";
import { loginErrorMessage } from "./loginError";

describe("loginErrorMessage", () => {
  it("names bad credentials for 401", () => {
    expect(loginErrorMessage(401)).toMatch(/credential/i);
  });

  it("tells the user to wait for 429", () => {
    // Reachable in normal use: 10 login attempts per IP per 15 minutes.
    expect(loginErrorMessage(429)).toMatch(/too many|wait|minute/i);
  });

  it("does not blame the credentials for a server error", () => {
    expect(loginErrorMessage(500)).not.toMatch(/credential/i);
    expect(loginErrorMessage(503)).not.toMatch(/credential/i);
  });

  it("gives 429 and 401 different messages", () => {
    expect(loginErrorMessage(429)).not.toBe(loginErrorMessage(401));
  });
});
