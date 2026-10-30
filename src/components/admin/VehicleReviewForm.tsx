"use client";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { verificationChecks } from "@/lib/validation/vehicle-review";
import { resolvedProfile, type ComplianceMatrix } from "@/lib/validation/vehicle-compliance";
const subscribe = () => () => {};
export function VehicleReviewForm({ vehicleId, revision, status, selfReview, policies }: { vehicleId: string; revision: number; status: string; selfReview: boolean; policies: { version: string; reference: string; testOnly: boolean; requirements: ComplianceMatrix | null }[] }) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const [action, setAction] = useState(status === "PENDING_REVIEW" ? "REJECTED" : status === "APPROVED" ? "SUSPENDED" : "DRAFT");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const router = useRouter();
  const eligiblePolicies = policies.filter(policy => policy.requirements?.profiles.some(resolvedProfile));
  const [policyVersion, setPolicyVersion] = useState(eligiblePolicies[0]?.version ?? "");
  const [profileId, setProfileId] = useState("");
  const profiles = policies.find(policy => policy.version === policyVersion)?.requirements?.profiles ?? [];
  const profile = profiles.find(item => item.id === profileId) ?? profiles.find(resolvedProfile);
  if (selfReview) return <p className="rounded-xl bg-amber-50 p-4">You cannot review your own vehicle. An independent administrator must decide.</p>;
  if (status === "DRAFT") return <p>This draft must be completed and submitted by its owner before review.</p>;
  const field = "mt-1 block w-full rounded-lg border border-slate-300 p-3";
  return <form className="space-y-5" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setMessage(""); const data = new FormData(event.currentTarget);
    const evidenceReference = String(data.get("evidenceReference") || "").trim();
    const approval = action === "APPROVED" ? { policyVersion, checklist: Object.fromEntries(verificationChecks.map(check => [check.key, { confirmed: data.get(check.key) === "on", evidenceReference: String(data.get(`${check.key}Reference`)) }])), compliance: { profileId: profile?.id, contextConfirmed: data.get("contextConfirmed") === "on", checks: Object.fromEntries((profile?.requirements.filter(item => item.applicability === "MANDATORY") ?? []).map(item => [item.id, { confirmed: data.get(`compliance-${item.id}`) === "on", evidenceReference: String(data.get(`compliance-${item.id}-reference`)) }])) } } : undefined;
    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleId}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedRevision: revision, toStatus: action, reason: data.get("reason"), ...(evidenceReference ? { evidenceReference } : {}), ...(approval ? { approval } : {}) }) });
      const result = await response.json(); if (!response.ok) { setMessage(result.message || "Decision failed. Reload before retrying."); return; }
      setMessage("Decision recorded."); router.refresh();
    } catch { setMessage("The result could not be confirmed. Reload before retrying."); } finally { setBusy(false); }
  }}>
    {status === "PENDING_REVIEW" && !eligiblePolicies.length && <p className="rounded-xl bg-amber-50 p-4">Approval is blocked until an approved verification policy and resolved evidence requirements are recorded.</p>}
    <label className="block font-medium"><span id="review-decision-label">Decision</span><select aria-labelledby="review-decision-label" className={field} value={action} onChange={event => setAction(event.target.value)} disabled={busy}>
      {status === "PENDING_REVIEW" ? <><option value="REJECTED">Reject for correction</option><option value="APPROVED" disabled={!eligiblePolicies.length}>Approve after verification</option></> : status === "APPROVED" ? <option value="SUSPENDED">Suspend listing</option> : <option value="DRAFT">Reopen as draft for correction</option>}
    </select></label>
    {action === "APPROVED" && <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4"><legend className="px-2 font-bold">Required verification</legend><p className="text-sm text-slate-600">Record evidence actually reviewed under the selected policy. These declarations do not constitute an inspection or a legal compliance certificate.</p>
      <label className="block"><span id="review-policy-label">Approved policy</span><select aria-labelledby="review-policy-label" name="policyVersion" value={policyVersion} onChange={event => { setPolicyVersion(event.target.value); setProfileId(""); }} required className={field}>{eligiblePolicies.map(policy => <option key={policy.version} value={policy.version}>{policy.testOnly ? "TEST ONLY — " : ""}{policy.version}: {policy.reference}</option>)}</select></label>
      {verificationChecks.map(check => <div key={check.key} className="border-t border-slate-200 pt-4"><label className="flex items-start gap-3 font-medium"><input type="checkbox" name={check.key} required className="mt-1 size-5 accent-emerald-600" />{check.label}</label><p className="my-2 text-sm text-slate-600">{check.guidance}</p><label className="block text-sm">{check.label} evidence reference<input className={field} name={`${check.key}Reference`} required minLength={3} maxLength={500} /></label></div>)}
      <label className="block"><span id="review-profile-label">Compliance profile</span><select aria-labelledby="review-profile-label" className={field} value={profile?.id ?? ""} onChange={event => setProfileId(event.target.value)} required>{profiles.map(item => <option key={item.id} value={item.id} disabled={!resolvedProfile(item)}>{item.label}{!resolvedProfile(item) ? " — Pending policy review" : ""}</option>)}</select></label>
      {profile && <fieldset key={`${policyVersion}-${profile.id}`} className="space-y-4 rounded-xl bg-slate-50 p-4"><legend className="font-semibold">Applicable requirements</legend><dl className="space-y-2 text-sm">{Object.entries(profile.context).map(([key, value]) => <div key={key}><dt className="font-semibold">{({ jurisdiction: "Jurisdiction", vehicleClassification: "Vehicle classification", intendedUse: "Intended use", rentalArrangement: "Rental arrangement", ownershipArrangement: "Ownership arrangement", operatingArrangement: "Operating arrangement" })[key as keyof typeof profile.context]}</dt><dd className="break-words">{value.replaceAll("_", " ")}</dd></div>)}</dl>
        <label className="flex gap-3"><input name="contextConfirmed" type="checkbox" required className="mt-1 size-5 shrink-0 accent-emerald-600" />This compliance profile matches the actual rental arrangement</label>
        {profile.requirements.map(item => <div key={item.id} className="border-t border-slate-200 pt-3"><p className="font-semibold">{item.label} · {item.applicability.replaceAll("_", " ")}</p><p className="break-words text-sm">Authority: {item.supportingAuthority}<br />Applicability: {item.applicabilityBasis}<br />Evidence type: {item.evidenceType}<br />Policy review: {item.reviewStatus}</p>{item.applicability === "MANDATORY" && <><label className="mt-3 flex gap-3"><input type="checkbox" name={`compliance-${item.id}`} required className="mt-1 size-5 shrink-0 accent-emerald-600" />{item.label}</label><label className="mt-2 block text-sm">{item.label} evidence reference<input name={`compliance-${item.id}-reference`} className={field} required minLength={3} maxLength={500} /></label></>}</div>)}
      </fieldset>}
    </fieldset>}
    <label className="block font-medium">Reason shared with the owner<textarea className={field} name="reason" required minLength={10} maxLength={1000} rows={3} /></label><p className="text-sm text-slate-600">Give actionable feedback. Keep private evidence and unrelated personal information out of the owner-visible reason.</p>
    <label className="block">Private evidence reference (optional)<input className={field} name="evidenceReference" minLength={3} maxLength={500} /></label>
    <button disabled={!ready || busy} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Recording decision…" : "Record decision"}</button><p role="status" aria-live="polite" className="break-words text-sm">{message}</p>
  </form>;
}
