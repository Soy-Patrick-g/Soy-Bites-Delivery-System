type DashboardStatProps = {
  label: string;
  value: string;
  hint: string;
};

export function DashboardStat({ label, value, hint }: DashboardStatProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/8 p-6 text-cream shadow-soft">
      <p className="text-xs uppercase tracking-[0.22em] text-cream/60">{label}</p>
      <h3 className="mt-4 text-4xl font-semibold">{value}</h3>
      <p className="mt-3 text-sm text-cream/70">{hint}</p>
    </div>
  );
}
