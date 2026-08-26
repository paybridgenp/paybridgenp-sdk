import { describe, expect, test } from "bun:test";
import {
  NotFoundError,
  InvalidRequestError,
  PayBridgeNotFoundError,
  parseErrorResponse,
} from "./errors.js";

// 404 must raise the NotFoundError SUBCLASS. Added for parity with the PHP and
// Python SDKs, whose NotFound classes promised a working narrow catch while
// nothing ever constructed them.
describe("404 -> NotFoundError", () => {
  test("typed envelope 404 is a NotFoundError and still an InvalidRequestError", () => {
    const e = parseErrorResponse(404, { error: { message: "nope", type: "invalid_request_error" } }, null);
    expect(e).toBeInstanceOf(NotFoundError);
    expect(e).toBeInstanceOf(InvalidRequestError);
    expect((e as InvalidRequestError).statusCode).toBe(404);
    expect((e as InvalidRequestError).type).toBe("invalid_request_error");
  });

  test("legacy flat 404 is a NotFoundError", () => {
    const e = parseErrorResponse(404, { error: "nope" }, null);
    expect(e).toBeInstanceOf(NotFoundError);
  });

  test("the narrowing does not leak — 400 is NOT a NotFoundError", () => {
    const e = parseErrorResponse(400, { error: { message: "bad", type: "invalid_request_error" } }, null);
    expect(e).toBeInstanceOf(InvalidRequestError);
    expect(e).not.toBeInstanceOf(NotFoundError);
  });

  test("the deprecated PayBridgeNotFoundError alias is unchanged (repointing it would narrow existing catches)", () => {
    expect(PayBridgeNotFoundError).toBe(InvalidRequestError);
  });
});
