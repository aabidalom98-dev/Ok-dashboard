import { useMemo } from 'react';
import { useAttendance } from './AttendanceContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

const COLORS = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#06b6d4','#f97316','#84cc16'];
const TT_STYLE = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, color: 'hsl(var(--foreground))' };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

export function AttendanceCharts() {
  const { filteredData } = useAttendance();
  if (!filteredData.length) return null;

  const deptData = useMemo(() => {
    const map = new Map<string, { total: number; count: number; ot: number }>();
    for (const r of filteredData) {
      const d = r.department || 'Unknown';
      const prev = map.get(d) || { total: 0, count: 0, ot: 0 };
      map.set(d, { total: prev.total + r.attendancePct, count: prev.count + 1, ot: prev.ot + r.overtime });
    }
    return [...map.entries()].map(([dept, v]) => ({
      dept: dept.length > 12 ? dept.slice(0, 12) + '…' : dept,
      avgAttendance: Math.round(v.total / v.count),
      totalOT: Math.round(v.ot),
    })).sort((a, b) => b.avgAttendance - a.avgAttendance).slice(0, 10);
  }, [filteredData]);

  const monthData = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const r of filteredData) {
      const m = r.month || 'Unknown';
      const prev = map.get(m) || { total: 0, count: 0 };
      map.set(m, { total: prev.total + r.attendancePct, count: prev.count + 1 });
    }
    return [...map.entries()].map(([month, v]) => ({
      month, avgAttendance: Math.round(v.total / v.count),
    }));
  }, [filteredData]);

  const statusPie = useMemo(() => {
    const good = filteredData.filter(r => r.attendancePct >= 90).length;
    const avg = filteredData.filter(r => r.attendancePct >= 75 && r.attendancePct < 90).length;
    const poor = filteredData.filter(r => r.attendancePct < 75).length;
    return [
      { name: 'Good (≥90%)', value: good },
      { name: 'Average (75-90%)', value: avg },
      { name: 'Poor (<75%)', value: poor },
    ].filter(d => d.value > 0);
  }, [filteredData]);

  const shiftData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredData) {
      const s = r.shift || 'Unassigned';
      map.set(s, (map.get(s) || 0) + 1);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const topEmployees = useMemo(() =>
    [...filteredData]
      .sort((a, b) => b.attendancePct - a.attendancePct)
      .slice(0, 8)
      .map(r => ({ name: r.employeeName.split(' ')[0] || r.employeeId, attendance: r.attendancePct })),
    [filteredData]);

  const otTopEmployees = useMemo(() =>
    [...filteredData]
      .filter(r => r.overtime > 0)
      .sort((a, b) => b.overtime - a.overtime)
      .slice(0, 8)
      .map(r => ({ name: r.employeeName.split(' ')[0] || r.employeeId, ot: r.overtime })),
    [filteredData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Department Attendance Comparison">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={deptData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="dept" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [`${v}%`, 'Avg Attendance']} />
            <Bar dataKey="avgAttendance" fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Attendance Status Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={statusPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
              {statusPie.map((_, i) => <Cell key={i} fill={['#10b981','#f59e0b','#ef4444'][i]} />)}
            </Pie>
            <Tooltip contentStyle={TT_STYLE} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Monthly Attendance Trend">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [`${v}%`, 'Avg Attendance']} />
            <Line type="monotone" dataKey="avgAttendance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Shift Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={shiftData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
              {shiftData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TT_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Top Attendance — Employees">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topEmployees} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={70} />
            <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [`${v}%`, 'Attendance']} />
            <Bar dataKey="attendance" fill="#10b981" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Top Overtime — Employees">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={otTopEmployees} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={70} />
            <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [`${v} hrs`, 'Overtime']} />
            <Bar dataKey="ot" fill="#8b5cf6" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
