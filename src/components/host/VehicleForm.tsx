"use client";
import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { VehicleDraftValues } from "@/lib/validation/host-vehicle";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
type Initial = Omit<VehicleDraftValues, "fuelType" | "transmission"> & { id: string; revision: number; status: string; fuelType: string; transmission: string };
const fields = [
  { name: "make", label: "Make", max: 80 }, { name: "model", label: "Model", max: 100 },
  { name: "category", label: "Category", max: 80 }, { name: "location", label: "Location", max: 200 },
  { name: "seats", label: "Seats", numeric: true },
  { name: "baseHalfDay", label: "Half-day base price (KES)", numeric: true },
  { name: "baseFullDay", label: "Full-day base price (KES)", numeric: true },
] as const;

export function VehicleForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribe, clientReady, serverReady);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [revision, setRevision] = useState(initial?.revision ?? 0);
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const feedback = useRef<HTMLDivElement>(null);
  const editable = status === "DRAFT" || status === "REJECTED";
  const inputClass = "mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-slate-100";
  const errorText = (name: string) => errors[name]?.length ? <p id={`${name}-error`} className="mt-1 text-sm text-red-700">{errors[name].join(" ")}</p> : null;

  async function send(path: string, method: string, body: unknown) {
    setBusy(true); setMessage(""); setErrors({});
    try {
      const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.message ?? "Unable to save. Please try again."); setErrors(result.fields ?? {}); feedback.current?.focus(); return; }
      setRevision(result.revision); setStatus(result.status); setDirty(false);
      setMessage(result.status === "PENDING_REVIEW" ? "Submitted for review. This does not publish your listing." : "Draft saved.");
      if (!initial) router.replace(`/host/vehicles/${result.id}`);
      router.refresh();
    } catch { setMessage("Unable to connect. Your changes have not been confirmed. Please try again."); feedback.current?.focus(); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: Record<string, string | number> = {};
    for (const key of ["make", "model", "category", "location", "description", "registrationNumber", "fuelType", "transmission"]) body[key] = String(form.get(key) ?? "");
    for (const key of ["seats", "baseHalfDay", "baseFullDay"]) body[key] = Number(form.get(key));
    if (initial) body.expectedRevision = revision;
    await send(initial ? `/api/host/vehicles/${initial.id}` : "/api/host/vehicles", initial ? "PATCH" : "POST", body);
  }
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
    {!editable && <p className="mb-6 rounded-xl bg-slate-100 p-4 text-slate-700">This listing is read-only while {status === "PENDING_REVIEW" ? "awaiting review" : status.toLowerCase()}. Contact KiliRide if you need help.</p>}
    <form onSubmit={save} onChange={() => setDirty(true)} method="post">
      <fieldset disabled={!hydrated || busy || !editable} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <legend className="sr-only">Vehicle details</legend>
        {fields.map(field => <div key={field.name} className="min-w-0">
          <label htmlFor={field.name} className="font-medium">{field.label}</label>
          <input id={field.name} name={field.name} className={inputClass} required type={"numeric" in field ? "number" : "text"} min={"numeric" in field ? 1 : undefined} max={"numeric" in field ? 2147483647 : undefined} step={"numeric" in field ? 1 : undefined} maxLength={"max" in field ? field.max : undefined} defaultValue={initial?.[field.name] ?? ""} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} />
          {errorText(field.name)}
        </div>)}
        {([{ name: "fuelType", label: "Fuel type", options: ["Petrol", "Diesel", "Hybrid", "Electric"] }, { name: "transmission", label: "Transmission", options: ["Automatic", "Manual"] }] as const).map(field => <div key={field.name}>
          <label htmlFor={field.name} className="font-medium">{field.label}</label><select id={field.name} name={field.name} className={inputClass} required defaultValue={initial?.[field.name] ?? ""} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}><option value="" disabled>Select {field.label.toLowerCase()}</option>{field.options.map(option => <option key={option}>{option}</option>)}</select>{errorText(field.name)}
        </div>)}
        <div><label htmlFor="registrationNumber" className="font-medium">Registration number</label><input id="registrationNumber" name="registrationNumber" className={inputClass} maxLength={40} defaultValue={initial?.registrationNumber ?? ""} aria-invalid={!!errors.registrationNumber} aria-describedby={`registration-help${errors.registrationNumber ? " registrationNumber-error" : ""}`} /><p id="registration-help" className="mt-1 text-sm text-slate-600">Private listing detail. Required before review.</p>{errorText("registrationNumber")}</div>
        <div className="sm:col-span-2"><label htmlFor="description" className="font-medium">Description</label><textarea id="description" name="description" rows={5} className={inputClass} maxLength={2000} defaultValue={initial?.description ?? ""} aria-invalid={!!errors.description} aria-describedby={`description-help${errors.description ? " description-error" : ""}`} /><p id="description-help" className="mt-1 text-sm text-slate-600">Describe the vehicle accurately. Required before review.</p>{errorText("description")}</div>
        {editable && <Button type="submit" disabled={!hydrated || busy} className="bg-emerald-600 hover:bg-emerald-700 sm:col-span-2">{busy ? "Please wait" : status === "REJECTED" ? "Save revised draft" : "Save draft"}</Button>}
      </fieldset>
    </form>
    <div ref={feedback} tabIndex={-1} role="status" aria-live="polite" className="mt-4 text-sm text-slate-700">{message}</div>
    {initial && status === "DRAFT" && <div className="mt-6 border-t border-slate-200 pt-6"><p className="mb-3 text-sm text-slate-600">{dirty ? "Save your changes before submitting." : "Review your details before submitting. Ownership and listing approval still require review."}</p><Button type="button" variant="outline" disabled={!hydrated || busy || dirty} onClick={() => send(`/api/host/vehicles/${initial.id}/submit`, "POST", { expectedRevision: revision })}>Submit for review</Button></div>}
  </div>;
}
