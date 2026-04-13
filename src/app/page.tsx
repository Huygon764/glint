import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SparkleGlyph } from "@/components/ui/EmptyState";
import { InitialAvatar } from "@/components/ui/InitialAvatar";
import { getCreatorsStore } from "@/lib/creators";

const STEPS = [
  {
    n: "01",
    title: "Claim your handle",
    body: "Pick a username, connect Freighter, and get a public tipping link in under a minute.",
  },
  {
    n: "02",
    title: "Share your link",
    body: "glint.app/yourname goes in your bio, newsletter, Twitch panel — anywhere you're read.",
  },
  {
    n: "03",
    title: "Get tipped instantly",
    body: "USDC lands in your wallet in ~5 seconds. Every tip is recorded on Stellar for life.",
  },
];

const STATS = [
  { big: "~5s", label: "Average settlement time" },
  { big: "0%", label: "Platform fee — tips go 1:1" },
  { big: "On-chain", label: "Every tip provably recorded" },
];

export default async function Home() {
  const { creators } = await getCreatorsStore().list({ limit: 6, offset: 0 });

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-start">
            <div className="space-y-8">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
                Tip creators in{" "}
                <span className="text-[var(--color-accent)]">USDC</span>.
                <br />
                On-chain. Zero fees.
              </h1>
              <p className="text-lg text-[var(--color-ink-soft)] max-w-xl leading-relaxed">
                The Internet's thank-you note, settled on Stellar in five
                seconds via the x402 payment protocol. Every tip permanently
                etched into the ledger — no middlemen, no chargebacks.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/create">
                  <Button variant="primary" size="lg">
                    Create your profile
                  </Button>
                </Link>
                <Link href="/browse">
                  <Button variant="secondary" size="lg">
                    Browse creators
                  </Button>
                </Link>
              </div>
            </div>

            <MockTipReceipt />
          </div>
        </section>

        {/* Stat strip */}
        <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]/60">
          <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:divide-x divide-[var(--color-border)]">
            {STATS.map((s) => (
              <div key={s.label} className="sm:px-8 first:sm:pl-0">
                <div className="font-display text-4xl text-[var(--color-ink)]">
                  {s.big}
                </div>
                <div className="text-sm text-[var(--color-ink-soft)] mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-12 max-w-2xl">
            <h2 className="font-display text-4xl leading-tight mb-3">
              Simplifying digital support
            </h2>
            <p className="text-[var(--color-ink-soft)]">
              Three steps between you and your first on-chain tip. No onboarding
              funnel, no KYC, no "premium tier."
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.n} className="space-y-3">
                <div className="font-display text-3xl text-[var(--color-accent)]">
                  {step.n}
                </div>
                <h3 className="font-display text-xl">{step.title}</h3>
                <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured creators */}
        {creators.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 pb-24">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-display text-3xl">Some folks on glint</h2>
              <Link
                href="/browse"
                className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
              >
                Browse all →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {creators.slice(0, 6).map((c) => (
                <Link key={c.slug} href={`/${c.slug}`} className="block">
                  <Card className="hover:border-[var(--color-border-strong)] transition-colors h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <InitialAvatar name={c.displayName} />
                      <div className="min-w-0">
                        <div className="font-display text-lg truncate">
                          {c.displayName}
                        </div>
                        <div className="text-xs font-mono text-[var(--color-ink-muted)] truncate">
                          @{c.slug}
                        </div>
                      </div>
                    </div>
                    {c.bio && (
                      <p className="text-sm text-[var(--color-ink-soft)] line-clamp-2">
                        {c.bio}
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/60">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[var(--color-accent)]">
                <SparkleGlyph size={18} />
              </span>
              <span className="font-display text-2xl">glint</span>
            </div>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Built for the Stellar hackathon 2026 · USDC on Stellar Testnet ·
              x402 payment protocol
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

/**
 * Decorative hero prop — a mock tip receipt card that hints at the product.
 * Purely static; not wired to any data.
 */
function MockTipReceipt() {
  return (
    <div className="hidden lg:block relative">
      <div className="absolute -top-4 -left-4 w-full h-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-lg" />
      <Card className="relative" padding="lg">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[var(--color-accent)]">
            <SparkleGlyph size={14} />
          </span>
          <span className="font-mono text-xs text-[var(--color-ink-muted)]">
            tip receipt · stellar:testnet
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
              From
            </div>
            <div className="font-mono text-sm">GBKR...7FQP</div>
          </div>

          <div>
            <div className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
              Amount
            </div>
            <div className="font-display text-4xl">
              +$1.00{" "}
              <span className="text-[var(--color-ink-muted)] text-2xl">
                USDC
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)]">
            <div className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
              Note
            </div>
            <p className="text-sm italic text-[var(--color-ink)]">
              "Loved your piece on Stellar contracts. Keep it coming."
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
          <span>settled in 4.8s</span>
          <span className="font-mono">ledger #2847361</span>
        </div>
      </Card>
    </div>
  );
}
