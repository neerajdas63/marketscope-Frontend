import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, BarChart3, LockKeyhole, Orbit, ShieldCheck, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.2 2.9-7.2 0-.7-.1-1.4-.2-2H12Z" />
      <path fill="#34A853" d="M12 22c2.6 0 4.7-.8 6.3-2.3l-3.1-2.4c-.9.6-2 .9-3.2.9-2.4 0-4.5-1.6-5.2-3.9l-3.2 2.5C5 19.9 8.2 22 12 22Z" />
      <path fill="#4A90E2" d="M6.8 14.3c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.6 8C2.9 9.4 2.5 10.9 2.5 12.4s.4 3.1 1.1 4.4l3.2-2.5Z" />
      <path fill="#FBBC05" d="M12 6.6c1.4 0 2.7.5 3.7 1.5l2.8-2.8C16.7 3.7 14.6 2.8 12 2.8 8.2 2.8 5 4.9 3.6 8l3.2 2.5C7.5 8.2 9.6 6.6 12 6.6Z" />
    </svg>
  );
}

const featureCards = [
  {
    icon: Sparkles,
    title: "Signal-first workflow",
    body: "Curated scans, pulse intelligence, and structured trade context designed for faster decision cycles.",
  },
  {
    icon: BarChart3,
    title: "Built for active operators",
    body: "A premium research surface for users who need ranked opportunity flow instead of raw market noise.",
  },
  {
    icon: ShieldCheck,
    title: "Invitation-only access",
    body: "Google sign-in identifies your account today; backend membership enforcement slots cleanly into the next layer.",
  },
];

const deskHighlights = [
  "Momentum, breadth, and breakout workflows in one private workspace.",
  "Curated views aimed at power users, not casual dashboards.",
  "Authentication and approval flow structured for subscription-grade onboarding.",
];

const Landing = () => {
  const location = useLocation();
  const { configError, isConfigured, signInPending, signInWithGoogle } = useAuth();
  const [authError, setAuthError] = useState("");

  const accessError = useMemo(() => {
    if (location.state && typeof location.state === "object" && "accessError" in location.state) {
      return String(location.state.accessError || "");
    }

    return "";
  }, [location.state]);

  const handleContinue = async () => {
    setAuthError("");
    const result = await signInWithGoogle();

    if (result.error) {
      setAuthError(result.error);
    }
  };

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{
        background: "radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 32%), radial-gradient(circle at 85% 15%, rgba(245, 158, 11, 0.12), transparent 22%), linear-gradient(180deg, #020617 0%, #050b14 46%, #020617 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
        <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
          <div>
            <div className="text-lg font-semibold tracking-tight text-white">MarketScope</div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">Private Research Terminal</div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100 md:flex">
            <Orbit size={14} />
            Approved Access Only
          </div>
        </div>

        <div className="grid gap-10 pb-16 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-16">
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
              <BadgeCheck size={14} />
              Premium workflow for serious market operators
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-white md:text-6xl xl:text-7xl">
              Trade from a sharper first screen than a generic login page.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              MarketScope is a curated trading workspace for momentum, breadth, breakout, and sector intelligence. The experience is built to feel like a subscription product from the first click, with a controlled access layer ready for premium onboarding.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                type="button"
                size="lg"
                onClick={handleContinue}
                disabled={signInPending || !isConfigured}
                className="h-14 rounded-2xl bg-white px-7 text-base font-semibold text-slate-950 shadow-[0_18px_50px_rgba(255,255,255,0.14)] hover:bg-slate-100"
              >
                <GoogleMark />
                {signInPending ? "Connecting to Google..." : "Continue with Google"}
                <ArrowRight size={16} />
              </Button>

              <div className="max-w-sm text-sm leading-6 text-slate-400">
                Access is restricted to approved users only. Google sign-in identifies the account; entitlement validation will be enforced in the next backend layer.
              </div>
            </div>

            {accessError ? (
              <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {accessError}
              </div>
            ) : null}

            {configError || authError ? (
              <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {authError || configError}
              </div>
            ) : null}

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {featureCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-100">
                      <Icon size={18} />
                    </div>
                    <div className="mt-4 text-lg font-semibold text-white">{card.title}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-400">{card.body}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-cyan-400/20 via-transparent to-amber-300/10 blur-3xl" />
            <div className="relative rounded-[32px] border border-white/10 bg-slate-950/75 p-6 shadow-[0_24px_90px_rgba(2,8,23,0.6)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/75">Operator Preview</div>
                  <div className="mt-2 text-2xl font-semibold text-white">Institutional feel, retail speed</div>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                  Live Workflow
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-cyan-400/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.65),rgba(15,23,42,0.92))] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-300">Signal stack</div>
                    <div className="mt-1 text-3xl font-semibold text-white">Pulse, breadth, conviction</div>
                  </div>
                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3 text-cyan-100">
                    <LockKeyhole size={20} />
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {deskHighlights.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                      <div className="text-sm leading-6 text-slate-300">{item}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Positioning</div>
                  <div className="mt-3 text-xl font-semibold text-white">Premium</div>
                  <div className="mt-2 text-sm text-slate-400">Designed to sell like a private product, not a public utility.</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Audience</div>
                  <div className="mt-3 text-xl font-semibold text-white">Power users</div>
                  <div className="mt-2 text-sm text-slate-400">Built for users who expect ranked signal flow and fast triage.</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Onboarding</div>
                  <div className="mt-3 text-xl font-semibold text-white">Controlled</div>
                  <div className="mt-2 text-sm text-slate-400">Ready for backend access checks and subscription-grade gating.</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Landing;