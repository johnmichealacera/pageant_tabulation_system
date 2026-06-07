'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ImportType = 'contestants' | 'judges';

interface ParsedRow { [key: string]: string }

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: ParsedRow = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  }).filter(row => Object.values(row).some(v => v !== ''));
}

const TEMPLATES: Record<ImportType, { headers: string[]; example: string[] }> = {
  contestants: {
    headers: ['name', 'age', 'course', 'year'],
    example: ['Maria Santos', '22', 'BS Tourism', '4th Year'],
  },
  judges: {
    headers: ['name', 'role', 'email', 'password'],
    example: ['Dr. Cruz', 'Head Judge', 'cruz@school.edu', 'judge123'],
  },
};

export default function ImportPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const typeParam = searchParams.get('type') as ImportType | null;
  const [importType, setImportType] = useState<ImportType>(typeParam === 'judges' ? 'judges' : 'contestants');
  const [rows, setRows]             = useState<ParsedRow[]>([]);
  const [fileName, setFileName]     = useState('');
  const [importing, setImporting]   = useState(false);
  const [result, setResult]         = useState<{ success: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver]     = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    const role = (session?.user as any)?.role;
    if (!session || role !== 'ADMIN') router.push('/auth/signin');
  }, [session, status]);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) { alert('Please upload a .csv file'); return; }
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setRows(parseCSV(text));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const downloadTemplate = () => {
    const tpl = TEMPLATES[importType];
    const csv = [tpl.headers.join(','), tpl.example.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/events/${params.id}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: importType, rows }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success > 0) setRows([]);
    } catch {
      setResult({ success: 0, errors: ['Network error. Please try again.'] });
    } finally {
      setImporting(false);
    }
  };

  const tpl = TEMPLATES[importType];

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/admin/events/${params.id}`)}
              className="btn-secondary p-2" aria-label="Back">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">CSV Import</h1>
              <p className="text-xs text-[var(--text-muted)]">Bulk import contestants or judges</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Type selector */}
        <div className="card">
          <h2 className="font-semibold text-[var(--text-primary)] mb-3 text-sm">Import Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['contestants', 'judges'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setImportType(t); setRows([]); setResult(null); setFileName(''); }}
                className={`py-3 rounded-xl text-sm font-medium border transition-all duration-200 capitalize ${
                  importType === t
                    ? 'bg-gold-50 dark:bg-gold-900/20 border-gold-400 text-gold-700 dark:text-gold-400'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
                }`}
              >
                {t === 'contestants' ? '👸 Contestants' : '⚖️ Judges'}
              </button>
            ))}
          </div>
        </div>

        {/* Template download + format guide */}
        <div className="card">
          <div className="flex items-start justify-between mb-3">
            <h2 className="font-semibold text-[var(--text-primary)] text-sm">CSV Format</h2>
            <button onClick={downloadTemplate} className="btn-secondary py-1.5 px-3 text-xs">
              Download Template
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="table-header">
                  {tpl.headers.map(h => (
                    <th key={h} className="px-3 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--border)]">
                  {tpl.example.map((v, i) => (
                    <td key={i} className="px-3 py-2 text-[var(--text-secondary)] font-mono">{v}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {importType === 'judges' && (
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Email and password are optional. If omitted, the judge won't have a login account.
            </p>
          )}
        </div>

        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`card cursor-pointer text-center transition-all duration-200 ${
            dragOver
              ? 'border-gold-400 bg-gold-50 dark:bg-gold-900/10'
              : 'border-dashed hover:border-[var(--text-muted)]'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
          <div className="py-6">
            <svg className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {fileName ? (
              <p className="text-sm font-medium text-[var(--text-primary)]">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-[var(--text-primary)]">Drop CSV file here</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">or click to browse</p>
              </>
            )}
          </div>
        </div>

        {/* Preview table */}
        <AnimatePresence>
          {rows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-[var(--text-primary)] text-sm">
                  Preview <span className="text-[var(--text-muted)] font-normal">({rows.length} rows)</span>
                </h2>
                <button onClick={() => { setRows([]); setFileName(''); }} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  Clear
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)] max-h-60">
                <table className="w-full text-xs">
                  <thead className="sticky top-0">
                    <tr className="table-header">
                      <th className="px-3 py-2 text-left">#</th>
                      {tpl.headers.map(h => (
                        <th key={h} className="px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--bg-muted)] transition-colors">
                        <td className="px-3 py-2 text-[var(--text-muted)]">{i + 2}</td>
                        {tpl.headers.map(h => (
                          <td key={h} className="px-3 py-2 text-[var(--text-primary)] font-mono">
                            {row[h] || <span className="text-[var(--text-muted)] italic">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {rows.length > 20 && (
                      <tr className="border-t border-[var(--border)]">
                        <td colSpan={tpl.headers.length + 1} className="px-3 py-2 text-center text-[var(--text-muted)]">
                          …and {rows.length - 20} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="btn-primary py-2.5 px-6 text-sm disabled:opacity-50"
                >
                  {importing ? 'Importing…' : `Import ${rows.length} ${importType}`}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {result.success > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                      {result.success} {importType} imported successfully
                    </p>
                    <button
                      onClick={() => router.push(`/admin/events/${params.id}`)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5"
                    >
                      Go back to event →
                    </button>
                  </div>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                  <p className="font-semibold text-rose-700 dark:text-rose-400 text-sm mb-2">
                    {result.errors.length} error{result.errors.length > 1 ? 's' : ''}
                  </p>
                  <ul className="space-y-1">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-rose-600 dark:text-rose-400">{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
