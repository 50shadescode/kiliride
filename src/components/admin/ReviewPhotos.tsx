"use client";
import Image from "next/image";
import { useState } from "react";
type Photo = { id: string; url: string; altText: string; available: boolean; isCover: boolean };
function ReviewPhoto({ photo }: { photo: Photo }) {
  const [state, setState] = useState(photo.available ? "loading" : "unavailable");
  return <figure className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><div className="relative aspect-[4/3]">{state !== "unavailable" && <Image src={photo.url} alt={photo.altText} fill unoptimized className="object-contain" onLoad={() => setState("ready")} onError={() => setState("unavailable")} />}{state !== "ready" && <p role="status" className="absolute inset-0 flex items-center justify-center p-4 text-center">{state === "loading" ? "Loading photograph…" : "Photograph unavailable. Approval requires available photographs."}</p>}</div><figcaption className="break-words p-3 text-sm">{photo.altText}{photo.isCover ? " · Cover photograph" : ""}</figcaption></figure>;
}
export function ReviewPhotos({ photos }: { photos: Photo[] }) { return photos.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map(photo => <ReviewPhoto key={photo.id} photo={photo} />)}</div> : <p className="mt-3">No photographs submitted. Approval requires actual vehicle photographs.</p>; }
