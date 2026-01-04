import { badRequest, ok, serverError } from "../_lib/response";
import { callGasJson, Env } from "../_lib/gas";

type Division = "console" | "arcade";

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function asBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["true", "1", "yes", "y", "TRUE"].includes(v.trim());
  if (typeof v === "number") return v !== 0;
  return false;
}

export const onRequestPost = async ({ env, request }) => {
  try {
    const body = await request.json().catch(() => null) as any;
    if (!body || typeof body !== "object") return badRequest("Invalid JSON body");

    const division = String(body.division || "").trim() as Division;
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const nickname = String(body.nickname || "").trim();
    const cardNo = String(body.cardNo || "").trim();
    const dohirobaNo = String(body.dohirobaNo || "").trim();
    const spectator = asBool(body.spectator);
    const isMinor = asBool(body.isMinor);
    const consentLink = String(body.consentLink || "").trim();
    const privacyAgree = asBool(body.privacyAgree);

    if (division !== "console" && division !== "arcade") return badRequest("division must be console or arcade");
    if (!name) return badRequest("name is required");
    if (!phone) return badRequest("phone is required");
    if (!email || !isEmail(email)) return badRequest("valid email is required");
    if (!nickname) return badRequest("nickname is required");
    if (!cardNo) return badRequest("cardNo is required");
    if (!privacyAgree) return badRequest("privacyAgree must be true");

    if (isMinor && !consentLink) {
      return badRequest("consentLink is required when isMinor=true");
    }

    const payload = {
      division,
      name,
      phone,
      email,
      nickname,
      cardNo,
      dohirobaNo,
      spectator,
      isMinor,
      consentLink,
      privacyAgree,
    };

    const gas = await callGasJson(env, "register", {}, payload);
    return ok({ data: gas.data });
  } catch (err) {
    return serverError(err);
  }
};
