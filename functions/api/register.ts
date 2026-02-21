import { z } from "zod";
import { badRequest, ok, serverError, tooManyRequests } from "../_lib/response";
import { callGasJson } from "../_lib/gas";
import { escapeFormulaField } from "../_lib/sanitize";
import { hitRateLimit, buildRateLimitConfig, getClientIp, type RateLimitEnv } from "../_lib/rate-limit";
import { REGISTER_LIMITS as L } from "../../shared/register-limits";

type RegisterEnv = RateLimitEnv & {
  TURNSTILE_SECRET_KEY?: string;
};

const registerRateConfig = (env: RegisterEnv) =>
  buildRateLimitConfig(env, {
    prefix: "register:rate-limit",
    defaultWindowMs: 10 * 60 * 1000, // 10 minutes
    defaultMax: 30,                   // 30 requests per window
  });

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
    const rate = await hitRateLimit(clientIp, runtimeEnv, registerRateConfig(runtimeEnv));
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
