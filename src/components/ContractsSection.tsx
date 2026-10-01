import { CHAIN_META, CONTRACTS, ChainId } from "@/lib/dune";

const CHAIN_ORDER: ChainId[] = ["solana", "ethereum", "base", "tempo"];

function truncate(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

export function ContractsSection() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-sm font-medium text-white/70">Contract addresses</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CHAIN_ORDER.map((chain) => {
          const meta = CHAIN_META[chain];
          const contract = CONTRACTS[chain];
          return (
            <a
              key={chain}
              href={contract.explorer}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-sm transition hover:border-white/20"
            >
              <span className="flex items-center gap-2 text-white/80">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.label}
              </span>
              <span className="font-mono text-xs text-white/40">
                {truncate(contract.address)}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
