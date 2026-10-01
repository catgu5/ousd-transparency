export function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="text-xs uppercase tracking-wider text-white/50">{label}</div>
      <div className="mt-2 bg-gradient-to-r from-[#14F195] to-[#9945FF] bg-clip-text text-3xl font-semibold text-transparent sm:text-4xl">
        {value}
      </div>
      {sublabel && <div className="mt-1 text-sm text-white/40">{sublabel}</div>}
    </div>
  );
}
