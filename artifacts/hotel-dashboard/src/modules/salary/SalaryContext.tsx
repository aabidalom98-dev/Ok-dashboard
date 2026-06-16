import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { detectColumns, getField, parseNum, parseStr } from '../../lib/columnMapper';

export interface SalaryRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  basicSalary: number;
  grossSalary: number;
  netSalary: number;
  bonus: number;
  incentives: number;
  allowances: number;
  deductions: number;
  pf: number;
  esi: number;
  tax: number;
  overtimePay: number;
  paymentStatus: string;
  payrollMonth: string;
}

export interface SalaryFilters {
  department: string[];
  designation: string[];
  paymentStatus: string[];
  month: string[];
}

const defaultFilters: SalaryFilters = {
  department: [], designation: [], paymentStatus: [], month: [],
};

interface SalaryContextType {
  rawData: SalaryRecord[];
  filteredData: SalaryRecord[];
  filters: SalaryFilters;
  setFilters: React.Dispatch<React.SetStateAction<SalaryFilters>>;
  fileName: string;
  isLoaded: boolean;
  loadData: (rows: any[], name: string) => void;
  clearData: () => void;
  mappingInfo: string[];
}

const Ctx = createContext<SalaryContextType | undefined>(undefined);

// All fields we want to detect for salary sheets
const SALARY_FIELDS = [
  'employeeId', 'employeeName', 'department', 'designation',
  'basicSalary', 'grossSalary', 'netSalary',
  'bonus', 'incentives', 'allowances',
  'deductions', 'pf', 'esi', 'tax', 'overtimePay',
  'paymentStatus', 'payrollMonth',
];

export function SalaryProvider({ children }: { children: ReactNode }) {
  const [rawData, setRawData] = useState<SalaryRecord[]>([]);
  const [fileName, setFileName] = useState('');
  const [filters, setFilters] = useState<SalaryFilters>(defaultFilters);
  const [mappingInfo, setMappingInfo] = useState<string[]>([]);

  const isLoaded = rawData.length > 0;

  const loadData = (rows: any[], name: string) => {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const { mapping, fields } = detectColumns(cols, SALARY_FIELDS);
    setMappingInfo(fields.map(f => `${f} → ${mapping[f]}`));

    const processed: SalaryRecord[] = rows.map(row => {
      const g = (f: string) => getField(row, mapping, f);

      const gross = parseNum(g('grossSalary'));
      const net = parseNum(g('netSalary'));
      const basic = parseNum(g('basicSalary')) || gross * 0.5;
      const pf = parseNum(g('pf'));
      const esi = parseNum(g('esi'));
      const tax = parseNum(g('tax'));
      const bonus = parseNum(g('bonus'));
      const incentives = parseNum(g('incentives'));
      const allowances = parseNum(g('allowances'));
      const otPay = parseNum(g('overtimePay'));

      // Deductions: prefer explicit column, else derive from gross - net
      let deductions = parseNum(g('deductions'));
      if (!deductions && gross > 0 && net > 0 && gross > net) {
        deductions = gross - net;
      }

      // Net: prefer explicit column, else gross - deductions
      const netFinal = net || (gross - deductions > 0 ? gross - deductions : gross);

      return {
        employeeId: parseStr(g('employeeId')),
        employeeName: parseStr(g('employeeName')),
        department: parseStr(g('department')),
        designation: parseStr(g('designation')),
        basicSalary: basic,
        grossSalary: gross,
        netSalary: netFinal,
        bonus,
        incentives,
        allowances,
        deductions,
        pf,
        esi,
        tax,
        overtimePay: otPay,
        paymentStatus: parseStr(g('paymentStatus')) || 'Paid',
        payrollMonth: parseStr(g('payrollMonth')) || 'N/A',
      };
    }).filter(r => r.employeeName || r.grossSalary > 0);

    setRawData(processed);
    setFileName(name);
    setFilters(defaultFilters);
  };

  const clearData = () => {
    setRawData([]); setFileName(''); setFilters(defaultFilters); setMappingInfo([]);
  };

  const filteredData = useMemo(() => rawData.filter(r => {
    if (filters.department.length && !filters.department.includes(r.department)) return false;
    if (filters.designation.length && !filters.designation.includes(r.designation)) return false;
    if (filters.paymentStatus.length && !filters.paymentStatus.includes(r.paymentStatus)) return false;
    if (filters.month.length && !filters.month.includes(r.payrollMonth)) return false;
    return true;
  }), [rawData, filters]);

  return (
    <Ctx.Provider value={{ rawData, filteredData, filters, setFilters, fileName, isLoaded, loadData, clearData, mappingInfo }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSalary() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSalary must be used within SalaryProvider');
  return ctx;
}
