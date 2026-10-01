# OUSD Transparency — built by Solana

An open-source transparency dashboard for **Open USD (OUSD)** — circulating
supply, transfer volume, transaction counts, and active wallets across
**Solana, Ethereum, Base, and Tempo**.

Inspired by [ousd.fyi](https://ousd.fyi), the official OUSD transparency
site. This project is an independent, community-run alternative built and
maintained by Solana, sourcing its data from the public Dune dashboard
[zcabrams/open-usd-ousd](https://dune.com/zcabrams/open-usd-ousd) rather than
a private backend, so anyone can audit, fork, or self-host it.

**This is informational only — not an independent reserve attestation.**

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Recharts](https://recharts.org) for the stacked time-series charts
- [Dune API](https://docs.dune.com/api-reference) as the sole data source —
  one query (`8863473`) backs every chart on the dashboard

## Getting started

```bash
npm install
cp .env.example .env.local
# add your DUNE_API_KEY to .env.local (free tier: https://dune.com/settings/api)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without a `DUNE_API_KEY`, the app still runs — it falls back to a static
snapshot (clearly labeled in the UI) instead of live history, so the project
is usable and forkable without any credentials.

## How the data flows

`src/lib/dune.ts` fetches `https://api.dune.com/api/v1/query/8863473/results`,
normalizes the rows by date/chain, and derives the summary stats (AUM,
30-day volume, 30-day tx count, 30-day active wallets). Results are revalidated
hourly (`export const revalidate = 3600`).

The row/column names here are inferred from the public dashboard, since the
raw schema isn't published — `pickNumber` / `pickChain` / `pickDate` in
`src/lib/dune.ts` match on substrings (`aum`, `volume`, `tx`, `wallet`, `chain`,
`day`/`date`) rather than exact column names, so small schema drift upstream
shouldn't break the pipeline. If Dune changes the query entirely, update
`DUNE_QUERY_ID` and the matching logic in that file.

## Deploying your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/catgu5/ousd-transparency&env=DUNE_API_KEY&envDescription=Free%20API%20key%20from%20Dune&envLink=https://dune.com/settings/api)

Set `DUNE_API_KEY` in your deployment's environment variables.

## Contributing

Issues and PRs welcome. This is a small, intentionally simple codebase — one
data file (`src/lib/dune.ts`), one chart component, one page.

## License

[MIT](./LICENSE)
