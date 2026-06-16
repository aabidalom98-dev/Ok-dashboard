// Smart Column Detection Engine
// Uses keyword scoring + fuzzy matching to map any CSV/Excel columns to normalized field names

const FIELD_ALIASES: Record<string, string[]> = {
  // ── Employee Identity ──────────────────────────────────────────────────────
  employeeId: [
    'empid','employeeid','staffid','workerid','empno','employeeno','staffno',
    'eid','empcode','employeecode','employeenumber','employeeidnumber',
  ],
  employeeName: [
    'employeename','empname','staffname','workername','name','employee','staff',
    'worker','fullname','membername','person','candidatename',
  ],
  department: ['department','dept','division','section','unit','team','group','costcenter'],
  designation: ['designation','role','position','title','jobtitle','grade','level','rank','post'],
  shift: ['shift','dutyshift','workshift','timing','shifttype','shiftname','shiftcode'],

  // ── Attendance ─────────────────────────────────────────────────────────────
  attendanceDate: ['attendancedate','attendanceon','fordate','ondate'],
  month: ['month','attendancemonth','formonth','periodmonth','monthofyear'],
  presentDays: [
    'present','presentdays','presentday','daysworked','worked','daysattended',
    'daysofwork','actualworkingdays','workingdayspresent','dayspresent',
  ],
  absentDays: [
    'absent','absentdays','absentday','absences','daysabsent',
    'leavewithoutpay','unpaidleave','lwp',
  ],
  halfDays: ['halfday','halfdaycount','halfdayscount','halfpresent','halfdays'],
  overtime: ['ot','overtime','extrahours','overtimehours','extrawork','othours','overtimedays'],
  lateArrivals: ['late','lateentry','latearrivals','latemark','latein','latecount','latedays'],
  leaveCount: ['leave','leavecount','totalleave','leaves','leavetaken','leavedays','totalleavetaken'],
  weekOffs: ['weekoff','weekoffs','weeklyoff','sundayoff','offdays','wo'],
  holidays: ['holiday','holidays','publicholiday','bankholiday','festivalholiday'],
  workingHours: ['workinghours','totalhours','hoursworked','dailyhours','actualhours','totalmanhours'],
  totalWorkingDays: [
    'totalworkingdays','workdays','totaldays','workingdays','scheduleddays',
    'calendardays','workingdaysinthemonth','businessdays',
  ],
  attendancePct: [
    'attendancepct','attendancepercent','attendancepercentage',
    'attendancerate','attendanceratio',
  ],

  // ── Salary / Payroll ───────────────────────────────────────────────────────
  basicSalary: ['basicsalary','basic','basepay','basewage','basicpay','baseamount','basicwage'],
  grossSalary: [
    'grosssalary','gross','ctc','salary','totalsalary','grosspay',
    'totalearnings','earnings','totalcompensation','grossearnings',
  ],
  netSalary: [
    'netsalary','net','payablesalary','finalsalary','takehome','nettakehome',
    'netpay','netamount','salarypayable','amountpayable','nettakehomesalary',
    'totalnetsalary','netsalarypayable',
  ],
  bonus: [
    'bonus','performancebonus','bonusamount',
  ],
  incentives: [
    'incentive','incentives','incentiveamount','performanceincentive',
    'variablepay','variablecomponent','performancepay','rewardamount',
  ],
  allowances: [
    'allowance','allowances','hra','houserentallowance','da','dearnessallowance',
    'travelallowance','travel','conveyance','conveyanceallowance','medical',
    'medicalallowance','specialallowance','totalallowances',
  ],
  deductions: [
    'deduction','deductions','totaldeduction','totaldeductions',
    'grossdeduction','adjustment','minus','totalcut',
  ],
  pf: ['pf','providentfund','epf','employeepf','pfcontribution','pfdeduction','pfamount'],
  esi: ['esi','esic','medicalinsurance','healthinsurance','esicontribution','esiamount'],
  tax: ['tax','tds','incometax','taxdeduction','taxamount','tdsamount','taxcut'],
  overtimePay: ['otpay','overtimepay','otamount','overtimeamount','overtimewages'],
  paymentStatus: ['paymentstatus','salarystatus','paymentstage','salarypaidstatus'],
  payrollMonth: ['payrollmonth','salarymonth','period','payperiod','salaryperiod','payslipmonth'],

  // ── Hotel / Booking ────────────────────────────────────────────────────────
  bookingId: ['bookingid','bookingno','reservationid','booking'],
  bookingDate: ['bookingdate','bookedon','reservationdate'],
  guestType: ['guesttype','guest','guestcategory'],
  bookingSource: ['bookingsource','source','channel','bookedfrom'],
  nightsStayed: ['nightsstayed','nights','duration','staydays'],
  numberOfRooms: ['numberofrooms','rooms','roomcount','noofrooms'],
  roomPrice: ['roomprice','price','rate','roomrate'],
  roomRevenue: ['roomrevenue','roomsales','roomearnings'],
  foodRevenue: ['foodrevenue','food','fnb','fb','foodandbeverage'],
  totalBill: ['totalbill','total','totalrevenue','bill','amount','totalamount'],
  bookingStatus: ['bookingstatus','reservationstatus','bookingstate'],
  guestRating: ['guestrating','rating','review','score','feedbackscore'],
  guestCountry: ['guestcountry','country','nationality','origin','guestnationality'],
  paymentMethod: ['paymentmethod','payment','mode','paymode','paymentmode'],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s_\-\.\/\\]+/g, '').trim();
}

function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 8) return Math.max(a.length, b.length); // early exit
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function scoreColumn(normalizedCol: string, aliases: string[]): number {
  let best = 0;
  for (const alias of aliases) {
    const na = normalize(alias);

    // Exact match — highest confidence
    if (normalizedCol === na) return 100;

    // Substring match — only allow if both strings are at least 4 chars long
    // (prevents "it" matching "deduction" or "p" matching "department")
    const minLen = Math.min(normalizedCol.length, na.length);
    if (minLen >= 4) {
      if (normalizedCol.includes(na) || na.includes(normalizedCol)) {
        best = Math.max(best, 78);
        continue;
      }
    }

    // Fuzzy similarity — only for strings with meaningful length
    if (normalizedCol.length >= 3 && na.length >= 3) {
      const sim = similarity(normalizedCol, na);
      if (sim >= 0.8) best = Math.max(best, Math.round(sim * 65));
    }
  }
  return best;
}

export interface ColumnMapping {
  [fieldName: string]: string;
}

export interface DetectionResult {
  mapping: ColumnMapping;
  confidence: Record<string, number>;
  unmapped: string[];
  fields: string[];
}

export function detectColumns(
  actualColumns: string[],
  targetFields?: string[]
): DetectionResult {
  const fieldsToDetect = targetFields
    ? Object.fromEntries(targetFields.map(f => [f, FIELD_ALIASES[f] ?? []]))
    : FIELD_ALIASES;

  const mapping: ColumnMapping = {};
  const confidence: Record<string, number> = {};
  const usedColumns = new Set<string>();

  // Score each (field, column) pair — only keep scores >= 50
  const scores: Array<{ field: string; col: string; score: number }> = [];
  for (const [field, aliases] of Object.entries(fieldsToDetect)) {
    if (!aliases.length) continue; // field has no aliases — skip
    for (const col of actualColumns) {
      const score = scoreColumn(normalize(col), aliases);
      if (score >= 50) scores.push({ field, col, score });
    }
  }

  // Greedy assignment: highest score first; each column and each field used once.
  // Tie-break by column name length (longer = more specific, e.g. "Gross Salary" beats "Salary").
  scores.sort((a, b) => b.score !== a.score ? b.score - a.score : b.col.length - a.col.length);
  for (const { field, col, score } of scores) {
    if (field in mapping) continue;     // field already assigned
    if (usedColumns.has(col)) continue; // column already taken
    mapping[field] = col;
    confidence[field] = score;
    usedColumns.add(col);
  }

  const unmapped = actualColumns.filter(c => !usedColumns.has(c));
  const fields = Object.keys(mapping);

  return { mapping, confidence, unmapped, fields };
}

export function getField(row: Record<string, any>, mapping: ColumnMapping, field: string): any {
  const col = mapping[field];
  return col !== undefined ? row[col] : undefined;
}

// Robust number parser — handles "$1,234.56", "1.2K", "₹50,000", etc.
export function parseNum(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const s = String(val).replace(/[$,£€¥₹\s%]/g, '').trim();
  if (!s) return 0;
  if (s.endsWith('K') || s.endsWith('k')) return (parseFloat(s) || 0) * 1000;
  if (s.endsWith('M') || s.endsWith('m')) return (parseFloat(s) || 0) * 1_000_000;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Robust date parser — handles Excel serials, ISO strings, common formats
export function parseDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'number' && val > 40000 && val < 60000) {
    const d = new Date((val - 25569) * 86400 * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export function parseStr(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

/**
 * Scans the first 10 rows (as raw arrays) and returns the index of the row
 * that is most likely the actual header row — i.e. the first row where at
 * least 2 cells are recognisable field names in ANY module's alias table.
 * Handles Excel sheets that begin with title rows, year labels, merged cells, etc.
 */
export function findHeaderRow(rawRows: any[][]): number {
  for (let i = 0; i < Math.min(10, rawRows.length); i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;
    // Extract non-empty string values from this row
    const cellStrings = row
      .map(c => (c !== null && c !== undefined ? String(c).trim() : ''))
      .filter(s => s.length > 0);
    if (cellStrings.length < 2) continue;
    // Try column detection using this row's values as column names
    const { fields } = detectColumns(cellStrings);
    if (fields.length >= 2) return i;
  }
  return 0; // safe fallback — use first row
}
