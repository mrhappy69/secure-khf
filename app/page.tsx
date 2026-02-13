"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthed, setAuthCookie } from "../components/auth";
import { Badge, Card, CardBody, Divider, Input, PrimaryButton } from "../components/ui";

function validateCreds(username: string, password: string) {
  // Demo credentials (ganti sesuai kebutuhan)
  return username.trim() === "a" && password === "a";
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthed()) router.replace("/dashboard");
  }, [router]);

  const disclaimer = useMemo(
    () => [
    "Silahkan login dan gunakan aplikasi ini dengan baik - KHF by VISION"
    ],
    []
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    // Simulate a tiny delay for nicer UX
    await new Promise((r) => setTimeout(r, 400));

    if (!validateCreds(username, password)) {
      setBusy(false);
      setError("Login gagal. Periksa kembali username & password.");
      return;
    }

    setAuthCookie();
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-5 py-14">
        <div className="mb-7 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-slate-400">secure portal</p>

          </div>

        </div>

        <Card>

          <CardBody>
            <ul className="space-y-3 text-sm text-slate-600">
              {disclaimer.map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                    ✓
                  </span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>

            <Divider />

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Username</label>
                <Input
                  autoComplete="username"
                  placeholder="contoh: a"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="contoh: a"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <PrimaryButton type="submit" disabled={busy}>
                {busy ? "Memproses..." : "Login"}
              </PrimaryButton>

              <p className="text-xs text-slate-400">
                Default demo login: <span className="font-semibold text-slate-600">a / a</span> (silakan ganti di file{" "}
                <span className="font-mono text-slate-600">app/page.tsx</span>).
              </p>
            </form>
          </CardBody>
        </Card>

        <p className="mt-7 text-xs text-slate-400">
          © {new Date().getFullYear()} — Elegant Next.js Template
        </p>
      </div>
    </main>
  );
}
