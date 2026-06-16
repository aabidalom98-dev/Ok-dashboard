import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSalary, SalaryFilters } from './SalaryContext';
import { SalaryKPIs } from './SalaryKPIs';
import { SalaryCharts } from './SalaryCharts';
import { SalaryTable } from './SalaryTable';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

function FilterDrop({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, minWidth: 180, zIndex: 99999 });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const drop = document.getElementById(`sdrop-${label}`);
      if (btnRef.current && !btnRef.current.contains(e.target as Node) && drop && !drop.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, label]);

  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);
  const display = selected.length === 0 ? 'All' : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-0.5">{label}</label>
      <button ref={btnRef} onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-2 w-full px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition-colors text-sm text-foreground">
        <span className={selected.length === 0 ? 'text-muted-foreground' : 'text-foreground font-medium'}>{display}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && createPortal(
        <div id={`sdrop-${label}`} style={style} className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          <button onMouseDown={e => { e.preventDefault(); onChange([]); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm border-b border-border/50 ${selected.length === 0 ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/60 text-foreground'}`}>All</button>
          <div className="max-h-52 overflow-y-auto">
            {options.map(opt => (
              <button key={opt} onMouseDown={e => { e.preventDefault(); toggle(opt); }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 ${selected.includes(opt) ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/60 text-foreground'}`}>
                <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${selected.includes(opt) ? 'bg-primary border-primary' : 'border-border'}`}>
                  {selected.includes(opt) && <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>, document.body
      )}
    </div>
  );
}

export function SalaryDashboard() {
  const { filteredData, rawData, filters, setFilters } = useSalary();

  const options = useMemo(() => ({
    departments: [...new Set(rawData.map(r => r.department).filter(Boolean))].sort(),
    designations: [...new Set(rawData.map(r => r.designation).filter(Boolean))].sort(),
    statuses: [...new Set(rawData.map(r => r.paymentStatus).filter(Boolean))].sort(),
    months: [...new Set(rawData.map(r => r.payrollMonth).filter(Boolean))].sort(),
  }), [rawData]);

  const activeCount = [filters.department, filters.designation, filters.paymentStatus, filters.month].reduce((s, a) => s + a.length, 0);
  const reset = () => setFilters({ department: [], designation: [], paymentStatus: [], month: [] });
  const up = <K extends keyof SalaryFilters>(k: K, v: SalaryFilters[K]) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6 space-y-8">
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <FilterDrop label="Department" options={options.departments} selected={filters.department} onChange={v => up('department', v)} />
          <FilterDrop label="Designation" options={options.designations} selected={filters.designation} onChange={v => up('designation', v)} />
          <FilterDrop label="Payment Status" options={options.statuses} selected={filters.paymentStatus} onChange={v => up('paymentStatus', v)} />
          <FilterDrop label="Month" options={options.months} selected={filters.month} onChange={v => up('month', v)} />
        </div>
        <div className="flex justify-end pt-3 border-t border-border/40">
          <button onClick={reset} disabled={activeCount === 0}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset filters
            {activeCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-primary/15 text-primary rounded-full text-[10px] font-semibold">{activeCount}</span>}
          </button>
        </div>
      </div>

      <SalaryKPIs />

      {filteredData.length === 0 ? (
        <div className="py-20 text-center border rounded-lg bg-card">
          <h3 className="text-xl font-medium text-muted-foreground">No records match current filters</h3>
        </div>
      ) : (
        <>
          <SalaryCharts />
          <SalaryTable />
        </>
      )}
    </div>
  );
}
