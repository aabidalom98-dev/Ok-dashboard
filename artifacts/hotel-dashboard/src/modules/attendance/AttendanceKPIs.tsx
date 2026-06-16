import { useAttendance } from './AttendanceContext';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Clock, TrendingUp, AlertTriangle, Building2, Calendar } from 'lucide-react';

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

export function AttendanceKPIs() {
  const { filteredData } = useAttendance();
  if (!filteredData.length) return null;

  const total = filteredData.length;
  const avgPct = filteredData.reduce((s, r) => s + r.attendancePct, 0) / total;
  const avgPresent = filteredData.reduce((s, r) => s + r.presentDays, 0) / total;
  const avgAbsent = filteredData.reduce((s, r) => s + r.absentDays, 0) / total;
  const totalOT = filteredData.reduce((s, r) => s + r.overtime, 0);
  const totalLate = filteredData.reduce((s, r) => s + r.lateArrivals, 0);
  const depts = new Set(filteredData.map(r => r.department).filter(Boolean)).size;
  const absenteeRate = (avgAbsent / (avgPresent + avgAbsent || 1)) * 100;

  const kpis = [
    { label: 'Total Employees', value: total.toLocaleString(), sub: 'In current view', icon: Users, positive: true },
    { label: 'Avg Attendance', value: `${avgPct.toFixed(1)}%`, sub: 'Present rate', icon: UserCheck, positive: avgPct >= 85 },
    { label: 'Absentee Rate', value: `${absenteeRate.toFixed(1)}%`, sub: 'Avg absent ratio', icon: UserX, positive: absenteeRate < 10 },
    { label: 'Avg Present Days', value: avgPresent.toFixed(1), sub: 'Days per employee', icon: Calendar, positive: avgPresent >= 22 },
    { label: 'Total Overtime', value: totalOT.toFixed(0) + ' hrs', sub: 'All employees', icon: Clock, positive: true },
    { label: 'Late Arrivals', value: totalLate.toLocaleString(), sub: 'Total instances', icon: AlertTriangle, positive: totalLate === 0 },
    { label: 'Departments', value: depts.toString(), sub: 'Active units', icon: Building2, positive: true },
    { label: 'Avg Leave Days', value: (filteredData.reduce((s, r) => s + r.leaveCount, 0) / total).toFixed(1), sub: 'Per employee', icon: TrendingUp, positive: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((k, i) => <KPICard key={k.label} {...k} />)}
    </div>
  );
}
