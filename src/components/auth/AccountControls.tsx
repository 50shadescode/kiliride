"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AccountControls({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [setup, setSetup] = useState<{ uri: string; codes: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  async function enroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      if (!setup) {
        const result = await authClient.twoFactor.enable({ password: String(data.get("password") ?? "") });
        if (result.error || !result.data || !("totpURI" in result.data)) { setMessage("Unable to start enrollment. Check your password."); return; }
        setSetup({ uri: result.data.totpURI, codes: result.data.backupCodes });
        setMessage("Import the setup URI into your authenticator. Save recovery codes privately, then verify a code.");
      } else {
        const result = await authClient.twoFactor.verifyTotp({ code: String(data.get("code") ?? "") });
        if (result.error) { setMessage("Invalid authenticator code. Please try again."); return; }
        setSetup(null); setMessage("Two-step verification enabled."); router.refresh();
      }
    } catch { setMessage("Unable to connect. Please try again."); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    try {
      const result = await authClient.signOut();
      if (result.error) { setMessage("Unable to log out. Please try again."); return; }
      router.push("/login"); router.refresh();
    } catch { setMessage("Unable to log out. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="mt-8 space-y-6">
    <h2 className="text-xl font-bold">Account security</h2>
    <p>Two-step verification: {enabled ? "Enabled" : "Not enabled"}. Required for administrator access.</p>
    {!enabled && <form onSubmit={enroll} className="space-y-4">
      {setup ? <>
        <label htmlFor="setup-uri" className="block">Authenticator setup URI (private)</label>
        <textarea id="setup-uri" readOnly value={setup.uri} className="w-full rounded-xl border p-3" />
        <p>Save these recovery codes securely. Each code can be used once.</p>
        <ul className="break-all font-mono text-sm">{setup.codes.map(code => <li key={code}>{code}</li>)}</ul>
        <label htmlFor="totp-code" className="block">Authenticator code</label>
        <input id="totp-code" name="code" required autoComplete="one-time-code" inputMode="numeric" className="rounded-xl border p-3" />
      </> : <><label htmlFor="mfa-password" className="block">Current password</label><input id="mfa-password" name="password" type="password" required autoComplete="current-password" className="w-full rounded-xl border p-3" /></>}
      <Button disabled={busy} type="submit">{setup ? "Confirm authenticator" : "Set up two-step verification"}</Button>
    </form>}
    <p role="status" aria-live="polite">{message}</p>
    <Button disabled={busy} onClick={logout} variant="outline">Log out</Button>
  </div>;
}
