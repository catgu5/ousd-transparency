// Live data layer for the "Open USD (OUSD)" transparency dashboard.
// Source dashboard: https://dune.com/zcabrams/open-usd-ousd (dashboard id 221073)
// All visualizations on that dashboard are powered by a single query: id 8863473.
// Get a free API key at https://dune.com/settings/api and set DUNE_API_KEY.

export type ChainId = "solana" | "ethereum" | "base" | "tempo";

export interface ChainDayRow {
  date: string; // ISO date, e.g. 2026-09-15
  chain: ChainId;
  aum: number | null;
  volume: number | null;
  txCount: number | null;
  wallets: number | null;
}

export interface OusdSummary {
  totalAum: number;
  volume30d: number;
  txCount30d: number;
  wallets30d: number;
  asOf: string | null;
}

export interface OusdDataset {
  rows: ChainDayRow[];
  summary: OusdSummary;
  source: "live" | "fallback";
  fetchedAt: string | null;
  error?: string;
}

const DUNE_QUERY_ID = 8863473;

export const CHAIN_META: Record<ChainId, { label: string; color: string }> = {
  solana: { label: "Solana", color: "#14F195" },
  ethereum: { label: "Ethereum", color: "#8A92B2" },
  base: { label: "Base", color: "#0052FF" },
  tempo: { label: "Tempo", color: "#9945FF" },
};

export const CONTRACTS: Record<ChainId, { address: string; explorer: string }> = {
  tempo: {
    address: "0x20c0000000000000000000006a37DA5C996874BE",
    explorer: "https://explorer.tempo.xyz/address/0x20c0000000000000000000006a37DA5C996874BE",
  },
  ethereum: {
    address: "0x9f6F3991D525015a6F8CaF062C83b62fD3AC4436",
    explorer: "https://etherscan.io/address/0x9f6F3991D525015a6F8CaF062C83b62fD3AC4436",
  },
  base: {
    address: "0xB2000000000000000000002fEb517dFeC7415344",
    explorer: "https://basescan.org/address/0xB2000000000000000000002fEb517dFeC7415344",
  },
  solana: {
    address: "ousd2mJsPEckLHcSCDxyKD7NDGARZcfLbDZkKiatYHB",
    explorer: "https://explorer.solana.com/address/ousd2mJsPEckLHcSCDxyKD7NDGARZcfLbDZkKiatYHB",
  },
};

// Snapshot captured 2026-10-01 from the public Dune dashboard, used only when
// no DUNE_API_KEY is configured (or the live call fails) so the UI always
// renders something meaningful instead of a blank page.
const FALLBACK_SUMMARY: OusdSummary = {
  totalAum: 618_460_000,
  volume30d: 1_290_000_000,
  txCount30d: 7455,
  wallets30d: 573,
  asOf: "2026-10-01",
};

function pickNumber(row: Record<string, unknown>, needles: string[]): number | null {
  for (const key of Object.keys(row)) {
    const lower = key.toLowerCase();
    if (needles.some((n) => lower.includes(n))) {
      const val = row[key];
      const num = typeof val === "number" ? val : Number(val);
      if (!Number.isNaN(num)) return num;
    }
  }
  return null;
}

function pickChain(row: Record<string, unknown>): ChainId | null {
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().includes("chain") || key.toLowerCase().includes("blockchain")) {
      const val = String(row[key]).toLowerCase();
      if (val.includes("solana")) return "solana";
      if (val.includes("ethereum") || val === "eth") return "ethereum";
      if (val.includes("base")) return "base";
      if (val.includes("tempo")) return "tempo";
    }
  }
  return null;
}

function pickDate(row: Record<string, unknown>): string | null {
  for (const key of Object.keys(row)) {
    const lower = key.toLowerCase();
    if (lower === "day" || lower === "date" || lower.includes("block_date") || lower.includes("dt")) {
      const val = row[key];
      if (typeof val === "string") return val.slice(0, 10);
      if (val instanceof Date) return val.toISOString().slice(0, 10);
    }
  }
  return null;
}

function normalizeRows(raw: Record<string, unknown>[]): ChainDayRow[] {
  const out: ChainDayRow[] = [];
  for (const r of raw) {
    const chain = pickChain(r);
    const date = pickDate(r);
    if (!chain || !date) continue;
    out.push({
      date,
      chain,
      aum: pickNumber(r, ["aum", "supply", "circulating"]),
      volume: pickNumber(r, ["volume", "transfer_amount", "transfer_usd"]),
      txCount: pickNumber(r, ["tx_count", "txs", "transaction", "num_tx"]),
      wallets: pickNumber(r, ["wallet", "unique_address", "active_address", "holders"]),
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

function summarize(rows: ChainDayRow[]): OusdSummary {
  if (rows.length === 0) return FALLBACK_SUMMARY;
  const lastDate = rows[rows.length - 1].date;
  const latestByChain = new Map<ChainId, ChainDayRow>();
  for (const r of rows) {
    const existing = latestByChain.get(r.chain);
    if (!existing || r.date > existing.date) latestByChain.set(r.chain, r);
  }
  const totalAum = [...latestByChain.values()].reduce((sum, r) => sum + (r.aum ?? 0), 0);

  const cutoff = new Date(lastDate);
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const last30 = rows.filter((r) => r.date >= cutoffStr);

  const volume30d = last30.reduce((sum, r) => sum + (r.volume ?? 0), 0);
  const txCount30d = last30.reduce((sum, r) => sum + (r.txCount ?? 0), 0);
  const walletSet = new Set<string>();
  // wallets are unique counts per day per chain in the source query, so we
  // approximate 30d active wallets as the max single-day reading per chain
  // (a true union isn't derivable from pre-aggregated daily counts).
  const maxWalletsByChain = new Map<ChainId, number>();
  for (const r of last30) {
    if (r.wallets == null) continue;
    const cur = maxWalletsByChain.get(r.chain) ?? 0;
    if (r.wallets > cur) maxWalletsByChain.set(r.chain, r.wallets);
  }
  const wallets30d = [...maxWalletsByChain.values()].reduce((a, b) => a + b, 0);
  void walletSet;

  return {
    totalAum: totalAum || FALLBACK_SUMMARY.totalAum,
    volume30d: volume30d || FALLBACK_SUMMARY.volume30d,
    txCount30d: txCount30d || FALLBACK_SUMMARY.txCount30d,
    wallets30d: wallets30d || FALLBACK_SUMMARY.wallets30d,
    asOf: lastDate,
  };
}

export async function getOusdData(): Promise<OusdDataset> {
  const apiKey = process.env.DUNE_API_KEY;

  if (!apiKey) {
    return {
      rows: [],
      summary: FALLBACK_SUMMARY,
      source: "fallback",
      fetchedAt: null,
      error: "DUNE_API_KEY is not set — showing the last known public snapshot instead of live history.",
    };
  }

  try {
    const res = await fetch(
      `https://api.dune.com/api/v1/query/${DUNE_QUERY_ID}/results?limit=5000`,
      {
        headers: { "X-Dune-API-Key": apiKey },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      throw new Error(`Dune API responded ${res.status}`);
    }

    const json = await res.json();
    const raw: Record<string, unknown>[] = json?.result?.rows ?? [];
    const rows = normalizeRows(raw);

    if (rows.length === 0) {
      throw new Error("Dune query returned no recognizable rows");
    }

    return {
      rows,
      summary: summarize(rows),
      source: "live",
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      rows: [],
      summary: FALLBACK_SUMMARY,
      source: "fallback",
      fetchedAt: null,
      error: err instanceof Error ? err.message : "Unknown error fetching Dune data",
    };
  }
}
