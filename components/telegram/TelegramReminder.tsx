"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input, PrimaryButton, GhostButton, Textarea, SmallButton } from "../ui";

type TgContact = {
  id: string;
  name: string;
  handle: string; // username tanpa @ ATAU chat_id (string angka)
  note?: string;
  createdAt: number;
};

type Schedule = {
  enabled: boolean;
  tz: "Asia/Jakarta";
  freq: "daily" | "weekly" | "monthly";
  timeHHMM: string; // "09:00"
  weeklyDays: number[]; // 0-6 (Sun-Sat)
  monthlyDay: number; // 1-31
  startDate: string; // "YYYY-MM-DD"
};

type Config = {
  template: string;
  schedule: Schedule;
};

const LS_CONTACTS = "khf_tg_contacts_v1";
const LS_CONFIG = "khf_tg_config_v1";

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function normalizeHandle(raw: string): string {
  let x = raw.trim();
  if (!x) return "";
  x = x.replace(/\s+/g, "");
  if (x.startsWith("@")) x = x.slice(1);
  return x;
}

function isNumericId(x: string) {
  return /^-?\d+$/.test(x);
}

function applyTemplate(tpl: string, c: TgContact) {
  return tpl
    .replaceAll("{name}", c.name || "Nasabah")
    .replaceAll("{handle}", c.handle || "username/chat_id");
}

function formatIdDate(d: Date) {
  return d.toLocaleString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nextRuns(cfg: Schedule, count = 5): Date[] {
  const out: Date[] = [];
  if (!cfg.startDate) return out;

  const [hh, mm] = (cfg.timeHHMM || "09:00").split(":").map((n) => parseInt(n, 10));
  const start = new Date(cfg.startDate + "T00:00:00");
  start.setHours(hh || 9, mm || 0, 0, 0);

  let cursor = new Date(Math.max(start.getTime(), Date.now()));
  cursor.setSeconds(0, 0);

  const withTime = (d: Date) => {
    const x = new Date(d);
    x.setHours(hh || 9, mm || 0, 0, 0);
    return x;
  };
  const bumpDay = (d: Date, days: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  };

  while (out.length < count) {
    if (cfg.freq === "daily") {
      const candidate = withTime(cursor);
      if (candidate.getTime() < Date.now()) {
        cursor = bumpDay(cursor, 1);
        continue;
      }
      out.push(candidate);
      cursor = bumpDay(cursor, 1);
      continue;
    }

    if (cfg.freq === "weekly") {
      const days = cfg.weeklyDays?.length ? cfg.weeklyDays : [1];
      let found = false;
      for (let i = 0; i < 14; i++) {
        const d = withTime(bumpDay(cursor, i));
        if (d.getTime() < Date.now()) continue;
        if (days.includes(d.getDay())) {
          out.push(d);
          cursor = bumpDay(d, 1);
          found = true;
          break;
        }
      }
      if (!found) cursor = bumpDay(cursor, 7);
      continue;
    }

    // monthly
    const day = Math.min(Math.max(cfg.monthlyDay || 1, 1), 31);
    const d = new Date(cursor);
    d.setDate(1);
    d.setHours(hh || 9, mm || 0, 0, 0);

    const thisMonth = new Date(d);
    thisMonth.setDate(day);
    if (thisMonth.getDate() !== day) thisMonth.setDate(28);

    if (thisMonth.getTime() >= Date.now()) {
      out.push(thisMonth);
      cursor = new Date(thisMonth);
      cursor.setMonth(cursor.getMonth() + 1);
      cursor.setDate(1);
      continue;
    }

    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    next.setDate(day);
    if (next.getDate() !== day) next.setDate(28);

    out.push(next);
    cursor = new Date(next);
    cursor.setMonth(cursor.getMonth() + 1);
    cursor.setDate(1);
  }

  return out;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function TelegramReminder() {
  const steps = ["Kontak", "Pesan", "Jadwal", "Review"] as const;
  const [step, setStep] = useState<(typeof steps)[number]>("Kontak");

  const [contacts, setContacts] = useState<TgContact[]>([]);
  const [config, setConfig] = useState<Config>({
    template:
      "Halo {name}, ini pengingat dari KHF. Jika ada yang ingin dibantu, silakan reply ya. Terima kasih.",
    schedule: {
      enabled: false,
      tz: "Asia/Jakarta",
      freq: "daily",
      timeHHMM: "09:00",
      weeklyDays: [1, 3, 5],
      monthlyDay: 5,
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // add single
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [note, setNote] = useState("");

  // bulk
  const [bulk, setBulk] = useState("");
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  // toast mini
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1200);
  }

  useEffect(() => {
    try {
      const c = localStorage.getItem(LS_CONTACTS);
      const cfg = localStorage.getItem(LS_CONFIG);
      if (c) setContacts(JSON.parse(c));
      if (cfg) setConfig(JSON.parse(cfg));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_CONTACTS, JSON.stringify(contacts));
    } catch {}
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_CONFIG, JSON.stringify(config));
    } catch {}
  }, [config]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return contacts;
    return contacts.filter((c) => {
      const hay = `${c.name} ${c.handle} ${c.note ?? ""}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [contacts, q]);

  const selected = useMemo(() => {
    const id = selectedId ?? filtered[0]?.id ?? null;
    if (!id) return null;
    return contacts.find((c) => c.id === id) ?? null;
  }, [contacts, filtered, selectedId]);

  const previewText = useMemo(() => {
    const dummy: TgContact =
      selected ??
      ({
        id: "x",
        name: "Nasabah",
        handle: "username/chat_id",
        createdAt: Date.now(),
      } as TgContact);

    return applyTemplate(config.template, dummy);
  }, [config.template, selected]);

  const runs = useMemo(() => nextRuns(config.schedule, 5), [config.schedule]);

  function addContact() {
    const h = normalizeHandle(handle);
    if (!h) return;

    const exists = contacts.some((c) => c.handle.toLowerCase() === h.toLowerCase());
    if (exists) {
      showToast("Duplikat handle/chat_id (dilewati).");
      return;
    }

    const c: TgContact = {
      id: uid(),
      name: name.trim() || "Nasabah",
      handle: h,
      note: note.trim() || undefined,
      createdAt: Date.now(),
    };

    setContacts((prev) => [c, ...prev]);
    setSelectedId(c.id);
    setName("");
    setHandle("");
    setNote("");
  }

  function removeContact(id: string) {
    setContacts((prev) => prev.filter((x) => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function parseBulk() {
    const lines = bulk
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    if (!lines.length) {
      setBulkMsg("Tidak ada data untuk diimport.");
      return;
    }

    // format:
    // "Nama,@username"
    // "@username"
    // "Nama;12345678"
    const added: TgContact[] = [];

    for (const line of lines) {
      const parts = line.includes(",")
        ? line.split(",")
        : line.includes(";")
        ? line.split(";")
        : [line];

      let nm = "Nasabah";
      let hd = "";

      if (parts.length === 1) {
        hd = parts[0];
      } else {
        nm = (parts[0] ?? "Nasabah").trim() || "Nasabah";
        hd = (parts[1] ?? "").trim();
      }

      const h = normalizeHandle(hd);
      if (!h) continue;

      const exists = contacts.some((c) => c.handle.toLowerCase() === h.toLowerCase());
      if (exists) continue;

      added.push({
        id: uid(),
        name: nm,
        handle: h,
        createdAt: Date.now(),
      });
    }

    setContacts((prev) => [...added, ...prev]);
    setBulkMsg(`Import selesai: +${added.length} kontak (duplikat/invalid dilewati).`);
    setBulk("");
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ contacts, config }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "telegram-reminder-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openTelegramProfile(c: TgContact) {
    if (isNumericId(c.handle)) {
      showToast("Chat ID tidak bisa dibuka via link. Copy pesan lalu kirim via bot/back-end.");
      return;
    }
    window.open(`https://t.me/${c.handle}`, "_blank", "noopener,noreferrer");
  }

  async function copySelectedMessage() {
    const ok = await copyToClipboard(previewText);
    showToast(ok ? "Pesan di-copy." : "Gagal copy.");
  }

  return (
    <div className="w-full relative">
      {/* Toast mini */}
      {toast ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 text-white px-4 py-2 text-xs shadow-soft">
          {toast}
        </div>
      ) : null}

      {/* Top Stepper */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((s) => {
            const active = s === step;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-500 hover:text-slate-700 border border-slate-200",
                ].join(" ")}
              >
                {s}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <SmallButton onClick={exportJSON}>Export</SmallButton>
          <SmallButton
            onClick={() => {
              localStorage.removeItem(LS_CONTACTS);
              localStorage.removeItem(LS_CONFIG);
              location.reload();
            }}
          >
            Reset
          </SmallButton>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {step === "Kontak" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Kontak Telegram</p>
                  <p className="text-xs text-slate-500">Simpan @username atau chat_id.</p>
                </div>
                <div className="text-xs text-slate-500">
                  Total: <span className="font-semibold text-slate-700">{contacts.length}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} />
                <Input
                  placeholder="@username atau chat_id"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
                <Input
                  placeholder="Catatan (opsional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <PrimaryButton type="button" onClick={addContact} disabled={!handle.trim()}>
                  Tambah Kontak
                </PrimaryButton>
                <GhostButton type="button" onClick={() => setStep("Pesan")}>
                  Lanjut → Pesan
                </GhostButton>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-3">
                <p className="text-sm font-semibold text-slate-900">Import Cepat</p>
                <p className="text-xs text-slate-500">
                  Paste list: <span className="font-mono">Nama,@username</span> atau{" "}
                  <span className="font-mono">@username</span> per baris.
                </p>

                <Textarea
                  rows={5}
                  placeholder={`Contoh:\nBudi,@budi_aja\n@siti_khf\nAndi;123456789`}
                  value={bulk}
                  onChange={(e) => setBulk(e.target.value)}
                />

                <div className="flex items-center gap-2">
                  <SmallButton type="button" onClick={parseBulk}>
                    Import
                  </SmallButton>
                  {bulkMsg ? <p className="text-xs text-slate-500">{bulkMsg}</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          {step === "Pesan" ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Template Pesan</p>
                <p className="text-xs text-slate-500">
                  Placeholder: <span className="font-mono">{`{name}`}</span>,{" "}
                  <span className="font-mono">{`{handle}`}</span>
                </p>
              </div>

              <Textarea
                rows={7}
                value={config.template}
                onChange={(e) => setConfig((p) => ({ ...p, template: e.target.value }))}
                placeholder="Tulis pesan reminder..."
              />

              <div className="flex items-center gap-2">
                <GhostButton type="button" onClick={() => setStep("Kontak")}>
                  ← Kembali
                </GhostButton>
                <GhostButton type="button" onClick={() => setStep("Jadwal")}>
                  Lanjut → Jadwal
                </GhostButton>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs uppercase tracking-widest text-slate-400">Preview</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{previewText}</p>
              </div>
            </div>
          ) : null}

          {step === "Jadwal" ? (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">Jadwal Pengiriman</p>
                <p className="text-xs text-slate-500">
                  Otomatis kirim akan dihubungkan ke Telegram Bot API via backend.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <p className="text-xs text-slate-500 mb-2">Frekuensi</p>
                  <select
                    value={config.schedule.freq}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        schedule: { ...p.schedule, freq: e.target.value as any },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-slate-200"
                  >
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <p className="text-xs text-slate-500 mb-2">Jam (WIB)</p>
                  <Input
                    type="time"
                    value={config.schedule.timeHHMM}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        schedule: { ...p.schedule, timeHHMM: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="sm:col-span-1">
                  <p className="text-xs text-slate-500 mb-2">Mulai</p>
                  <Input
                    type="date"
                    value={config.schedule.startDate}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        schedule: { ...p.schedule, startDate: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              {config.schedule.freq === "weekly" ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Hari</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["Min", 0],
                      ["Sen", 1],
                      ["Sel", 2],
                      ["Rab", 3],
                      ["Kam", 4],
                      ["Jum", 5],
                      ["Sab", 6],
                    ].map(([label, val]) => {
                      const v = val as number;
                      const on = config.schedule.weeklyDays.includes(v);
                      return (
                        <button
                          key={String(val)}
                          type="button"
                          onClick={() => {
                            setConfig((p) => {
                              const cur = p.schedule.weeklyDays;
                              const next = on ? cur.filter((x) => x !== v) : [...cur, v];
                              return { ...p, schedule: { ...p.schedule, weeklyDays: next } };
                            });
                          }}
                          className={[
                            "rounded-full px-3 py-1.5 text-xs font-semibold border transition",
                            on
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {config.schedule.freq === "monthly" ? (
                <div className="max-w-xs">
                  <p className="text-xs text-slate-500 mb-2">Tanggal (1–31)</p>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={config.schedule.monthlyDay}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        schedule: {
                          ...p.schedule,
                          monthlyDay: parseInt(e.target.value || "1", 10),
                        },
                      }))
                    }
                  />
                </div>
              ) : null}

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs uppercase tracking-widest text-slate-400">Next Runs</p>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  {runs.map((d, i) => (
                    <div key={i}>{formatIdDate(d)}</div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <GhostButton type="button" onClick={() => setStep("Pesan")}>
                  ← Kembali
                </GhostButton>
                <GhostButton type="button" onClick={() => setStep("Review")}>
                  Lanjut → Review
                </GhostButton>
              </div>
            </div>
          ) : null}

          {step === "Review" ? (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">Review</p>
                <p className="text-xs text-slate-500">
                  UI siap. Otomasi akan dihubungkan ke bot backend.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Kontak</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{contacts.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Frekuensi</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{config.schedule.freq}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Jam</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{config.schedule.timeHHMM}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs uppercase tracking-widest text-slate-400">Preview Pesan</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{previewText}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <GhostButton type="button" onClick={() => setStep("Jadwal")}>
                  ← Kembali
                </GhostButton>

                <PrimaryButton
                  type="button"
                  disabled
                  title="Otomatis kirim Telegram perlu backend (Cloudflare Worker) + Bot Token."
                >
                  Activate Automation (Coming Soon)
                </PrimaryButton>

                <SmallButton type="button" onClick={copySelectedMessage}>
                  Copy Message
                </SmallButton>

                <SmallButton
                  type="button"
                  disabled={!selected || isNumericId(selected.handle)}
                  onClick={() => selected && openTelegramProfile(selected)}
                  title={
                    selected && isNumericId(selected.handle)
                      ? "Chat ID tidak bisa dibuka via link."
                      : "Buka profil Telegram (username)."
                  }
                >
                  Open Username
                </SmallButton>
              </div>
            </div>
          ) : null}
        </div>

        {/* RIGHT: list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Daftar Kontak</p>
            <div className="text-xs text-slate-500">{filtered.length} tampil</div>
          </div>

          <Input placeholder="Search nama/handle..." value={q} onChange={(e) => setQ(e.target.value)} />

          <div className="max-h-[520px] overflow-auto rounded-2xl border border-slate-200 bg-white">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">Belum ada kontak.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((c) => {
                  const active = selected?.id === c.id;
                  return (
                    <div key={c.id} className="p-3">
                      <button type="button" onClick={() => setSelectedId(c.id)} className="w-full text-left">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className={["text-sm font-semibold", active ? "text-slate-900" : "text-slate-800"].join(" ")}>
                              {c.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {isNumericId(c.handle) ? `chat_id: ${c.handle}` : `@${c.handle}`}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <SmallButton
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTelegramProfile(c);
                              }}
                              disabled={isNumericId(c.handle)}
                              title={isNumericId(c.handle) ? "Chat ID tidak bisa dibuka via link." : "Buka profil."}
                            >
                              Open
                            </SmallButton>

                            <SmallButton
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeContact(c.id);
                              }}
                            >
                              Hapus
                            </SmallButton>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">Quick Preview</p>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{previewText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
