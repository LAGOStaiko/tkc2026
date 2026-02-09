import { ok, serverError } from "../../_lib/response";
import { callGasJson } from "../../_lib/gas";
import { requireOpsAuth } from "../../_lib/ops-auth";

export const onRequestPost = async ({ request, env }) => {
  try {
    const authError = requireOpsAuth(env, request);
    if (authError) return authError;

    const gas = await callGasJson(env, "opsPublishLog");
    const gasData = gas.data as Record<string, unknown> | undefined;
    return ok({ data: Array.isArray(gasData?.entries) ? gasData.entries : [] });
  } catch (err) {
    return serverError(err);
  }
};
