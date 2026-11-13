import "server-only";
import { parseRuntimeEnv } from "./runtime-config";

export function getEnv() {
  return parseRuntimeEnv(process.env);
}
