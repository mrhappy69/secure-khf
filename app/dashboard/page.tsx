"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthCookie, isAuthed } from "../../components/auth";
import { GhostButton } from "../../components/ui";
import WaReminder from "../../components/wa/WaReminder";
import TelegramReminder from "../../components/telegram/TelegramReminder";



type MenuKey = "tools" | "administrasi";
type SubItem = { key: string; name: string };

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const MENU: Record<MenuKey, { label: string; items: SubItem[] }> = useMemo(
    () => ({
      tools: {
        label: "Tools",
        items: [
          { key: "wa-reminder", name: "WA Reminder" },
          { key: "telegram-reminder", name: "Telegram Reminder" },
          { key: "email-reminder", name: "Email Reminder" },
        ],
      },
      administrasi: {
        label: "Administrasi",
        items: [
          { key: "data-klaim", name: "Data Klaim" },
          { key: "data-spa", name: "Data SPA" },
        ],
      },
    }),
    []
  );

  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [activeMenu, setActiveMenu] = useState<MenuKey>("tools");
  const [activeItem, setActiveItem] = useState<SubItem>(MENU.tools.items[0]);

  const navRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAuthed()) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  // close dropdown on outside click + ESC
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function logout() {
    clearAuthCookie();
    router.push("/");
  }

  function pick(menu: MenuKey, item: SubItem) {
    setActiveMenu(menu);
    setActiveItem(item);
    setOpenMenu(null);
  }

  // BENAR-BENAR KOSONG (siap kita isi per menu nanti)
function renderContent() {
  switch (activeItem.key) {
    case "wa-reminder":
      return <WaReminder />; // kalau sudah ada
    case "telegram-reminder":
      return <TelegramReminder />;
    default:
      return null;
  }
}


  if (!ready) {
    return (
      <main className="min-h-screen grid place-items-center bg-white">
        <div className="text-sm text-slate-500">Mengecek akses...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* LEFT: DASHBOARD + MENU horizontal */}
          <div className="space-y-2">
            <div ref={navRef} className="flex items-center gap-6">
              <p className="text-xs uppercase tracking-widest text-slate-400">dashboard</p>

              <nav className="flex items-center gap-6">
                {/* Tools */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenu((v) => (v === "tools" ? null : "tools"))}
                    className={[
                      "text-xs uppercase tracking-widest transition",
                      openMenu === "tools" || activeMenu === "tools"
                        ? "text-slate-900"
                        : "text-slate-400 hover:text-slate-700",
                      "focus:outline-none",
                    ].join(" ")}
                  >
                    Tools <span className="ml-1 text-[10px]">{openMenu === "tools" ? "▴" : "▾"}</span>
                  </button>

                  {openMenu === "tools" ? (
                    <div className="absolute left-0 z-20 mt-3 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
                      {MENU.tools.items.map((it) => {
                        const selected = activeMenu === "tools" && activeItem.key === it.key;
                        return (
                          <button
                            key={it.key}
                            type="button"
                            onClick={() => pick("tools", it)}
                            className={[
                              "w-full text-left px-4 py-3 text-sm transition",
                              selected ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            {it.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {/* Administrasi */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenu((v) => (v === "administrasi" ? null : "administrasi"))
                    }
                    className={[
                      "text-xs uppercase tracking-widest transition",
                      openMenu === "administrasi" || activeMenu === "administrasi"
                        ? "text-slate-900"
                        : "text-slate-400 hover:text-slate-700",
                      "focus:outline-none",
                    ].join(" ")}
                  >
                    Administrasi{" "}
                    <span className="ml-1 text-[10px]">
                      {openMenu === "administrasi" ? "▴" : "▾"}
                    </span>
                  </button>

                  {openMenu === "administrasi" ? (
                    <div className="absolute left-0 z-20 mt-3 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
                      {MENU.administrasi.items.map((it) => {
                        const selected = activeMenu === "administrasi" && activeItem.key === it.key;
                        return (
                          <button
                            key={it.key}
                            type="button"
                            onClick={() => pick("administrasi", it)}
                            className={[
                              "w-full text-left px-4 py-3 text-sm transition",
                              selected ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            {it.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </nav>
            </div>

            {/* optional: indikator kecil aktif (super subtle) */}
            <p className="text-xs text-slate-400">
              {MENU[activeMenu].label} / {activeItem.name}
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <GhostButton onClick={logout}>Logout</GhostButton>
          </div>
        </header>

        {/* CONTENT: benar-benar kosong & menyatu background */}
        <section className="mt-10 min-h-[560px]">{renderContent()}</section>
      </div>
    </main>
  );
}
