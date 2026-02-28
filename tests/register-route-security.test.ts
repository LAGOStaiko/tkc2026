import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../functions/api/register";

const basePayload = {
  division: "console",
  website: "",
  turnstileToken: "",
  name: "Tester",
  phone: "010-1234-5678",
  email: "tester@example.com",
  nickname: "tester",
  videoLink: "https://youtu.be/abc123",
  spectator: false,
  isMinor: false,
  consentLink: "",
  privacyAgree: true,
};

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new Request("https://tkc.example.com/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function createGasSuccessResponse() {
  return new Response(
    JSON.stringify({
      ok: true,
      data: { receiptId: "TKC2026-TEST-0001" },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("register request guards", () => {
  it("returns 415 when Content-Type is not application/json", async () => {
    const request = new Request("https://tkc.example.com/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(basePayload),
    });
    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        REGISTER_CSRF_MODE: "off",
        TURNSTILE_MODE: "off",
      },
      request,
    });

    expect(response.status).toBe(415);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns 413 when Content-Length is too large", async () => {
    const request = makeRequest(basePayload, {
      "Content-Length": "20000",
    });
    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        REGISTER_CSRF_MODE: "off",
        TURNSTILE_MODE: "off",
      },
      request,
    });

    expect(response.status).toBe(413);
  });

  it("returns 403 for Sec-Fetch-Site cross-site in enforce mode", async () => {
    const request = makeRequest(basePayload, {
      "Sec-Fetch-Site": "cross-site",
      Origin: "https://tkc.example.com",
    });
    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        REGISTER_CSRF_MODE: "enforce",
        ALLOWED_ORIGINS: "https://tkc.example.com",
        TURNSTILE_MODE: "off",
      },
      request,
    });

    expect(response.status).toBe(403);
  });

  it("returns 403 for disallowed Origin in enforce mode", async () => {
    const request = makeRequest(basePayload, {
      Origin: "https://evil.example.com",
    });
    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        REGISTER_CSRF_MODE: "enforce",
        ALLOWED_ORIGINS: "https://tkc.example.com",
        TURNSTILE_MODE: "off",
      },
      request,
    });

    expect(response.status).toBe(403);
  });

  it("requires exact origin match (no partial/substring allow)", async () => {
    const request = makeRequest(basePayload, {
      Origin: "https://tkc.example.com.evil.test",
    });
    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        REGISTER_CSRF_MODE: "enforce",
        ALLOWED_ORIGINS: "https://tkc.example.com",
        TURNSTILE_MODE: "off",
      },
      request,
    });

    expect(response.status).toBe(403);
  });

  it("allows allowed Origin in enforce mode", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createGasSuccessResponse());
    const request = makeRequest(basePayload, {
      Origin: "https://tkc.example.com",
    });
    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        REGISTER_CSRF_MODE: "enforce",
        ALLOWED_ORIGINS: "https://tkc.example.com",
        TURNSTILE_MODE: "off",
      },
      request,
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("logs only and allows when mode is log-only", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createGasSuccessResponse());
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const request = makeRequest(basePayload);

    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        REGISTER_CSRF_MODE: "log-only",
        TURNSTILE_MODE: "off",
      },
      request,
    });

    expect(response.status).toBe(200);
    expect(warnSpy).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("allows missing origin/referer when mode is off", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createGasSuccessResponse());
    const request = makeRequest(basePayload);

    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        REGISTER_CSRF_MODE: "off",
        TURNSTILE_MODE: "off",
      },
      request,
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when offlineSongs has more than 4 items", async () => {
    const payload = {
      ...basePayload,
      division: "arcade",
      dohirobaNo: "123456789012",
      qualifierRegion: "seoul",
      offlineSongs: ["a", "b", "c", "d", "e"],
    };
    const request = makeRequest(payload);
    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        REGISTER_CSRF_MODE: "off",
        TURNSTILE_MODE: "off",
      },
      request,
    });

    expect(response.status).toBe(400);
  });
});

describe("register turnstile modes", () => {
  it("returns 503 when production required mode has missing secret", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const request = makeRequest(
      { ...basePayload, turnstileToken: "token-1" },
      { Origin: "https://tkc.example.com" }
    );

    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        TKC_ENV_TIER: "production",
        TURNSTILE_MODE: "required",
        ALLOWED_ORIGINS: "https://tkc.example.com",
      },
      request,
    });

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows conditional mode when secret is missing", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createGasSuccessResponse());
    const request = makeRequest(basePayload, {
      Origin: "https://tkc.example.com",
    });

    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        TKC_ENV_TIER: "staging",
        TURNSTILE_MODE: "conditional",
        ALLOWED_ORIGINS: "https://tkc.example.com",
      },
      request,
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when turnstile verification fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
    const request = makeRequest(
      { ...basePayload, turnstileToken: "token-1" },
      { Origin: "https://tkc.example.com" }
    );

    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        TKC_ENV_TIER: "production",
        TURNSTILE_MODE: "required",
        TURNSTILE_SECRET_KEY: "secret-key",
        ALLOWED_ORIGINS: "https://tkc.example.com",
      },
      request,
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Turnstile verification failed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns 502 when turnstile verification request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network-fail"));
    const request = makeRequest(
      { ...basePayload, turnstileToken: "token-1" },
      { Origin: "https://tkc.example.com" }
    );

    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        TKC_ENV_TIER: "production",
        TURNSTILE_MODE: "required",
        TURNSTILE_SECRET_KEY: "secret-key",
        ALLOWED_ORIGINS: "https://tkc.example.com",
      },
      request,
    });

    const data = await response.json();
    expect(response.status).toBe(502);
    expect(data.error).toBe("Turnstile verification unavailable");
  });

  it("returns 400 when expected hostname mismatches", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, hostname: "evil.example.com" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
    const request = makeRequest(
      { ...basePayload, turnstileToken: "token-1" },
      { Origin: "https://tkc.example.com" }
    );

    const response = await onRequestPost({
      env: {
        GAS_API_KEY: "test-key",
        GAS_WEBAPP_URL: "https://gas.example.com",
        TKC_ENV_TIER: "production",
        TURNSTILE_MODE: "required",
        TURNSTILE_SECRET_KEY: "secret-key",
        TURNSTILE_EXPECTED_HOSTNAMES: "tkc.example.com",
        ALLOWED_ORIGINS: "https://tkc.example.com",
      },
      request,
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Turnstile verification failed");
  });
});
