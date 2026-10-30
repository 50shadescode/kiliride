import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { z } from "zod";
import { pageIdentity } from "@/server/page-access";
import { AccessError } from "@/server/authorization";
import { photos } from "@/server/images/service";
import { PhotoManager } from "@/components/host/PhotoManager";
export const dynamic = "force-dynamic";
export default async function HostPhotosPage({ params }: { params: Promise<{ id: string }> }) {
  await pageIdentity("HOST");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const gallery = await photos().list(await headers(), id).catch(error => { if (error instanceof AccessError && error.status === 404) notFound(); throw error; });
  return <section className="mx-auto my-10 w-full max-w-4xl px-4 sm:px-6"><Link href={`/host/vehicles/${id}`} className="text-sm text-emerald-700 underline">Back to vehicle details</Link><h1 className="my-6 text-3xl font-bold">Vehicle photographs</h1><PhotoManager vehicleId={id} initial={gallery} /></section>;
}
