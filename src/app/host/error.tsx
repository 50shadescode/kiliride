"use client";
import { Button } from "@/components/ui/button";
export default function HostError({ reset }: { reset: () => void }) { return <section className="mx-auto my-10 max-w-3xl rounded-2xl bg-white p-6"><h1 className="text-2xl font-bold">Unable to load vehicle management</h1><p className="my-4">Please try again.</p><Button onClick={reset}>Try again</Button></section>; }
