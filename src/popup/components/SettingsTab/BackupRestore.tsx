/**
 * BackupRestore - Component for import/export settings.
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload } from 'lucide-react';

export interface BackupRestoreProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  importStatus?: string | null;
}

export function BackupRestore({ onExport, onImport, importStatus }: BackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onImport(event);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">Backup & Restore</h3>

      <div className="flex gap-2">
        <motion.button
          onClick={onExport}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-dl-card border border-dl-border hover:border-dl-primary text-slate-300 hover:text-white rounded-lg transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-4 h-4" />
          Export
        </motion.button>

        <motion.button
          onClick={handleImportClick}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-dl-card border border-dl-border hover:border-dl-primary text-slate-300 hover:text-white rounded-lg transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Upload className="w-4 h-4" />
          Import
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {importStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs text-center py-2 rounded ${
            importStatus.includes('success')
              ? 'text-green-400 bg-green-500/10'
              : 'text-red-400 bg-red-500/10'
          }`}
        >
          {importStatus}
        </motion.div>
      )}
    </div>
  );
}
