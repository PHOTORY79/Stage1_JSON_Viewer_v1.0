import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Copy, Check, RefreshCw, Wand2 } from 'lucide-react';
import { ValidationError } from '../../types/stage1.types';
import { generateErrorPrompt, autoFixJson } from '../../utils/jsonParser';

interface JsonEditorProps {
  jsonInput: string;
  errors: ValidationError[];
  onJsonUpdate: (json: string) => void;
  onValidate: (json: string) => void;
}

export function JsonEditor({ jsonInput, errors, onJsonUpdate, onValidate }: JsonEditorProps) {
  const [editedJson, setEditedJson] = useState(jsonInput);
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const textRef = useRef<HTMLTextAreaElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    setEditedJson(jsonInput);
  }, [jsonInput]);

  // Validation feedback
  useEffect(() => {
    if (isRetrying) {
      if (errors.length > 0) {
        showMessage(`검증 실패: 여전히 ${errors.length}개의 오류가 있습니다.`, 'error');
      }
      setIsRetrying(false);
    }
  }, [errors]);

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCopyPrompt = async () => {
    const prompt = generateErrorPrompt(errors, jsonInput);
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoFix = () => {
    const result = autoFixJson(editedJson);
    if (result.fixed) {
      setEditedJson(result.json);
      showMessage(`자동 수정 성공: ${result.fixes.join(', ')}`, 'success');
    } else {
      showMessage('자동 수정할 수 있는 패턴을 찾지 못했습니다.', 'error');
    }
  };

  const handleApply = () => {
    onJsonUpdate(editedJson);
    setIsRetrying(true);
    onValidate(editedJson);
    showMessage('검증을 다시 시도합니다...', 'info');
  };

  const handleScroll = () => {
    if (textRef.current && lineRef.current) {
      lineRef.current.scrollTop = textRef.current.scrollTop;
    }
  };

  const syntaxErrors = errors.filter(e => e.type === 'syntax' && e.severity === 'error');

  return (
    <div className="w-full max-w-5xl mx-auto p-6 animate-fadeIn relative">
      {/* Toast Message */}
      {message && (
        <div className={`absolute top-4 right-6 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all z-50
          ${message.type === 'success' ? 'bg-green-500/90 text-white' :
            message.type === 'error' ? 'bg-red-500/90 text-white' :
              'bg-blue-500/90 text-white'}`}
        >
          {message.text}
        </div>
      )}

      {/* Error Summary */}
      <div className="bg-accent-red/10 border border-accent-red/30 rounded-2xl p-5 mb-6 flex-shrink-0">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-red/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-accent-red" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-accent-red text-lg mb-2">
              JSON 파싱 오류 {syntaxErrors.length}건
            </h3>
            <ul className="space-y-1.5 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
              {syntaxErrors.map((error, index) => (
                <li key={index} className="text-sm text-text-secondary flex items-start gap-2">
                  <span className="text-accent-red font-mono">{error.path || 'Error'}:</span>
                  <span>{error.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Error Context - Moved Up */}
      {syntaxErrors.some(e => e.suggestion) && (
        <div className="mb-6 bg-bg-secondary rounded-2xl p-5 border border-border-color flex-shrink-0">
          <h4 className="text-sm font-medium text-text-secondary mb-3">오류 위치 참고</h4>
          {syntaxErrors.filter(e => e.suggestion).map((error, index) => (
            <pre key={index} className="text-xs font-mono text-text-secondary/80 whitespace-pre-wrap bg-bg-primary rounded-xl p-4">
              {error.suggestion}
            </pre>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4 flex-shrink-0">
        <button
          onClick={handleAutoFix}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl
            border border-accent-purple text-accent-purple
            hover:bg-accent-purple/10 transition-all duration-200"
        >
          <Wand2 className="w-4 h-4" />
          <span className="text-sm font-medium">자동 수정 시도</span>
        </button>

        <button
          onClick={handleCopyPrompt}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl
            border border-border-color text-text-secondary
            hover:border-accent-purple hover:text-white transition-all duration-200"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-accent-green" />
              <span className="text-sm font-medium text-accent-green">복사됨!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">오류 프롬프트 복사</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Container */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary font-medium">JSON 직접 수정</span>
            <span className="text-xs text-text-secondary/60 font-mono">
              {editedJson.length.toLocaleString()} characters
            </span>
          </div>

          {/* Re-validate Button */}
          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg
              bg-gradient-to-r from-accent-purple to-accent-purple-dark text-white
              shadow-lg shadow-accent-purple/25 hover:shadow-accent-purple/40 hover:scale-[1.02]
              transition-all duration-200 font-medium text-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>다시 검증</span>
          </button>
        </div>

        {/* Editor Area with Line Numbers - Fixed Syntax here */}
        <div className="flex min-h-0 relative border border-border-color rounded-2xl bg-bg-primary overflow-hidden"
          style={{ height: '50vh', minHeight: '400px' }}>

          {/* Line Numbers */}
          <div
            ref={lineRef}
            className="flex-shrink-0 w-12 py-5 pr-2 text-right font-mono text-sm text-gray-500 bg-bg-secondary select-none overflow-hidden"
            style={{ lineHeight: '1.625' }}
          >
            {Array.from({ length: editedJson.split('\n').length }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={textRef}
            value={editedJson}
            onChange={(e) => setEditedJson(e.target.value)}
            onScroll={handleScroll}
            className="flex-1 w-full h-full bg-transparent p-5
              text-white font-mono text-sm leading-relaxed resize-none
              focus:outline-none whitespace-pre overflow-x-auto"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
