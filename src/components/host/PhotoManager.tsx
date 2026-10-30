"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowUp, ArrowDown, ImageOff, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_IMAGE_BYTES, MAX_VEHICLE_PHOTOS, type HostPhoto } from "@/lib/validation/vehicle-image";

type Gallery = { revision: number; status: string; photos: HostPhoto[] };
const subscribe = () => () => {};
function Thumbnail({ photo }: { photo: HostPhoto }) {
  const [failed, setFailed] = useState(false);
  return <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-slate-100">
    {failed ? <p className="p-4 text-center text-sm text-slate-600"><ImageOff aria-hidden="true" className="mx-auto mb-2" />Photograph unavailable</p> : <Image unoptimized fill sizes="(max-width: 640px) 100vw, 50vw" src={photo.url} alt={photo.altText} className="object-contain" onError={() => setFailed(true)} />}
  </div>;
}
export function PhotoManager({ vehicleId, initial }: { vehicleId: string; initial: Gallery }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [gallery, setGallery] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [replacement, setReplacement] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const path = `/api/host/vehicles/${vehicleId}/photos`;
  const editable = ["DRAFT", "REJECTED"].includes(gallery.status);
  async function refresh() {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error("Reload the page to check your current access.");
    setGallery(await response.json());
  }
  async function result(response: Response) {
    const data = await response.json();
    if (!response.ok) throw new Error(data.message ?? "Unable to change photographs.");
    return data as { revision: number; status: string };
  }
  async function change(work: () => Promise<void>) {
    setBusy(true); setMessage(""); setRemoving(null);
    try { await work(); setReplacement(null); setMessage("Photographs saved. They remain private."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to connect. Reload before retrying."); }
    finally {
      // Refresh even after an uncertain response/partial multi-upload. Never reuse
      // a possibly stale revision for an automatic retry.
      try { await refresh(); router.refresh(); } catch { setBlocked(true); setMessage("Unable to refresh photographs. Reload the page before making more changes."); }
      setBusy(false); feedback.current?.focus();
    }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const files = [...(fileInput.current?.files ?? [])];
    const altText = String(form.get("altText") ?? "").trim();
    if (!files.length || files.some(file => file.size > MAX_IMAGE_BYTES) || (replacement && files.length !== 1) || (!replacement && files.length + gallery.photos.length > MAX_VEHICLE_PHOTOS)) { setMessage("Choose up to 12 photographs in total, each up to 5 MiB. Replacement accepts one photograph."); return; }
    await change(async () => {
      let revision = gallery.revision;
      for (const file of files) {
        const query = new URLSearchParams({ expectedRevision: String(revision), altText, ...(replacement ? { replacePhotoId: replacement } : {}) });
        const data = await result(await fetch(`${path}?${query}`, { method: "POST", headers: { "Content-Type": file.type }, body: file }));
        revision = data.revision;
      }
      if (fileInput.current) fileInput.current.value = "";
    });
  }
  function arrange(ids: string[], coverPhotoId: string) {
    return change(async () => { await result(await fetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedRevision: gallery.revision, photoIds: ids, coverPhotoId }) })); });
  }
  function move(index: number, delta: number) {
    const ids = gallery.photos.map(photo => photo.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    void arrange(ids, gallery.photos.find(photo => photo.isCover)?.id ?? ids[0]);
  }
  return <div className="space-y-6">
    <p className="text-slate-600">Photographs are private to your host account. Upload real photographs you have permission to use. Uploading does not verify or publish a listing.</p>
    {!editable && <p className="rounded-xl bg-slate-100 p-4">Photographs are read-only in this listing status.</p>}
    {editable && <form onSubmit={upload} method="post" className="rounded-2xl border border-slate-200 bg-white p-5">
      <fieldset disabled={!hydrated || busy || blocked} className="space-y-4">
        <legend className="font-semibold">{replacement ? "Replace photograph" : "Add photographs"}</legend>
        <p id="photo-help" className="text-sm text-slate-600">JPEG, PNG or WebP; up to 5 MiB and 24 megapixels each. Maximum 12 photographs. Animated images are not accepted.</p>
        <div><label htmlFor="photos" className="block font-medium">{replacement ? "Replacement photograph" : "Choose photographs"}</label><input ref={fileInput} id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple={!replacement} required aria-describedby="photo-help" className="mt-2 block w-full min-w-0 rounded-lg border border-slate-300 p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:p-2 file:text-emerald-800" /></div>
        <div><label htmlFor="altText" className="block font-medium">Photograph description</label><input id="altText" name="altText" required maxLength={200} className="mt-2 w-full rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-emerald-600" placeholder="For example, front view of the vehicle" /></div>
        <div className="flex flex-wrap gap-3"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{busy ? "Saving photographs" : replacement ? "Save replacement" : "Upload photographs"}</Button>{replacement && <Button type="button" variant="outline" onClick={() => { setReplacement(null); if (fileInput.current) fileInput.current.value = ""; }}>Cancel replacement</Button>}</div>
      </fieldset>
    </form>}
    <p ref={feedback} tabIndex={-1} role="status" aria-live="polite" className="text-sm text-slate-700">{message}</p>
    {gallery.photos.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">No photographs yet.</p> : <ol className="grid min-w-0 gap-5 sm:grid-cols-2">{gallery.photos.map((photo, index) => <li key={`${photo.id}-${gallery.revision}`} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
      <Thumbnail photo={photo} /><p className="mt-3 break-words font-medium">{index + 1}. {photo.altText}</p>
      {photo.isCover && <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-700"><Star size={16} aria-hidden="true" />Cover photograph</p>}
      {editable && <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={busy || blocked || index === 0} aria-label={`Move photograph ${index + 1} earlier`} onClick={() => move(index, -1)}><ArrowUp size={16} aria-hidden="true" /></Button>
        <Button type="button" variant="outline" disabled={busy || blocked || index === gallery.photos.length - 1} aria-label={`Move photograph ${index + 1} later`} onClick={() => move(index, 1)}><ArrowDown size={16} aria-hidden="true" /></Button>
        {!photo.isCover && <Button type="button" variant="outline" disabled={busy || blocked} onClick={() => arrange(gallery.photos.map(p => p.id), photo.id)}>Make cover</Button>}
        <Button type="button" variant="outline" disabled={busy || blocked} aria-label={`Replace photograph ${index + 1}`} onClick={() => { setReplacement(photo.id); if (fileInput.current) { fileInput.current.value = ""; fileInput.current.focus(); } }}>Replace</Button>
        <Button type="button" variant="outline" disabled={busy || blocked} aria-label={`Remove photograph ${index + 1}`} onClick={() => setRemoving(photo.id)}>Remove</Button>
        {removing === photo.id && <div className="w-full rounded-lg bg-slate-50 p-3"><p className="mb-2 text-sm">Remove this photograph?</p><div className="flex flex-wrap gap-2"><Button type="button" disabled={busy || blocked} onClick={() => change(async () => { await result(await fetch(`${path}/${photo.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedRevision: gallery.revision }) })); })}>Confirm removal</Button><Button type="button" variant="outline" onClick={() => setRemoving(null)}>Cancel</Button></div></div>}
      </div>}
    </li>)}</ol>}
  </div>;
}
