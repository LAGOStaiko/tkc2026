import { ok, serverError, withNoStore } from "../../_lib/response";
import { callGasJson } from "../../_lib/gas";
import { requireOpsAuth } from "../../_lib/ops-auth";

export const onRequestPost = async ({ request, env }) => {
  const noStoreInit = withNoStore();
  try {
    const authError = requireOpsAuth(env, request);
    if (authError) return authError;

    const gas = await callGasJson(env, "opsListSnapshots");
    const gasData = gas.data as Record<string, unknown> | undefined;
    return ok(
      { data: Array.isArray(gasData?.snapshots) ? gasData.snapshots : [] },
      noStoreInit
    );
  } catch (err) {
    return serverError(err, noStoreInit);
  }
};
