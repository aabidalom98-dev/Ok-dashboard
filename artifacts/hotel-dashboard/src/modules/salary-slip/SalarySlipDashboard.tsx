import { useState, useMemo } from 'react';
import { useSalary } from '../salary/SalaryContext';
import { SalaryRecord } from '../salary/SalaryContext';
import { Search, Printer, Download, X, Building2 } from 'lucide-react';

const fmt = (n: number) => n > 0 ? '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$0.00';

function SalarySlipModal({ record, onClose }: { record: SalaryRecord; onClose: () => void }) {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Print actions (hidden in print) */}
        <div className="no-print flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-600">Salary Slip Preview</span>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slip */}
        <div className="p-8 print-area">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 pb-6 border-b-2 border-gray-900">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-amber-600" />
                <span className="text-xl font-bold text-gray-900">HotelIQ</span>
              </div>
              <p className="text-xs text-gray-500">Premium Hospitality Analytics</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Salary Slip</h2>
              <p className="text-sm text-gray-500">{record.payrollMonth}</p>
            </div>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Employee Name</p>
              <p className="font-semibold text-gray-900">{record.employeeName || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Employee ID</p>
              <p className="font-semibold text-gray-900">{record.employeeId || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Department</p>
              <p className="font-semibold text-gray-900">{record.department || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Designation</p>
              <p className="font-semibold text-gray-900">{record.designation || '—'}</p>
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-200">Earnings</h3>
              {[
                ['Basic Salary', record.basicSalary],
                ['Allowances', record.allowances],
                ['Bonus', record.bonus],
                ['Incentives', record.incentives],
                ['Overtime Pay', record.overtimePay],
              ].filter(([, v]) => (v as number) > 0).map(([label, val]) => (
                <div key={label as string} className="flex justify-between py-1.5 text-sm">
                  <span className="text-gray-600">{label as string}</span>
                  <span className="font-medium text-gray-900">{fmt(val as number)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 mt-2 border-t-2 border-gray-900 font-bold">
                <span>Gross Salary</span>
                <span className="text-emerald-600">{fmt(record.grossSalary)}</span>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-200">Deductions</h3>
              {[
                ['Provident Fund (PF)', record.pf],
                ['ESI', record.esi],
                ['Tax / TDS', record.tax],
                ['Other Deductions', Math.max(0, record.deductions - record.pf - record.esi - record.tax)],
              ].filter(([, v]) => (v as number) > 0).map(([label, val]) => (
                <div key={label as string} className="flex justify-between py-1.5 text-sm">
                  <span className="text-gray-600">{label as string}</span>
                  <span className="font-medium text-red-600">-{fmt(val as number)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 mt-2 border-t-2 border-gray-900 font-bold">
                <span>Total Deductions</span>
                <span className="text-red-600">-{fmt(record.deductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="bg-gray-900 text-white rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">Net Take-Home Salary</p>
              <p className="text-2xl font-bold mt-1">{fmt(record.netSalary)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Payment Status</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                record.paymentStatus.toLowerCase().includes('paid') ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-gray-900'
              }`}>{record.paymentStatus}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-end">
            <div>
              <p className="text-[10px] text-gray-400">This is a computer-generated salary slip.</p>
              <p className="text-[10px] text-gray-400">Generated by HotelIQ Analytics Platform</p>
            </div>
            <div className="text-right">
              <div className="h-8 border-b border-gray-400 w-32 mb-1"></div>
              <p className="text-[10px] text-gray-400">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SalarySlipDashboard() {
  const { rawData, isLoaded } = useSalary();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SalaryRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rawData.filter(r =>
      r.employeeName.toLowerCase().includes(q) ||
      r.employeeId.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    );
  }, [rawData, search]);

  if (!isLoaded) {
    return (
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Printer className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No Salary Data Loaded</h3>
          <p className="text-muted-foreground text-sm">
            Upload a salary sheet in the <strong>Salary Analytics</strong> tab first, then come back here to generate individual salary slips.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Salary Slip Generator</h2>
          <p className="text-sm text-muted-foreground mt-1">{rawData.length} employees — click any row to generate a printable slip</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search employee…"
            className="pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-background w-60 outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((r, i) => (
          <button key={i} onClick={() => setSelected(r)}
            className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/50 hover:shadow-md hover:bg-muted/20 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                {(r.employeeName || 'E')[0].toUpperCase()}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                r.paymentStatus.toLowerCase().includes('paid') ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
              }`}>{r.paymentStatus}</span>
            </div>
            <p className="font-semibold text-foreground text-sm mb-0.5 truncate">{r.employeeName || r.employeeId}</p>
            <p className="text-xs text-muted-foreground truncate mb-3">{r.designation || r.department}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Net Salary</p>
                <p className="font-bold text-foreground">${r.netSalary.toLocaleString()}</p>
              </div>
              <span className="text-xs text-primary group-hover:underline flex items-center gap-1">
                <Printer className="w-3 h-3" /> View Slip
              </span>
            </div>
          </button>
        ))}
      </div>

      {selected && <SalarySlipModal record={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
