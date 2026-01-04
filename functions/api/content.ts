import { badRequest, ok, serverError } from "../_lib/response";
import { callGasJson, Env } from "../_lib/gas";

const ALLOWED_PAGES = new Set(["home", "console", "arcade", "contact"]);

export const onRequestGet = async ({ env, request }) => {
  try {
    const url = new URL(request.url);
    const page = (url.searchParams.get("page") || "").trim();

    if (!ALLOWED_PAGES.has(page)) {
      return badRequest("Invalid page. Use one of: home, console, arcade, contact");
    }

    const gas = await callGasJson(env, "content", { page });
    return ok({ data: gas.data });
  } catch (err) {
    return serverError(err);
  }
};
