type DashboardStatProps = {
  label: string;
  value: string;
  hint: string;
};

export function DashboardStat({ label, value, hint }: DashboardStatProps) {
  return (
    <div className="min-w-0 rounded-[28px] border border-white/10 bg-white/8 p-6 text-cream shadow-soft">
      <p className="text-xs uppercase tracking-[0.22em] text-cream/60">{label}</p>
      <h3 className="mt-4 break-words text-[clamp(1.9rem,3vw,2.5rem)] font-semibold leading-tight">{value}</h3>
      <p className="mt-3 text-sm leading-6 text-cream/70">{hint}</p>
    </div>
  );
}
