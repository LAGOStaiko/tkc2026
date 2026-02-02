import { z } from "zod";
import { badRequest, ok, serverError } from "../_lib/response";
import { callGasJson, type _Env } from "../_lib/gas";

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

const registerSchema = z
  .object({
    division: z.preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z.enum(["console", "arcade"])
    ),
    // Honeypot field (should stay empty). Helps block simple bots.
    website: z.preprocess(trimString, z.string().optional()),
    name: z.preprocess(trimString, z.string().min(1, "name is required")),
    phone: z.preprocess(trimString, z.string().min(1, "phone is required")),
    email: z.preprocess(trimString, z.string().email("valid email is required")),
    nickname: z.preprocess(trimString, z.string().min(1, "nickname is required")),
    cardNo: z.preprocess(trimString, z.string().min(1, "cardNo is required")),
    dohirobaNo: z.preprocess(trimString, z.string().optional()),
    spectator: z.preprocess(parseBoolean, z.boolean()),
    isMinor: z.preprocess(parseBoolean, z.boolean()),
    consentLink: z.preprocess(trimString, z.string().optional()),
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

    if (data.isMinor && !data.consentLink?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["consentLink"],
        message: "consentLink is required when isMinor=true",
      });
    }
  });

type RegisterPayload = z.infer<typeof registerSchema>;

export const onRequestPost = async ({ env, request }) => {
  try {
    const body = (await request.json().catch(() => null)) as unknown;
    if (!body) return badRequest("Invalid JSON body");

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid request payload";
      return badRequest(message);
    }

    const { website: _website, ...payloadBase } = parsed.data;

    const payload: RegisterPayload = {
      ...payloadBase,
      dohirobaNo: parsed.data.dohirobaNo ?? "",
      consentLink: parsed.data.consentLink ?? "",
    };

    const gas = await callGasJson(env, "register", {}, payload);
    return ok({ data: gas.data });
  } catch (err) {
    return serverError(err);
  }
};
