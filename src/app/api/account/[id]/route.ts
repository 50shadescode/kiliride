import { readOwnAccount } from "@/server/authorization";
import { privateError, privateJson } from "@/server/http";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return privateJson(await readOwnAccount(request.headers, (await context.params).id)); }
  catch (error) { return privateError(error); }
}
