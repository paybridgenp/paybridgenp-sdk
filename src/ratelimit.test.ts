import { describe, expect, test } from "bun:test";
import { InvalidRequestError, RateLimitError, parseErrorResponse } from "./errors.js";

// A flat 429 (no `type` field) used to fall into the generic `>= 400 && < 500`
// branch, which sits before the 429 check and swallowed it. Callers doing
// `catch (e) { if (e instanceof RateLimitError) backOff() }` never backed off.
describe("flat 429 -> RateLimitError", () => {
  test("legacy flat 429 is a RateLimitError, not a plain InvalidRequestError", () => {
    const e = parseErrorResponse(429, { error: "slow down" }, null);
    expect(e).toBeInstanceOf(RateLimitError);
    expect(e).not.toBeInstanceOf(InvalidRequestError);
  });

  test("flat 429 still carries Retry-After", () => {
    const e = parseErrorResponse(429, { error: "slow down" }, "30");
    expect(e).toBeInstanceOf(RateLimitError);
    expect((e as RateLimitError).retryAfter).toBe(30);
  });

  test("typed envelope 429 is unaffected", () => {
    const e = parseErrorResponse(429, { error: { message: "slow down", type: "rate_limit_error" } }, "5");
    expect(e).toBeInstanceOf(RateLimitError);
    expect((e as RateLimitError).retryAfter).toBe(5);
  });

  test("a plain 400 is still an InvalidRequestError", () => {
    const e = parseErrorResponse(400, { error: "bad" }, null);
    expect(e).toBeInstanceOf(InvalidRequestError);
    expect(e).not.toBeInstanceOf(RateLimitError);
  });
});
