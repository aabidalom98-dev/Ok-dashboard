import { useSalary } from './SalaryContext';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Award, Users, CreditCard, MinusCircle, Gift, Clock } from 'lucide-react';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function KPICard({ label, value, sub, icon: Icon, positive }: {
  label: string; value: string; sub: string; icon: React.ElementType; positive: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">{label}</span>
          </div>
          <span className={`flex items-center justify-center w-6 h-6 rounded-full ${positive ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
            <svg className={`w-3.5 h-3.5 ${positive ? 'text-emerald-500' : 'text-rose-500'}`} fill="none" viewBox="0 0 12 12">
              {positive
                ? <path d="M2 9L6 3L10 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                : <path d="M2 3L6 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              }
            </svg>
          </span>
        </div>
        <div className="text-[1.85rem] font-bold leading-none tracking-tight text-foreground mb-2">{value}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </motion.div>
  );
}

export function SalaryKPIs() {
  const { filteredData } = useSalary();
  if (!filteredData.length) return null;

  const total = filteredData.length;
  const totalGross = filteredData.reduce((s, r) => s + r.grossSalary, 0);
  const totalNet = filteredData.reduce((s, r) => s + r.netSalary, 0);
  const avgSalary = totalGross / total;
  const highest = Math.max(...filteredData.map(r => r.grossSalary));
  const totalDeductions = filteredData.reduce((s, r) => s + r.deductions, 0);
  const totalBonus = filteredData.reduce((s, r) => s + r.bonus + r.incentives, 0);
  const totalOTPay = filteredData.reduce((s, r) => s + r.overtimePay, 0);
  const pending = filteredData.filter(r => r.paymentStatus.toLowerCase().includes('pend')).length;

  const kpis = [
    { label: 'Total Payroll', value: fmt(totalGross), sub: 'Gross salary payout', icon: DollarSign, positive: true },
    { label: 'Net Payroll', value: fmt(totalNet), sub: 'After all deductions', icon: TrendingUp, positive: true },
    { label: 'Avg Salary', value: fmt(avgSalary), sub: 'Per employee', icon: Users, positive: true },
    { label: 'Highest Salary', value: fmt(highest), sub: 'Top earner', icon: Award, positive: true },
    { label: 'Pending Payments', value: pending.toString(), sub: 'Unpaid employees', icon: CreditCard, positive: pending === 0 },
    { label: 'Total Deductions', value: fmt(totalDeductions), sub: 'PF + ESI + Tax + others', icon: MinusCircle, positive: true },
    { label: 'Total Bonuses', value: fmt(totalBonus), sub: 'Bonus + incentives', icon: Gift, positive: true },
    { label: 'Overtime Pay', value: fmt(totalOTPay), sub: 'Total OT disbursed', icon: Clock, positive: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map(k => <KPICard key={k.label} {...k} />)}
    </div>
  );
}
