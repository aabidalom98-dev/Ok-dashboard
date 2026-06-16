import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileText, Table2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { findHeaderRow } from '../lib/columnMapper';

interface ModuleUploadProps {
  moduleName: string;
  description: string;
  sampleColumns: string[];
  onData: (rows: any[], fileName: string) => void;
}

/**
 * Parse an Excel worksheet, auto-detecting the real header row.
 * Skips title rows, merged-cell banners, year labels, etc. that appear
 * above the actual column headers in real-world salary/attendance sheets.
 */
function smartParseExcel(sheet: XLSX.WorkSheet): Record<string, any>[] {
  // Step 1: read as raw arrays so we can inspect every row
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });
  if (!rawRows.length) return [];

  // Step 2: find the first row that looks like real column headers
  const headerIdx = findHeaderRow(rawRows);

  // Step 3: re-parse using that row as the header row
  const parsed = XLSX.utils.sheet_to_json(sheet, {
    range: headerIdx,  // XLSX: treat this row index as the header
    defval: '',
    blankrows: false,
  });
  return parsed as Record<string, any>[];
}

/**
 * Parse a CSV string, auto-detecting the real header row.
 */
function smartParseCSV(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    // First parse: no headers — gives us raw arrays
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (result) => {
        const rawRows = result.data as any[][];
        if (!rawRows.length) { resolve([]); return; }

        const headerIdx = findHeaderRow(rawRows);
        const headers = rawRows[headerIdx].map((c: any) =>
          c !== null && c !== undefined ? String(c).trim() : ''
        );

        // Convert remaining rows to objects
        const dataRows = rawRows.slice(headerIdx + 1).map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((h, i) => {
            if (h) obj[h] = row[i] ?? '';
          });
          return obj;
        }).filter(row => Object.values(row).some(v => v !== '' && v !== null));

        resolve(dataRows);
      },
      error: (err) => reject(new Error(err.message)),
    });
  });
}

export function ModuleUpload({ moduleName, description, sampleColumns, onData }: ModuleUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'csv') {
        const rows = await smartParseCSV(file);
        if (!rows.length) { setError('CSV file is empty or has no data rows.'); setLoading(false); return; }
        onData(rows, file.name);

      } else if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = smartParseExcel(sheet);
        if (!rows.length) { setError('Excel file is empty or has no data.'); setLoading(false); return; }
        onData(rows, file.name);

      } else {
        setError('Unsupported format. Please upload a .csv, .xlsx, or .xls file.');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to parse file.');
    } finally {
      setLoading(false);
    }
  }, [onData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => { if (accepted[0]) processFile(accepted[0]); },
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  return (
    <div className="flex-1 max-w-[900px] w-full mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">{moduleName}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/20'
          }`}>
          <input {...getInputProps()} />
          <div className="flex justify-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Table2 className="w-7 h-7 text-emerald-500" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-7 h-7 text-blue-500" />
            </div>
          </div>
          {loading ? (
            <p className="text-primary font-medium animate-pulse">Processing file…</p>
          ) : isDragActive ? (
            <p className="text-primary font-medium">Drop to upload</p>
          ) : (
            <>
              <p className="text-lg font-semibold text-foreground mb-1">Drag & drop your file here</p>
              <p className="text-sm text-muted-foreground mb-5">Supports .csv, .xlsx, .xls files</p>
              <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                <Upload className="w-4 h-4" /> Browse Files
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Auto-detected columns (any naming works)</p>
          <div className="flex flex-wrap gap-2">
            {sampleColumns.map(col => (
              <span key={col} className="px-3 py-1 bg-muted/50 rounded-full text-xs text-foreground font-mono border border-border">{col}</span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Smart parser auto-skips title rows, merged headers, and year labels — different formats, spaces, underscores, alternate names all work automatically.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
