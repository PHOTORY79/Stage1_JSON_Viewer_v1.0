import { Upload, RotateCcw, Download, Film } from 'lucide-react';

interface HeaderProps {
  hasJson: boolean;
  hasValidJson: boolean;
  onUpload: () => void;
  onReset: () => void;
  onDownload: () => void;
  onAppend: () => void;
}

export function Header({ hasJson, hasValidJson, onUpload, onReset, onDownload, onAppend }: HeaderProps) {
  return (
    <header className="h-16 bg-bg-secondary border-b border-border-color flex items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-purple-dark 
          flex items-center justify-center shadow-lg shadow-accent-purple/20">
          <Film className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">AIFI Stage 1 Viewer</h1>
          <p className="text-xs text-text-secondary">AI Film Framework 5.0</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-color 
            text-text-secondary hover:text-white hover:border-accent-purple hover:bg-accent-purple/5
            transition-all duration-200 group"
        >
          <Upload className="w-4 h-4 group-hover:text-accent-purple transition-colors" />
          <span className="text-sm font-medium">Upload</span>
        </button>

        <button
          onClick={onReset}
          disabled={!hasJson}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200
            ${hasJson
              ? 'border-border-color text-text-secondary hover:text-white hover:border-accent-red hover:bg-accent-red/5'
              : 'border-border-color/30 text-text-secondary/30 cursor-not-allowed'
            }`}
          title="모든 입력 초기화"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-medium">Reset</span>
        </button>

        <button
          onClick={onAppend}
          disabled={!hasValidJson} // Only enable append if we have a valid base project
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200
            ${hasValidJson
              ? 'border-border-color text-text-secondary hover:text-white hover:border-accent-purple hover:bg-accent-purple/5'
              : 'border-border-color/30 text-text-secondary/30 cursor-not-allowed'
            }`}
          title="현재 프로젝트에 파일 추가"
        >
          <span className="text-sm font-medium">JSON 추가 (+)</span>
        </button>

        <button
          onClick={onDownload}
          disabled={!hasValidJson}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200
            ${hasValidJson
              ? 'bg-gradient-to-r from-accent-purple to-accent-purple-dark text-white shadow-lg shadow-accent-purple/25 hover:shadow-accent-purple/40 hover:scale-[1.02]'
              : 'bg-bg-tertiary text-text-secondary/40 cursor-not-allowed'
            }`}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Save JSON</span>
        </button>
      </div>
    </header >
  );
}
