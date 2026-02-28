import { describe, expect, it } from "vitest";
import { constantTimeEquals, requireOpsAuth } from "../functions/_lib/ops-auth";

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("https://example.com/api/ops/feed", {
    method: "GET",
    headers,
  });
}

describe("ops auth", () => {
  it("accepts any configured key in multi-key mode", () => {
    const env = { OPS_OPERATOR_KEY: "keyA,keyB,keyC" };

    const authWithSecond = requireOpsAuth(
      env,
      makeRequest({ "X-OPS-Key": "keyB" })
    );
    const authWithThird = requireOpsAuth(
      env,
      makeRequest({ Authorization: "Bearer keyC" })
    );

    expect(authWithSecond).toBeNull();
    expect(authWithThird).toBeNull();
  });

  it("rejects mismatched key", () => {
    const env = { OPS_OPERATOR_KEY: "keyA,keyB" };
    const response = requireOpsAuth(env, makeRequest({ "X-OPS-Key": "wrong" }));

    expect(response).not.toBeNull();
    expect(response?.status).toBe(401);
    expect(response?.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects requests from IPs outside allowlist", () => {
    const env = {
      OPS_OPERATOR_KEY: "keyA",
      OPS_ALLOWED_IPS: "203.0.113.10,198.51.100.0/24",
    };
    const request = makeRequest({
      "X-OPS-Key": "keyA",
      "CF-Connecting-IP": "192.0.2.30",
    });

    const response = requireOpsAuth(env, request);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(403);
  });
});

describe("constantTimeEquals", () => {
  it("returns true only for exact key matches", () => {
    expect(constantTimeEquals("same-key", "same-key")).toBe(true);
  });

  it("returns false for different lengths", () => {
    expect(constantTimeEquals("key", "key-extended")).toBe(false);
  });

  it("returns false for same length but different values", () => {
    expect(constantTimeEquals("key-1", "key-2")).toBe(false);
  });
});
