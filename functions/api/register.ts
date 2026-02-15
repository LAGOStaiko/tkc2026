import { z } from "zod";
import { badRequest, ok, serverError, tooManyRequests } from "../_lib/response";
import { callGasJson, type _Env } from "../_lib/gas";
import { escapeFormulaField } from "../_lib/sanitize";
import { REGISTER_LIMITS as L } from "../../shared/register-limits";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const CLEANUP_INTERVAL = 100;
const RATE_LIMIT_KV_PREFIX = "register:rate-limit";
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
let requestCounter = 0;

type KvNamespaceLike = {
  get: (key: string) => Promise<string | null>;
  put: (
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ) => Promise<void>;
};

type RegisterEnv = _Env & {
  TURNSTILE_SECRET_KEY?: string;
  RATE_LIMIT_KV?: KvNamespaceLike;
  RATE_LIMIT_WINDOW_MS?: string | number;
  RATE_LIMIT_MAX?: string | number;
  RATE_LIMIT_KV_PREFIX?: string;
};

type RateLimitConfig = {
  windowMs: number;
  max: number;
  kvPrefix: string;
};

const parseBoundedInt = (
  value: unknown,
  fallback: number,
  min: number,
  max: number
) => {
  const raw = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isFinite(raw)) return fallback;
  const rounded = Math.floor(raw);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
};

const readRateLimitConfig = (env: RegisterEnv): RateLimitConfig => {
  const windowMs = parseBoundedInt(
    env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_WINDOW_MS,
    60_000,
    3_600_000
  );
  const max = parseBoundedInt(env.RATE_LIMIT_MAX, RATE_LIMIT_MAX, 1, 100);
  const tier = String(env.TKC_ENV_TIER ?? "production")
    .trim()
    .toLowerCase();
  const defaultPrefix = tier
    ? `${RATE_LIMIT_KV_PREFIX}:${tier}`
    : RATE_LIMIT_KV_PREFIX;
  const kvPrefix = env.RATE_LIMIT_KV_PREFIX?.trim() || defaultPrefix;

  return { windowMs, max, kvPrefix };
};

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(ip);
    }
  }
};

const hitRateLimitInMemory = (ip: string, config: RateLimitConfig) => {
  requestCounter += 1;
  if (requestCounter >= CLEANUP_INTERVAL) {
    requestCounter = 0;
    cleanupExpiredEntries();
  }

  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + config.windowMs });
    return { limited: false, retryAfter: Math.ceil(config.windowMs / 1000) };
  }

  entry.count += 1;
  if (entry.count > config.max) {
    return {
      limited: true,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return { limited: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
};

const hitRateLimitWithKv = async (
  ip: string,
  kv: KvNamespaceLike,
  config: RateLimitConfig
) => {
  const now = Date.now();
  const windowNo = Math.floor(now / config.windowMs);
  const resetAt = (windowNo + 1) * config.windowMs;
  const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));
  const key = `${config.kvPrefix}:${ip}:${windowNo}`;

  const raw = await kv.get(key);
  const current = Number(raw ?? "0");
  const safeCurrent = Number.isFinite(current) && current > 0 ? current : 0;
  const next = safeCurrent + 1;

  await kv.put(key, String(next), {
    expirationTtl: retryAfter + 60,
  });

  return {
    limited: next > config.max,
    retryAfter,
  };
};

const hitRateLimit = async (ip: string, env: RegisterEnv) => {
  const config = readRateLimitConfig(env);
  const kv = env.RATE_LIMIT_KV;
  if (kv) {
    try {
      return await hitRateLimitWithKv(ip, kv, config);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("rate_limit_kv_error", error);
    }
  }

  return hitRateLimitInMemory(ip, config);
};

const getClientIp = (request: Request) => {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) return cfIp.trim();
  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
};

const trimString = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const parseBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
  }
  if (typeof value === "number") return value !== 0;
  return false;
};

export const registerSchema = z
  .object({
    division: z.preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z.enum(["console", "arcade"])
    ),
    // Honeypot field (should stay empty). Helps block simple bots.
    website: z.preprocess(trimString, z.string().max(L.website).optional()),
    // Turnstile token (required when TURNSTILE_SECRET_KEY is set).
    turnstileToken: z.preprocess(
      trimString,
      z.string().max(L.turnstileToken).optional()
    ),
    name: z.preprocess(
      trimString,
      z.string().min(1, "name is required").max(L.name)
    ),
    phone: z.preprocess(
      trimString,
      z.string().min(1, "phone is required").max(L.phone)
    ),
    email: z.preprocess(
      trimString,
      z.string().email("valid email is required").max(L.email)
    ),
    nickname: z.preprocess(
      trimString,
      z.string().min(1, "nickname is required").max(L.nickname)
    ),
    namcoId: z.preprocess(
      trimString,
      z.string().min(1, "namcoId is required").max(L.namcoId)
    ),
    // Console only
    videoLink: z.preprocess(
      trimString,
      z.string().max(L.videoLink).optional()
    ),
    // Arcade only
    dohirobaNo: z.preprocess(
      trimString,
      z.string().max(L.dohirobaNo).optional()
    ),
    qualifierRegion: z.preprocess(
      trimString,
      z.string().max(L.qualifierRegion).optional()
    ),
    offlineSongs: z.array(z.string().max(L.offlineSong)).optional(),
    // Common
    spectator: z.preprocess(parseBoolean, z.boolean()),
    isMinor: z.preprocess(parseBoolean, z.boolean()),
    consentLink: z.preprocess(
      trimString,
      z.string().max(L.consentLink).optional()
    ),
    privacyAgree: z
      .preprocess(parseBoolean, z.boolean())
      .refine((value) => value === true, {
        message: "privacyAgree must be true",
      }),
  })
  .superRefine((data, ctx) => {
    if (data.website && data.website.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["website"],
        message: "Bot detected",
      });
      return;
    }

    // Console: videoLink required
    if (data.division === "console" && !data.videoLink?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["videoLink"],
        message: "videoLink is required for console division",
      });
    }

    // Arcade: dohirobaNo, qualifierRegion, offlineSongs required
    if (data.division === "arcade") {
      if (!data.dohirobaNo?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dohirobaNo"],
          message: "dohirobaNo is required for arcade division",
        });
      }
      if (!data.qualifierRegion?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["qualifierRegion"],
          message: "qualifierRegion is required for arcade division",
        });
      }
      if (
        !data.offlineSongs ||
        data.offlineSongs.length !== 4 ||
        data.offlineSongs.some((s) => !s?.trim())
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["offlineSongs"],
          message: "4 offline songs are required for arcade division",
        });
      }
    }

    if (data.isMinor && !data.consentLink?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["consentLink"],
        message: "consentLink is required when isMinor=true",
      });
    }

    // URL scheme allowlist: https only
    if (data.videoLink?.trim()) {
      try {
        const parsed = new URL(data.videoLink.trim());
        if (parsed.protocol !== "https:") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["videoLink"],
            message: "videoLink must use https",
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["videoLink"],
          message: "videoLink must be a valid URL",
        });
      }
    }

    if (data.consentLink?.trim()) {
      try {
        const parsed = new URL(data.consentLink.trim());
        if (parsed.protocol !== "https:") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["consentLink"],
            message: "consentLink must use https",
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["consentLink"],
          message: "consentLink must be a valid URL",
        });
      }
    }
  });

type RegisterPayload = z.infer<typeof registerSchema>;

export const onRequestPost = async ({ env, request }) => {
  try {
    const clientIp = getClientIp(request);
    const runtimeEnv = env as RegisterEnv;
    const rate = await hitRateLimit(clientIp, runtimeEnv);
    if (rate.limited) {
      return tooManyRequests("Too many requests", rate.retryAfter);
    }

    const body = (await request.json().catch(() => null)) as unknown;
    if (!body) return badRequest("Invalid JSON body");

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid request payload";
      return badRequest(message);
    }

    const turnstileSecret = runtimeEnv.TURNSTILE_SECRET_KEY;
    const token = parsed.data.turnstileToken?.trim() ?? "";

    if (turnstileSecret) {
      if (!token) return badRequest("Turnstile verification required");

      const verifyBody = new URLSearchParams();
      verifyBody.set("secret", turnstileSecret);
      verifyBody.set("response", token);
      const remoteIp = request.headers.get("CF-Connecting-IP");
      if (remoteIp) verifyBody.set("remoteip", remoteIp);

      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: verifyBody,
        }
      );
      const verifyJson = (await verifyRes.json().catch(() => null)) as
        | { success?: boolean }
        | null;

      if (!verifyJson?.success) {
        return badRequest("Turnstile verification failed");
      }
    }

    const { website: _website, turnstileToken: _token, ...payloadBase } =
      parsed.data;

    const payload: RegisterPayload = {
      ...payloadBase,
      name: escapeFormulaField(payloadBase.name),
      phone: escapeFormulaField(payloadBase.phone),
      email: escapeFormulaField(payloadBase.email),
      nickname: escapeFormulaField(payloadBase.nickname),
      namcoId: escapeFormulaField(payloadBase.namcoId),
      videoLink: escapeFormulaField(parsed.data.videoLink ?? ""),
      dohirobaNo: escapeFormulaField(parsed.data.dohirobaNo ?? ""),
      qualifierRegion: parsed.data.qualifierRegion ?? "",
      offlineSongs: (parsed.data.offlineSongs ?? []).map(escapeFormulaField),
      consentLink: escapeFormulaField(parsed.data.consentLink ?? ""),
    };

    const gas = await callGasJson(runtimeEnv, "register", {}, payload);
    return ok({ data: gas.data });
  } catch (err) {
    return serverError(err);
  }
};
