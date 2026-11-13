"use client";
import Image from "next/image";
import { useState } from "react";
import { Car } from "lucide-react";
export function PublicPhoto({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">{failed ? <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-slate-600"><Car aria-hidden="true" className="size-10" /><span className="text-sm">Photograph unavailable</span></div> : <Image src={url} alt={alt} fill unoptimized className="object-cover" onError={() => setFailed(true)} />}</div>;
}
