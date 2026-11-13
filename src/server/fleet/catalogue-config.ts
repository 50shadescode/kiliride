import "server-only";
import { assertLocalDatabase } from "../../../scripts/local-safety.mjs";
export function databaseCatalogueEnabled() {
  const value = process.env.KILIRIDE_DB_CATALOGUE ?? "false";
  if (value === "false") return false;
  if (value !== "true") throw new Error("Invalid catalogue configuration");
  // 2F authorizes local previews, never production cutover.
  if (process.env.NODE_ENV === "production") throw new Error("Production catalogue cutover is not authorized");
  const url = new URL(assertLocalDatabase(process.env.DATABASE_URL));
  if (url.pathname === "/kiliride_test") assertLocalDatabase(url.href, true);
  else if (url.port !== "55432") throw new Error("Isolated development database required");
  return true;
}
