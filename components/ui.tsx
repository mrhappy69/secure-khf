import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-soft">
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-7 pt-7 pb-5 border-b border-slate-100">
      <div>
        <h1 className="text-lg font-semibold leading-tight">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}


export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="px-7 py-6">{children}</div>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm",
        "placeholder:text-slate-400",
        "focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-300",
        props.className ?? ""
      ].join(" ")}
    />
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white",
        "hover:bg-slate-800 active:bg-slate-950 transition",
        "focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:opacity-60 disabled:cursor-not-allowed",
        props.className ?? ""
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700",
        "hover:bg-slate-50 active:bg-slate-100 transition",
        "focus:outline-none focus:ring-4 focus:ring-slate-200",
        props.className ?? ""
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
      {children}
    </span>
  );
}

export function Divider() {
  return <div className="my-5 h-px w-full bg-slate-100" />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm",
        "placeholder:text-slate-400",
        "focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-300",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function SmallButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700",
        "hover:bg-slate-50 active:bg-slate-100 transition",
        "focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-60 disabled:cursor-not-allowed",
        props.className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
