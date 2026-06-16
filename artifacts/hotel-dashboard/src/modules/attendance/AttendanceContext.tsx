import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { detectColumns, getField, parseNum, parseDate, parseStr } from '../../lib/columnMapper';

export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  shift: string;
  month: string;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  overtime: number;
  lateArrivals: number;
  leaveCount: number;
  weekOffs: number;
  holidays: number;
  workingHours: number;
  totalWorkingDays: number;
  attendancePct: number;
}

export interface AttendanceFilters {
  department: string[];
  shift: string[];
  month: string[];
  status: string[];
}

const defaultFilters: AttendanceFilters = {
  department: [], shift: [], month: [], status: [],
};

interface AttendanceContextType {
  rawData: AttendanceRecord[];
  filteredData: AttendanceRecord[];
  filters: AttendanceFilters;
  setFilters: React.Dispatch<React.SetStateAction<AttendanceFilters>>;
  fileName: string;
  isLoaded: boolean;
  loadData: (rows: any[], name: string) => void;
  clearData: () => void;
  mappingInfo: string[];
}

const Ctx = createContext<AttendanceContextType | undefined>(undefined);

// All fields we want to detect for attendance sheets
const ATTENDANCE_FIELDS = [
  'employeeId', 'employeeName', 'department', 'designation', 'shift',
  'attendanceDate', 'month',
  'presentDays', 'absentDays', 'halfDays', 'overtime', 'lateArrivals',
  'leaveCount', 'weekOffs', 'holidays', 'workingHours', 'totalWorkingDays', 'attendancePct',
];

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [rawData, setRawData] = useState<AttendanceRecord[]>([]);
  const [fileName, setFileName] = useState('');
  const [filters, setFilters] = useState<AttendanceFilters>(defaultFilters);
  const [mappingInfo, setMappingInfo] = useState<string[]>([]);

  const isLoaded = rawData.length > 0;

  const loadData = (rows: any[], name: string) => {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const { mapping, fields } = detectColumns(cols, ATTENDANCE_FIELDS);
    setMappingInfo(fields.map(f => `${f} → ${mapping[f]}`));

    const processed: AttendanceRecord[] = rows.map(row => {
      const g = (f: string) => getField(row, mapping, f);

      const totalWorking = parseNum(g('totalWorkingDays')) || 26;
      const present = parseNum(g('presentDays'));
      const absent = parseNum(g('absentDays'));
      const half = parseNum(g('halfDays'));

      // Compute attendance % — prefer explicit column, else calculate from present/total
      let pct = parseNum(g('attendancePct'));
      if (!pct && totalWorking > 0) {
        pct = Math.round(((present + half * 0.5) / totalWorking) * 100);
      }
      // Clamp to 0-100
      pct = Math.min(100, Math.max(0, pct));

      // Derive month label — try month column first, then attendanceDate column
      let monthStr = parseStr(g('month'));
      if (!monthStr) {
        const d = parseDate(g('attendanceDate'));
        if (d) monthStr = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      }
      if (!monthStr) monthStr = 'Unknown';

      // Compute absent if not provided
      const computedAbsent = absent || Math.max(0, totalWorking - present - half);

      return {
        employeeId: parseStr(g('employeeId')) || parseStr(g('employeeName')),
        employeeName: parseStr(g('employeeName')),
        department: parseStr(g('department')),
        designation: parseStr(g('designation')),
        shift: parseStr(g('shift')),
        month: monthStr,
        presentDays: present,
        absentDays: computedAbsent,
        halfDays: half,
        overtime: parseNum(g('overtime')),
        lateArrivals: parseNum(g('lateArrivals')),
        leaveCount: parseNum(g('leaveCount')),
        weekOffs: parseNum(g('weekOffs')),
        holidays: parseNum(g('holidays')),
        workingHours: parseNum(g('workingHours')),
        totalWorkingDays: totalWorking,
        attendancePct: pct,
      };
    }).filter(r => r.employeeName || r.employeeId);

    setRawData(processed);
    setFileName(name);
    setFilters(defaultFilters);
  };

  const clearData = () => {
    setRawData([]); setFileName(''); setFilters(defaultFilters); setMappingInfo([]);
  };

  const filteredData = useMemo(() => rawData.filter(r => {
    if (filters.department.length && !filters.department.includes(r.department)) return false;
    if (filters.shift.length && !filters.shift.includes(r.shift)) return false;
    if (filters.month.length && !filters.month.includes(r.month)) return false;
    if (filters.status.length) {
      const s = r.attendancePct >= 90 ? 'Good' : r.attendancePct >= 75 ? 'Average' : 'Poor';
      if (!filters.status.includes(s)) return false;
    }
    return true;
  }), [rawData, filters]);

  return (
    <Ctx.Provider value={{ rawData, filteredData, filters, setFilters, fileName, isLoaded, loadData, clearData, mappingInfo }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAttendance must be used within AttendanceProvider');
  return ctx;
}
