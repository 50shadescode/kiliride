"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

type Mode = "login" | "signup" | "forgot-password" | "reset-password" | "verify-email";
const titles: Record<Mode, string> = {
  login: "Log in", signup: "Create your account", "forgot-password": "Recover your account",
  "reset-password": "Set a new password", "verify-email": "Verify your email",
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState(params.has("error") ? "This link is invalid or expired. Request a new verification or recovery email." : "");
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState(false);
  const [backup, setBackup] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    try {
      if (challenge) {
        const code = String(data.get("code") ?? "");
        const result = backup ? await authClient.twoFactor.verifyBackupCode({ code }) : await authClient.twoFactor.verifyTotp({ code });
        if (result.error) { setMessage("The verification code was not accepted. Please try again."); return; }
        router.push("/account"); router.refresh(); return;
      }
      if (mode === "signup") {
        const result = await authClient.signUp.email({ name: String(data.get("name") ?? "").trim(), email, password, callbackURL: "/login" });
        if (result.error) { setMessage(result.error.status === 429 ? "Too many attempts. Please wait a minute before trying again." : "Unable to create the account. Check your details or try account recovery."); return; }
        setMessage("Check your email for a verification link before logging in.");
      } else if (mode === "login") {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) { setMessage(result.error.status === 429 ? "Too many attempts. Please wait a minute before trying again." : "Login failed. Check your credentials and verify your email."); return; }
        if (result.data && "twoFactorRedirect" in result.data && result.data.twoFactorRedirect) { setChallenge(true); return; }
        router.push("/account"); router.refresh();
      } else if (mode === "forgot-password") {
        const result = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
        setMessage(result.error ? "Unable to request recovery right now. Please try again later." : "If an account exists, a recovery link will be sent to its email address.");
      } else if (mode === "verify-email") {
        const result = await authClient.sendVerificationEmail({ email, callbackURL: "/login" });
        setMessage(result.error ? "Unable to request verification right now. Please try again later." : "If verification is needed, check your email for a new link.");
      } else {
        const token = params.get("token");
        if (!token) { setMessage("This recovery link is missing or invalid. Request a new link."); return; }
        const result = await authClient.resetPassword({ newPassword: password, token });
        setMessage(result.error ? "This recovery link is invalid or expired. Request a new link." : "Your password has been reset. Log in with your new password.");
      }
    } catch { setMessage("Unable to connect. Please try again."); }
    finally { setBusy(false); }
  }

  const input = "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-600";
  return (
    <section className="mx-auto my-12 w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">{challenge ? "Two-step verification" : titles[mode]}</h1>
      <form onSubmit={submit} className="mt-6 space-y-5">
        {challenge ? <div><label htmlFor="code">{backup ? "Recovery code" : "Authenticator code"}</label><input className={input} id="code" name="code" required autoComplete="one-time-code" maxLength={64} /></div> : <>
          {mode === "signup" && <div><label htmlFor="name">Full name</label><input className={input} id="name" name="name" autoComplete="name" required maxLength={100} /></div>}
          {mode !== "reset-password" && <div><label htmlFor="email">Email address</label><input className={input} id="email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>}
          {["login", "signup", "reset-password"].includes(mode) && <div><label htmlFor="password">Password</label><input className={input} id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? 1 : 12} maxLength={128} /><p className="mt-2 text-sm text-slate-500">Use at least 12 characters for a new password.</p></div>}
        </>}
        <p role="status" aria-live="polite" className="text-sm text-slate-700">{message}</p>
        <Button type="submit" disabled={busy} className="w-full bg-emerald-600 hover:bg-emerald-700">{busy ? "Please wait" : challenge ? "Verify code" : titles[mode]}</Button>
        {challenge && <button type="button" className="text-sm underline" onClick={() => setBackup(!backup)}>{backup ? "Use authenticator code" : "Use a recovery code"}</button>}
      </form>
      <nav aria-label="Account help" className="mt-6 flex flex-wrap gap-4 text-sm text-emerald-700">
        <Link href="/login">Log in</Link><Link href="/signup">Sign up</Link><Link href="/forgot-password">Forgot password</Link><Link href="/verify-email">Verify email</Link>
      </nav>
    </section>
  );
}
