import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileJson, X, Plus, FileText } from 'lucide-react';
import { Stage1JSON } from '../../types/stage1.types';
import { ParsedFile } from '../../utils/jsonMerger';

interface JsonInputProps {
  onJsonLoad: (input: string | ParsedFile[]) => void;
}

export function JsonInput({ onJsonLoad }: JsonInputProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For multi-file management
  const [uploadedFiles, setUploadedFiles] = useState<ParsedFile[]>([]);
  const [pasteTabs, setPasteTabs] = useState<{ id: number; content: string }[]>([
    { id: 1, content: '' }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);

  const processFileContent = (name: string, content: string): ParsedFile | null => {
    try {
      let jsonContent = content;
      // If direct parse fails, try to extract JSON object
      try {
        JSON.parse(content);
      } catch {
        // Try to find the first { and last }
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonContent = content.substring(firstBrace, lastBrace + 1);
        }
      }

      const parsed = JSON.parse(jsonContent) as Stage1JSON;
      // Basic type detection
      let type: 'main' | 'asset' | 'unknown' = 'unknown';
      if (parsed.current_step === 'scenario_development' || (parsed.current_work as any)?.scenario) {
        type = 'main';
      } else if (parsed.current_step === 'asset_addition' || Object.keys(parsed.visual_blocks || {}).length > 0) {
        type = 'asset';
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        name,
        content: jsonContent,
        parsed,
        type,
        filmId: parsed.film_id || 'UNKNOWN'
      };
    } catch (e) {
      console.error(`Failed to parse ${name}`, e);
      return null;
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = (files: File[]) => {
    const jsonFiles = files.filter(file => file.type === 'application/json' || file.name.endsWith('.json'));

    // Process each file
    let processedCount = 0;
    const newParsedFiles: ParsedFile[] = [];
    const failedFiles: { name: string, content: string }[] = [];

    jsonFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parsedFile = processFileContent(file.name, content);
        if (parsedFile) {
          newParsedFiles.push(parsedFile);
        } else {
          failedFiles.push({ name: file.name, content });
        }
        processedCount++;

        // When all files are processed
        if (processedCount === jsonFiles.length) {
          // Case 1: Single file uploaded and it failed -> Open Editor
          if (jsonFiles.length === 1 && failedFiles.length === 1) {
            onJsonLoad(failedFiles[0].content);
            return;
          }

          // Case 2: Multi-file partial failures
          if (failedFiles.length > 0) {
            alert(`${failedFiles.length}개의 파일이 유효하지 않은 JSON이라 제외되었습니다.\n(단일 파일 업로드 시 에디터에서 수정 가능합니다)`);
          }

          if (newParsedFiles.length > 0) {
            if (newParsedFiles.length === 1 && uploadedFiles.length === 0 && failedFiles.length === 0) {
              // Single valid file -> Direct load (as ParsedFile array for consistency in App.tsx if it handles it, 
              // BUT check App.tsx: if we pass array, it merges. If we want single file behavior, maybe pass string?
              // Actually, previous logic passed array. App.tsx handles array by merging. 
              // If we want 'MetadataView' etc, mergeJsonFiles should handle single file array correctly.
              onJsonLoad(newParsedFiles);
            } else {
              setUploadedFiles(prev => [...prev, ...newParsedFiles]);
            }
          }
        }
      };
      reader.readAsText(file);
    });
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleMerge = () => {
    onJsonLoad(uploadedFiles);
  };

  const handlePasteSubmit = () => {
    const validInputs = pasteTabs
      .map((tab, index) => ({ name: `Pasted JSON ${index + 1}`, content: tab.content }))
      .filter(input => input.content.trim() !== '');

    if (validInputs.length === 0) {
      alert('입력된 JSON 내용이 없습니다.');
      return;
    }

    const newParsedFiles: ParsedFile[] = [];
    const failedInputs: { name: string, content: string }[] = [];

    validInputs.forEach(input => {
      const parsedFile = processFileContent(input.name, input.content);
      if (parsedFile) {
        newParsedFiles.push(parsedFile);
      } else {
        failedInputs.push(input);
      }
    });

    // Case 1: Single paste and it failed -> Open Editor!
    if (validInputs.length === 1 && failedInputs.length === 1) {
      onJsonLoad(failedInputs[0].content);
      setShowPasteModal(false);
      setPasteTabs([{ id: 1, content: '' }]);
      setActiveTabId(1);
      return;
    }

    if (failedInputs.length > 0) {
      alert(`${failedInputs.length}개의 탭에서 유효하지 않은 JSON이 발견되어 제외되었습니다.`);
    }

    // Combine with existing uploaded files
    const allFiles = [...uploadedFiles, ...newParsedFiles];

    if (allFiles.length > 0) {
      onJsonLoad(allFiles);
      setShowPasteModal(false);
      // Reset tabs
      setPasteTabs([{ id: 1, content: '' }]);
      setActiveTabId(1);
    } else if (failedInputs.length !== 1) { // If it wasn't the single file case handled above
      alert('유효한 JSON 파일이 없어 병합할 수 없습니다.');
      // Do not close modal so user can fix inputs
    }
  };

  const addTab = () => {
    const newId = Math.max(...pasteTabs.map(t => t.id), 0) + 1;
    setPasteTabs([...pasteTabs, { id: newId, content: '' }]);
    setActiveTabId(newId);
  };

  const updateTabContent = (id: number, content: string) => {
    setPasteTabs(pasteTabs.map(tab => tab.id === id ? { ...tab, content } : tab));
  };

  const removeTab = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pasteTabs.length === 1) return;
    const newTabs = pasteTabs.filter(t => t.id !== id);
    setPasteTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[0].id);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div
        className={`w-full max-w-2xl p-12 rounded-xl border-2 border-dashed transition-all ${isDragActive
          ? 'border-accent-purple bg-accent-purple/10'
          : 'border-white/10 hover:border-accent-purple/50 bg-bg-secondary/50'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-full bg-bg-secondary border border-white/10">
            <Upload className="w-8 h-8 text-accent-purple" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              JSON 파일 업로드
            </h3>
            <p className="text-gray-400">
              드래그 앤 드롭 또는 클릭하여 파일 선택<br />
              <span className="text-sm text-gray-500">
                (파일 병합 시 여러 개의 파일을 한번에 끌어다 놓으세요)
              </span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors font-medium"
            >
              파일 선택
            </button>
            <button
              onClick={() => setShowPasteModal(true)}
              className="px-6 py-2.5 bg-bg-secondary text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors font-medium"
            >
              직접 입력
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileInput}
          className="hidden"
          multiple
        />
      </div>

      {/* File List for Merge */}
      {uploadedFiles.length > 0 && (
        <div className="w-full max-w-2xl mt-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">업로드된 파일 ({uploadedFiles.length})</h4>
            <button
              onClick={handleMerge}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
            >
              <FileJson className="w-4 h-4" />
              병합 및 보기
            </button>
          </div>
          <div className="grid gap-3">
            {uploadedFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-bg-secondary border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${file.type === 'main' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{file.name}</div>
                    <div className="text-xs text-gray-400">
                      ID: {file.filmId} | Type: {file.type === 'main' ? 'Main Scenario' : 'Asset/Block'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-bg-secondary border border-white/10 rounded-xl shadow-2xl flex flex-col h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">JSON 직접 입력</h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center px-4 pt-4 gap-2 overflow-x-auto">
              {pasteTabs.map((tab, index) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`
                    group relative flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer border-t border-x border-transparent
                    ${activeTabId === tab.id
                      ? 'bg-bg-primary border-white/10 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'}
                  `}
                >
                  <span className="text-sm font-medium">JSON {index + 1}</span>
                  {pasteTabs.length > 1 && (
                    <button
                      onClick={(e) => removeTab(tab.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addTab}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 bg-bg-primary border-t border-white/10" style={{ height: '600px' }}>
              <textarea
                value={pasteTabs.find(t => t.id === activeTabId)?.content || ''}
                onChange={(e) => updateTabContent(activeTabId, e.target.value)}
                placeholder="여기에 JSON을 붙여넣으세요..."
                className="w-full h-full bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-white/10">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handlePasteSubmit}
                className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors"
              >
                완료 및 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
