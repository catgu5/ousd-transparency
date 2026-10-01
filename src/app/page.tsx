import { getOusdData } from "@/lib/dune";
import { formatCompactNumber, formatCompactUsd } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { StackedChainChart } from "@/components/StackedChainChart";
import { ContractsSection } from "@/components/ContractsSection";

export const revalidate = 3600;

export default async function Home() {
  const data = await getOusdData();
  const { summary, rows } = data;

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/40">
              <span className="h-1.5 w-1.5 rounded-full bg-[#14F195]" />
              Built by Solana · Open source
            </div>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              OUSD Transparency
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/50">
              Community-run dashboard tracking Open USD (OUSD) circulating
              supply, transfer volume, transactions, and active wallets across
              Solana, Ethereum, Base, and Tempo. Data sourced from the public{" "}
              <a
                href="https://dune.com/zcabrams/open-usd-ousd"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/30 underline-offset-2 hover:text-white"
              >
                Dune dashboard
              </a>{" "}
              by zcabrams.
            </p>
          </div>
          <a
            href="https://github.com/solana-foundation/ousd-transparency"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white"
          >
            View source ↗
          </a>
        </header>

        <section className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total AUM" value={formatCompactUsd(summary.totalAum)} sublabel="circulating supply, all chains" />
          <StatCard label="30D transfer volume" value={formatCompactUsd(summary.volume30d)} sublabel="wallet-to-wallet" />
          <StatCard label="30D transactions" value={formatCompactNumber(summary.txCount30d)} sublabel="mints, burns, transfers" />
          <StatCard label="30D active wallets" value={formatCompactNumber(summary.wallets30d)} sublabel="unique non-zero addresses" />
        </section>

        {data.source === "fallback" && (
          <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-200/80">
            Showing a static snapshot (as of {summary.asOf ?? "last known update"}).
            Set <code className="rounded bg-black/30 px-1 py-0.5">DUNE_API_KEY</code> to
            enable live history.
            {data.error ? ` (${data.error})` : ""}
          </div>
        )}

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <StackedChainChart rows={rows} metric="aum" title="Daily AUM by chain" isCurrency />
          <StackedChainChart rows={rows} metric="volume" title="Daily transfer volume by chain" isCurrency />
          <StackedChainChart rows={rows} metric="txCount" title="Daily transaction count by chain" isCurrency={false} />
          <StackedChainChart rows={rows} metric="wallets" title="Daily active wallets by chain" isCurrency={false} />
        </section>

        <section className="mt-6">
          <ContractsSection />
        </section>

        <footer className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Informational only — not an independent reserve attestation.
            {data.fetchedAt ? ` Last refreshed ${new Date(data.fetchedAt).toLocaleString("en-US")}.` : ""}
          </p>
          <p>
            Built by the Solana community · data via{" "}
            <a
              href="https://dune.com/zcabrams/open-usd-ousd"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-white/20 underline-offset-2 hover:text-white"
            >
              Dune
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
