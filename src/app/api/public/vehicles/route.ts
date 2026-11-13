import { publicCatalogue } from "@/server/fleet/public";
import { catalogueError, catalogueJson, catalogueQuery } from "@/server/fleet/public-http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { return catalogueJson(await publicCatalogue(catalogueQuery(request))); } catch (error) { return catalogueError(error); } }
