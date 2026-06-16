import { useState, useMemo } from 'react';
import { useAttendance } from './AttendanceContext';
import { ChevronUp, ChevronDown, Download, Search } from 'lucide-react';

type SortDir = 'asc' | 'desc';

function badge(pct: number) {
  if (pct >= 90) return 'bg-emerald-500/15 text-emerald-500';
  if (pct >= 75) return 'bg-amber-500/15 text-amber-500';
  return 'bg-rose-500/15 text-rose-500';
}

export function AttendanceTable() {
  const { filteredData } = useAttendance();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof typeof filteredData[0]>('attendancePct');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const searched = useMemo(() => {
    const q = search.toLowerCase();
    return filteredData.filter(r =>
      r.employeeName.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.employeeId.toLowerCase().includes(q)
    );
  }, [filteredData, search]);

  const sorted = useMemo(() => [...searched].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  }), [searched, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  const exportCSV = () => {
    const h = ['Employee','Department','Designation','Month','Present','Absent','Half Day','Overtime','Late','Attendance %'];
    const rows = sorted.map(r => [r.employeeName, r.department, r.designation, r.month, r.presentDays, r.absentDays, r.halfDays, r.overtime, r.lateArrivals, r.attendancePct]);
    const csv = [h, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'attendance.csv'; a.click();
  };

  const SortIcon = ({ k }: { k: typeof sortKey }) => (
    sortKey === k
      ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />)
      : null
  );

  const col = 'text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors whitespace-nowrap';

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Attendance Records</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search employee…"
              className="pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background w-full sm:w-52 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              {([['employeeName','Employee'], ['department','Department'], ['designation','Designation'], ['month','Month'], ['presentDays','Present'], ['absentDays','Absent'], ['overtime','Overtime'], ['lateArrivals','Late'], ['attendancePct','Attendance %']] as [keyof typeof filteredData[0], string][]).map(([k, label]) => (
                <th key={k} className={col} onClick={() => toggleSort(k)}>{label}<SortIcon k={k} /></th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageData.map((r, i) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{r.employeeName || r.employeeId}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.department}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.designation}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.month}</td>
                <td className="px-4 py-3 text-center">{r.presentDays}</td>
                <td className="px-4 py-3 text-center">{r.absentDays}</td>
                <td className="px-4 py-3 text-center">{r.overtime}</td>
                <td className="px-4 py-3 text-center">{r.lateArrivals}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge(r.attendancePct)}`}>
                    {r.attendancePct.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
        <span>{sorted.length} records</span>
        <div className="flex items-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40 transition-colors">Prev</button>
          <span>Page {page} / {totalPages || 1}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40 transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}
