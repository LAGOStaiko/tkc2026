import { z } from "zod";
import {
  badGateway,
  badRequest,
  forbidden,
  noContent,
  ok,
  payloadTooLarge,
  serverError,
  serviceUnavailable,
  tooManyRequests,
  unsupportedMediaType,
  withNoStore,
} from "../_lib/response";
import { callGasJson, resolveDeploymentTier } from "../_lib/gas";
import { escapeFormulaField } from "../_lib/sanitize";
import {
  hitRateLimit,
  buildRateLimitConfig,
  getClientIp,
  type RateLimitEnv,
} from "../_lib/rate-limit";
import {
  isJsonContentType,
  readJsonBodyWithLimit,
  resolveRegisterMaxBodyBytes,
  validateRegisterRequestContext,
  type RegisterGuardEnv,
} from "../_lib/request-guards";
import { REGISTER_LIMITS as L } from "../../shared/register-limits";

type TurnstileMode = "off" | "conditional" | "required";

type RegisterEnv = RateLimitEnv &
  RegisterGuardEnv & {
    TURNSTILE_SECRET_KEY?: string;
    TURNSTILE_MODE?: string;
    TURNSTILE_EXPECTED_HOSTNAMES?: string;
    TURNSTILE_EXPECTED_ACTION?: string;
  };

type TurnstileVerifyResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
};

const TURNSTILE_VERIFY_TIMEOUT_MS = 4_000;

const registerRateConfig = (env: RegisterEnv) =>
  buildRateLimitConfig(env, {
    prefix: "register:rate-limit",
    defaultWindowMs: 10 * 60 * 1000,
    defaultMax: 30,
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
    website: z.preprocess(trimString, z.string().max(L.website).optional()),
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
      z.string().max(L.namcoId).optional()
    ),
    videoLink: z.preprocess(
      trimString,
      z.string().max(L.videoLink).optional()
    ),
    dohirobaNo: z.preprocess(
      trimString,
      z.string().max(L.dohirobaNo).optional()
    ),
    qualifierRegion: z.preprocess(
      trimString,
      z.string().max(L.qualifierRegion).optional()
    ),
    offlineSongs: z.array(z.string().max(L.offlineSong)).max(4).optional(),
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

    if (data.division === "console" && !data.videoLink?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["videoLink"],
        message: "videoLink is required for console division",
      });
    }

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
        data.offlineSongs.some((song) => !song?.trim())
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
const NICKNAME_DUPLICATE_PREFIX = "이미 같은 부문/예선지역에 동일한 닉네임";

const isDuplicateBusinessError = (message: string) =>
  message === "DUPLICATE_ENTRY" ||
  message.startsWith("DUPLICATE_ENTRY:") ||
  message.startsWith(NICKNAME_DUPLICATE_PREFIX);

function parseCsvSet(raw: string | undefined): Set<string> {
  return new Set(
    String(raw ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

function resolveTurnstileMode(env: RegisterEnv): TurnstileMode {
  const raw = String(env.TURNSTILE_MODE ?? "")
    .trim()
    .toLowerCase();
  if (raw === "off" || raw === "conditional" || raw === "required") {
    return raw;
  }

  return resolveDeploymentTier(env) === "production" ? "required" : "conditional";
}

async function verifyTurnstileToken(
  request: Request,
  token: string,
  env: RegisterEnv,
  init: ResponseInit
): Promise<Response | null> {
  const turnstileSecret = env.TURNSTILE_SECRET_KEY?.trim();
  if (!turnstileSecret) {
    return serviceUnavailable("Security verification is unavailable", init);
  }

  const verifyBody = new URLSearchParams();
  verifyBody.set("secret", turnstileSecret);
  verifyBody.set("response", token);
  verifyBody.set("idempotency_key", crypto.randomUUID());
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) verifyBody.set("remoteip", remoteIp);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TURNSTILE_VERIFY_TIMEOUT_MS);

  let verifyRes: Response;
  try {
    verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: verifyBody,
        signal: controller.signal,
      }
    );
  } catch {
    return badGateway("Turnstile verification unavailable", init);
  } finally {
    clearTimeout(timeoutId);
  }

  let verifyJson: TurnstileVerifyResponse | null = null;
  try {
    verifyJson = (await verifyRes.json()) as TurnstileVerifyResponse;
  } catch {
    return badGateway("Turnstile verification unavailable", init);
  }

  if (!verifyJson?.success) {
    return badRequest("Turnstile verification failed", undefined, init);
  }

  const expectedHostnames = parseCsvSet(env.TURNSTILE_EXPECTED_HOSTNAMES);
  if (expectedHostnames.size > 0) {
    const hostname = String(verifyJson.hostname ?? "")
      .trim()
      .toLowerCase();
    if (!hostname || !expectedHostnames.has(hostname)) {
      return badRequest("Turnstile verification failed", undefined, init);
    }
  }

  const expectedAction = String(env.TURNSTILE_EXPECTED_ACTION ?? "")
    .trim()
    .toLowerCase();
  if (expectedAction) {
    const action = String(verifyJson.action ?? "")
      .trim()
      .toLowerCase();
    if (action !== expectedAction) {
      return badRequest("Turnstile verification failed", undefined, init);
    }
  }

  return null;
}

export const onRequestOptions = async () => {
  return noContent(withNoStore({ headers: { Allow: "POST, OPTIONS" } }));
};

export const onRequestPost = async ({ env, request }) => {
  const noStoreInit = withNoStore();

  try {
    if (!isJsonContentType(request)) {
      return unsupportedMediaType("Content-Type must be application/json", noStoreInit);
    }

    const runtimeEnv = env as RegisterEnv;
    const requestContext = validateRegisterRequestContext(request, runtimeEnv);
    if (!requestContext.allowed) {
      return forbidden("Invalid request context", noStoreInit);
    }

    const clientIp = getClientIp(request);
    const rate = await hitRateLimit(clientIp, runtimeEnv, registerRateConfig(runtimeEnv));
    if (rate.limited) {
      return tooManyRequests("Too many requests", rate.retryAfter, noStoreInit);
    }

    const bodyResult = await readJsonBodyWithLimit(
      request,
      resolveRegisterMaxBodyBytes(runtimeEnv)
    );
    if (!bodyResult.ok) {
      if (bodyResult.status === 413) {
        return payloadTooLarge(bodyResult.error, noStoreInit);
      }
      return badRequest(bodyResult.error, undefined, noStoreInit);
    }

    const parsed = registerSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid request payload";
      return badRequest(message, undefined, noStoreInit);
    }

    const turnstileMode = resolveTurnstileMode(runtimeEnv);
    const turnstileSecret = runtimeEnv.TURNSTILE_SECRET_KEY?.trim() ?? "";
    const token = parsed.data.turnstileToken?.trim() ?? "";

    if (turnstileMode === "required" && !turnstileSecret) {
      return serviceUnavailable("Security verification is unavailable", noStoreInit);
    }

    const shouldVerifyTurnstile =
      turnstileMode === "required" ||
      (turnstileMode === "conditional" && !!turnstileSecret);

    if (shouldVerifyTurnstile) {
      if (!token) {
        return badRequest("Turnstile verification required", undefined, noStoreInit);
      }
      const verifyErr = await verifyTurnstileToken(
        request,
        token,
        runtimeEnv,
        noStoreInit
      );
      if (verifyErr) return verifyErr;
    }

    const { website: _website, turnstileToken: _token, ...payloadBase } =
      parsed.data;

    const payload: RegisterPayload = {
      ...payloadBase,
      name: escapeFormulaField(payloadBase.name),
      phone: escapeFormulaField(payloadBase.phone),
      email: escapeFormulaField(payloadBase.email),
      nickname: escapeFormulaField(payloadBase.nickname),
      namcoId: escapeFormulaField(payloadBase.namcoId ?? ""),
      videoLink: escapeFormulaField(parsed.data.videoLink ?? ""),
      dohirobaNo: escapeFormulaField(parsed.data.dohirobaNo ?? ""),
      qualifierRegion: escapeFormulaField(parsed.data.qualifierRegion ?? ""),
      offlineSongs: (parsed.data.offlineSongs ?? []).map(escapeFormulaField),
      consentLink: escapeFormulaField(parsed.data.consentLink ?? ""),
    };

    const gas = await callGasJson(runtimeEnv, "register", {}, payload);
    return ok({ data: gas.data }, noStoreInit);
  } catch (err) {
    const message = err instanceof Error ? err.message.trim() : "";
    if (isDuplicateBusinessError(message)) {
      return badRequest(message, undefined, noStoreInit);
    }
    return serverError(err, noStoreInit);
  }
};

