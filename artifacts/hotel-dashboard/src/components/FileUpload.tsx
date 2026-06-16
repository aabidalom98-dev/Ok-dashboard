import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useData } from '../context/DataContext';
import { UploadCloud, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findHeaderRow } from '../lib/columnMapper';

function smartParseExcel(sheet: XLSX.WorkSheet): Record<string, any>[] {
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });
  if (!rawRows.length) return [];
  const headerIdx = findHeaderRow(rawRows);
  return XLSX.utils.sheet_to_json(sheet, {
    range: headerIdx,
    defval: '',
    blankrows: false,
  }) as Record<string, any>[];
}

function smartParseCSV(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
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
        const dataRows = rawRows.slice(headerIdx + 1).map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((h, i) => { if (h) obj[h] = row[i] ?? ''; });
          return obj;
        }).filter(row => Object.values(row).some(v => v !== '' && v !== null));
        resolve(dataRows);
      },
      error: (err) => reject(new Error(err.message)),
    });
  });
}

export function FileUpload() {
  const { loadData } = useData();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setIsProcessing(true);
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExt === 'csv') {
        const rows = await smartParseCSV(file);
        if (!rows.length) { setError('CSV file appears empty.'); return; }
        loadData(rows, file.name);

      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = smartParseExcel(sheet);
        if (!rows.length) { setError('Excel file appears empty.'); return; }
        loadData(rows, file.name);

      } else {
        setError('Unsupported file type. Please upload a .csv or .xlsx file.');
      }
    } catch (err: any) {
      setError('Failed to process data. Please check the file format.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [loadData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-3xl mx-auto px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-light tracking-tight text-foreground mb-4">
          Hotel<span className="font-semibold text-primary">IQ</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Upload your hotel performance data to generate real-time analytics and luxury-grade insights.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`w-full border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-300 ease-out flex flex-col items-center justify-center min-h-[300px]
          ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
          ${error ? 'border-destructive bg-destructive/5' : ''}
        `}
      >
        <input {...getInputProps()} />

        {isProcessing ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-lg font-medium text-foreground">Processing your data...</p>
          </div>
        ) : (
          <>
            <div className="flex space-x-4 mb-6">
              <div className="p-4 bg-background rounded-full shadow-sm border border-border flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="p-4 bg-background rounded-full shadow-sm border border-border flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <h3 className="text-xl font-medium text-foreground mb-2">
              {isDragActive ? 'Drop your file here' : 'Drag & drop your file'}
            </h3>
            <p className="text-muted-foreground mb-8">Supports .csv and .xlsx files</p>

            <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground">
              <UploadCloud className="w-5 h-5 mr-2" />
              Browse Files
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-6 flex items-center space-x-2 text-destructive bg-destructive/10 px-4 py-3 rounded-lg w-full">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="mt-12 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
          <h4 className="font-medium text-foreground mb-2">Instant Insights</h4>
          <p className="text-sm text-muted-foreground">Automated dashboards render instantly with zero configuration.</p>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
          <h4 className="font-medium text-foreground mb-2">100% Secure</h4>
          <p className="text-sm text-muted-foreground">All processing happens locally in your browser. No data leaves your device.</p>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
          <h4 className="font-medium text-foreground mb-2">Auto-detection</h4>
          <p className="text-sm text-muted-foreground">Smart column mapping supports varied data formats automatically.</p>
        </div>
      </div>
    </div>
  );
}
