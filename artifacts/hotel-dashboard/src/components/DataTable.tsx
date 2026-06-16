import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Download, ChevronLeft, ChevronRight } from 'lucide-react';

type SortDir = 'asc' | 'desc' | null;
const PAGE_SIZES = [10, 25, 50, 100];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const formatDate = (d: Date) => {
  if (!(d instanceof Date) || isNaN(d.getTime())) return String(d);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  completed: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  cancelled: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  'no-show': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

const COLUMNS = [
  { key: 'booking_id', label: 'Booking ID', sortable: true, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
  { key: 'booking_date', label: 'Date', sortable: true, render: (v: Date) => formatDate(v) },
  { key: 'guest_type', label: 'Guest Type', sortable: true },
  { key: 'booking_source', label: 'Source', sortable: true },
  { key: 'nights_stayed', label: 'Nights', sortable: true },
  { key: 'number_of_rooms', label: 'Rooms', sortable: true },
  { key: 'room_revenue', label: 'Room Rev.', sortable: true, render: (v: number) => formatCurrency(v) },
  { key: 'food_revenue', label: 'Food Rev.', sortable: true, render: (v: number) => formatCurrency(v) },
  { key: 'total_bill', label: 'Total Bill', sortable: true, render: (v: number) => <span className="font-semibold text-primary">{formatCurrency(v)}</span> },
  { key: 'guest_rating', label: 'Rating', sortable: true, render: (v: number) => <span className="font-mono">{v?.toFixed(1)}</span> },
  { key: 'booking_status', label: 'Status', sortable: true, render: (v: string) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[v?.toLowerCase()] || 'bg-muted text-muted-foreground'}`}>
      {v}
    </span>
  )},
  { key: 'guest_country', label: 'Country', sortable: true },
  { key: 'payment_method', label: 'Payment', sortable: true },
];

export function DataTable() {
  const { filteredData } = useData();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const searched = useMemo(() => {
    if (!search.trim()) return filteredData;
    const q = search.toLowerCase();
    return filteredData.filter(row =>
      COLUMNS.some(col => {
        const val = (row as any)[col.key];
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }, [filteredData, search]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return searched;
    return [...searched].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      let cmp = 0;
      if (av instanceof Date && bv instanceof Date) cmp = av.getTime() - bv.getTime();
      else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [searched, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); }
    else if (sortDir === 'asc') setSortDir('desc');
    else { setSortKey(null); setSortDir(null); }
    setPage(1);
  };

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const exportCsv = () => {
    const headers = COLUMNS.map(c => c.label).join(',');
    const rows = sorted.map(row =>
      COLUMNS.map(col => {
        const v = (row as any)[col.key];
        const str = v instanceof Date ? formatDate(v) : String(v ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'hotel_data.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-medium">Data Table</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{sorted.length.toLocaleString()} records</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className="pl-8 h-8 text-sm w-48 bg-background/60"
                data-testid="table-search"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} className="h-8 text-xs" data-testid="export-csv">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-muted/30">
              <tr>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs whitespace-nowrap cursor-pointer hover:text-foreground select-none"
                    onClick={() => col.sortable && handleSort(col.key)}
                    data-testid={`sort-${col.key}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && <SortIcon col={col.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-muted-foreground text-sm">No records found</td></tr>
              ) : (
                paginated.map((row, i) => (
                  <tr key={i} className={`hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`} data-testid={`row-booking-${row.booking_id}`}>
                    {COLUMNS.map(col => (
                      <td key={col.key} className="px-4 py-2.5 whitespace-nowrap">
                        {col.render ? col.render((row as any)[col.key]) : String((row as any)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page:</span>
            {PAGE_SIZES.map(s => (
              <button
                key={s}
                onClick={() => { setPageSize(s); setPage(1); }}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${pageSize === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                data-testid={`page-size-${s}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="prev-page">
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} data-testid="next-page">
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
