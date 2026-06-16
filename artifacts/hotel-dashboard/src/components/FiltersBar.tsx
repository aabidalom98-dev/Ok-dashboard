import { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useData, Filters } from '../context/DataContext';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface FilterDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}

function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        minWidth: 180,
        zIndex: 99999,
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const drop = document.getElementById(`fdd-${label}`);
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        drop && !drop.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, label]);

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val]);
  };

  const displayValue = selected.length === 0
    ? 'All'
    : selected.length === 1
    ? selected[0]
    : `${selected.length} selected`;

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-0.5">
        {label}
      </label>
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-2 w-full px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition-colors text-sm text-foreground"
        data-testid={`filter-${label.toLowerCase().replace(/\s/g, '-')}`}
      >
        <span className={selected.length === 0 ? 'text-muted-foreground' : 'text-foreground font-medium'}>
          {displayValue}
        </span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        }
      </button>

      {open && createPortal(
        <div
          id={`fdd-${label}`}
          style={dropStyle}
          className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        >
          {/* All option */}
          <button
            onMouseDown={e => { e.preventDefault(); onChange([]); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-border/50 ${
              selected.length === 0
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-muted/60 text-foreground'
            }`}
          >
            All
          </button>
          <div className="max-h-52 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt}
                onMouseDown={e => { e.preventDefault(); toggle(opt); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                  selected.includes(opt)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted/60 text-foreground'
                }`}
              >
                <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  selected.includes(opt) ? 'bg-primary border-primary' : 'border-border'
                }`}>
                  {selected.includes(opt) && (
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export function FiltersBar() {
  const { filters, setFilters, rawData } = useData();

  const options = useMemo(() => {
    const unique = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort();
    return {
      months: unique(rawData.map(r => {
        const d = r.booking_date instanceof Date ? r.booking_date : new Date(r.booking_date);
        return isNaN(d.getTime()) ? '' : d.toLocaleString('default', { month: 'long' });
      })),
      guestTypes: unique(rawData.map(r => r.guest_type)),
      bookingSources: unique(rawData.map(r => r.booking_source)),
      countries: unique(rawData.map(r => r.guest_country)),
      paymentMethods: unique(rawData.map(r => r.payment_method)),
      statuses: unique(rawData.map(r => r.booking_status)),
    };
  }, [rawData]);

  const activeCount = [
    filters.bookingMonths, filters.guestTypes, filters.bookingSources,
    filters.guestCountries, filters.paymentMethods, filters.bookingStatuses,
    filters.dateRange.start ? ['x'] : [],
  ].reduce((sum, arr) => sum + arr.length, 0);

  const resetAll = () => setFilters({
    dateRange: { start: null, end: null },
    bookingMonths: [], guestTypes: [], bookingSources: [],
    guestCountries: [], paymentMethods: [], bookingStatuses: [],
  });

  const update = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters(f => ({ ...f, [key]: val }));

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      {/* Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {/* Date range as "Month" style */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-0.5">
            DATE FROM
          </label>
          <input
            type="date"
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground hover:bg-muted/40 transition-colors outline-none focus:ring-2 focus:ring-primary/30"
            value={filters.dateRange.start ? filters.dateRange.start.toISOString().slice(0, 10) : ''}
            onChange={e => update('dateRange', { ...filters.dateRange, start: e.target.value ? new Date(e.target.value) : null })}
            data-testid="filter-date-start"
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-0.5">
            DATE TO
          </label>
          <input
            type="date"
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground hover:bg-muted/40 transition-colors outline-none focus:ring-2 focus:ring-primary/30"
            value={filters.dateRange.end ? filters.dateRange.end.toISOString().slice(0, 10) : ''}
            onChange={e => update('dateRange', { ...filters.dateRange, end: e.target.value ? new Date(e.target.value) : null })}
            data-testid="filter-date-end"
          />
        </div>

        <FilterDropdown
          label="Guest Type"
          options={options.guestTypes}
          selected={filters.guestTypes}
          onChange={v => update('guestTypes', v)}
        />
        <FilterDropdown
          label="Source"
          options={options.bookingSources}
          selected={filters.bookingSources}
          onChange={v => update('bookingSources', v)}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <FilterDropdown
          label="Country"
          options={options.countries}
          selected={filters.guestCountries}
          onChange={v => update('guestCountries', v)}
        />
        <FilterDropdown
          label="Payment"
          options={options.paymentMethods}
          selected={filters.paymentMethods}
          onChange={v => update('paymentMethods', v)}
        />
        <FilterDropdown
          label="Status"
          options={options.statuses}
          selected={filters.bookingStatuses}
          onChange={v => update('bookingStatuses', v)}
        />
        <FilterDropdown
          label="Month"
          options={options.months}
          selected={filters.bookingMonths}
          onChange={v => update('bookingMonths', v)}
        />
      </div>

      {/* Reset row */}
      <div className="flex justify-end mt-4 pt-3 border-t border-border/40">
        <button
          onClick={resetAll}
          disabled={activeCount === 0}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          data-testid="reset-filters"
        >
          <RotateCcw className="w-3 h-3" />
          Reset filters
          {activeCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary/15 text-primary rounded-full text-[10px] font-semibold">
              {activeCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
