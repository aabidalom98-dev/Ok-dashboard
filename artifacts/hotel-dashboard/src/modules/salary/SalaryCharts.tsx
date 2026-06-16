import { useMemo } from 'react';
import { useSalary } from './SalaryContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const COLORS = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#06b6d4','#f97316','#84cc16'];
const TT_STYLE = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, color: 'hsl(var(--foreground))' };
const fmt = (n: number) => '$' + (n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toFixed(0));

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

export function SalaryCharts() {
  const { filteredData } = useSalary();
  if (!filteredData.length) return null;

  const deptData = useMemo(() => {
    const map = new Map<string, { gross: number; net: number; count: number }>();
    for (const r of filteredData) {
      const d = r.department || 'Unknown';
      const prev = map.get(d) || { gross: 0, net: 0, count: 0 };
      map.set(d, { gross: prev.gross + r.grossSalary, net: prev.net + r.netSalary, count: prev.count + 1 });
    }
    return [...map.entries()]
      .map(([dept, v]) => ({ dept: dept.length > 12 ? dept.slice(0,12)+'…' : dept, gross: Math.round(v.gross), net: Math.round(v.net) }))
      .sort((a, b) => b.gross - a.gross).slice(0, 10);
  }, [filteredData]);

  const monthData = useMemo(() => {
    const map = new Map<string, { gross: number; net: number }>();
    for (const r of filteredData) {
      const m = r.payrollMonth || 'N/A';
      const prev = map.get(m) || { gross: 0, net: 0 };
      map.set(m, { gross: prev.gross + r.grossSalary, net: prev.net + r.netSalary });
    }
    return [...map.entries()].map(([month, v]) => ({ month, gross: Math.round(v.gross), net: Math.round(v.net) }));
  }, [filteredData]);

  const deductionBreakdown = useMemo(() => [
    { name: 'PF', value: Math.round(filteredData.reduce((s, r) => s + r.pf, 0)) },
    { name: 'ESI', value: Math.round(filteredData.reduce((s, r) => s + r.esi, 0)) },
    { name: 'Tax/TDS', value: Math.round(filteredData.reduce((s, r) => s + r.tax, 0)) },
    { name: 'Other', value: Math.round(filteredData.reduce((s, r) => s + Math.max(0, r.deductions - r.pf - r.esi - r.tax), 0)) },
  ].filter(d => d.value > 0), [filteredData]);

  const payStatusPie = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredData) {
      const s = r.paymentStatus || 'Unknown';
      map.set(s, (map.get(s) || 0) + 1);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const salaryDistribution = useMemo(() => {
    const buckets = [
      { label: '<20K', min: 0, max: 20000 },
      { label: '20-40K', min: 20000, max: 40000 },
      { label: '40-60K', min: 40000, max: 60000 },
      { label: '60-80K', min: 60000, max: 80000 },
      { label: '80-100K', min: 80000, max: 100000 },
      { label: '>100K', min: 100000, max: Infinity },
    ];
    return buckets.map(b => ({
      range: b.label,
      count: filteredData.filter(r => r.grossSalary >= b.min && r.grossSalary < b.max).length,
    })).filter(d => d.count > 0);
  }, [filteredData]);

  const topEarners = useMemo(() =>
    [...filteredData].sort((a, b) => b.netSalary - a.netSalary).slice(0, 8)
      .map(r => ({ name: r.employeeName.split(' ')[0] || 'Emp', net: r.netSalary })),
    [filteredData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Department Payroll Comparison">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={deptData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="dept" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [fmt(v)]} />
            <Legend />
            <Bar dataKey="gross" name="Gross" fill="#f59e0b" radius={[4,4,0,0]} />
            <Bar dataKey="net" name="Net" fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Payroll Trend by Month">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [fmt(v)]} />
            <Legend />
            <Line type="monotone" dataKey="gross" name="Gross" stroke="#f59e0b" strokeWidth={2} />
            <Line type="monotone" dataKey="net" name="Net" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Deduction Breakdown">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={deductionBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
              {deductionBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [fmt(v)]} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Salary Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={salaryDistribution} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={TT_STYLE} />
            <Bar dataKey="count" name="Employees" fill="#10b981" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Top Earners (Net Salary)">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topEarners} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [fmt(v), 'Net Salary']} />
            <Bar dataKey="net" fill="#f59e0b" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Payment Status">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={payStatusPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
              {payStatusPie.map((_, i) => <Cell key={i} fill={['#10b981','#ef4444','#f59e0b','#3b82f6'][i % 4]} />)}
            </Pie>
            <Tooltip contentStyle={TT_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
