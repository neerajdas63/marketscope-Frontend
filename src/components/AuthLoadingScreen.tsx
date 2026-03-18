import { LoaderCircle } from "lucide-react";

export function AuthLoadingScreen({ title, description }: { title: string; description: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "radial-gradient(circle at top, rgba(34, 211, 238, 0.18), transparent 28%), linear-gradient(180deg, #020617 0%, #040b16 100%)",
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-950/75 px-8 py-10 text-center shadow-[0_24px_80px_rgba(8,47,73,0.45)] backdrop-blur">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
          <LoaderCircle className="animate-spin" size={28} />
        </div>
        <div className="mt-6 text-2xl font-semibold text-slate-50">{title}</div>
        <div className="mt-3 text-sm leading-6 text-slate-400">{description}</div>
      </div>
    </div>
  );
}