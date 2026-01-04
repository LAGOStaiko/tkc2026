import { ok, serverError } from "../_lib/response";
import { callGasJson, Env } from "../_lib/gas";

export const onRequestGet = async ({ env }) => {
  try {
    const gas = await callGasJson(env, "results");
    return ok({ data: gas.data });
  } catch (err) {
    return serverError(err);
  }
};
