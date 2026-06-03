import Link from "next/link";
import {
  ArrowRight,
  FileText,
  ShieldAlert,
  Gauge,
  Columns2,
  Sparkles,
  Check,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS } from "@/lib/plans";

const features = [
  {
    icon: Sparkles,
    title: "Plain-English Translation",
    desc: "Every confusing clause rewritten so anyone can understand exactly what they're agreeing to.",
  },
  {
    icon: Gauge,
    title: "Instant Risk Score",
    desc: "A 0–100 score from termination, liability, auto-renewal, arbitration, and hidden-fee signals.",
  },
  {
    icon: ShieldAlert,
    title: "Red Flags & Risks",
    desc: "We surface the traps — one-sided terms, surprise fees, and rights you'd be giving up.",
  },
  {
    icon: FileText,
    title: "Clause Detection",
    desc: "Non-compete, arbitration, confidentiality, indemnification, auto-renewal, and more — found automatically.",
  },
  {
    icon: Columns2,
    title: "Side-by-Side View",
    desc: "Original contract on the left, plain-English version on the right. Color-coded by risk.",
  },
  {
    icon: Check,
    title: "Deadlines & Obligations",
    desc: "Know what you must do, what the other party owes you, and every date that matters.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="#features" className="hidden px-3 text-sm text-muted-foreground hover:text-foreground sm:block">
              Features
            </Link>
            <Link href="#pricing" className="hidden px-3 text-sm text-muted-foreground hover:text-foreground sm:block">
              Pricing
            </Link>
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-powered legal clarity for everyone
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Understand Any Legal Document in{" "}
            <span className="text-primary">Plain English</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Upload a contract, lease, or employment agreement and instantly get a
            clear explanation, a risk score, deadlines, obligations, and the red
            flags you can't afford to miss.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Analyze your first document <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                See pricing
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free plan includes 3 analyses / month. No credit card required.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need to read the fine print</h2>
          <p className="mt-4 text-muted-foreground">
            MyLegalPrompt breaks documents down so you can decide with confidence.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="animate-fade-in">
              <CardContent className="pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-5xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Simple, honest pricing</h2>
          <p className="mt-4 text-muted-foreground">Start free. Upgrade when you need more.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {Object.values(PLANS).map((plan) => (
            <Card
              key={plan.id}
              className={plan.id === "PRO" ? "border-primary shadow-md" : ""}
            >
              <CardContent className="pt-6">
                {plan.id === "PRO" && (
                  <span className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.priceLabel}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-8 block">
                  <Button
                    className="w-full"
                    variant={plan.id === "PRO" ? "default" : "outline"}
                  >
                    {plan.id === "PRO" ? "Start Pro" : "Get started free"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <Logo />
          <p className="text-center text-xs text-muted-foreground">
            MyLegalPrompt provides informational summaries, not legal advice.
            Consult a licensed attorney for legal decisions.
          </p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MyLegalPrompt</p>
        </div>
      </footer>
    </div>
  );
}
