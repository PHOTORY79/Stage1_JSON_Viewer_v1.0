import { useState } from 'react';
import { AlertCircle, CheckCircle, Info, Copy, Check, AlertTriangle, Shield } from 'lucide-react';
import { ValidationResult } from '../../types/stage1.types';

interface ValidationPanelProps {
  result: ValidationResult;
}

export function ValidationPanel({ result }: ValidationPanelProps) {
  const [copied, setCopied] = useState(false);

  const errorCount = result.errors.filter(e => e.severity === 'error').length;
  const warningCount = result.errors.filter(e => e.severity === 'warning').length;
  const infoCount = result.errors.filter(e => e.severity === 'info').length;

  const copyAllErrors = async () => {
    const errorText = result.errors
      .map(e => `[${e.severity.toUpperCase()}] ${e.path ? `${e.path}: ` : ''}${e.message}`)
      .join('\n');
    
    const prompt = `[Stage 1 JSON 검증 결과]

■ 요약
- 오류: ${errorCount}건
- 경고: ${warningCount}건
- 정보: ${infoCount}건

■ 상세 내용
${errorText}

■ 요청
위 문제들을 수정한 JSON을 출력해주세요.`;

    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-accent-red" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <Info className="w-5 h-5 text-text-secondary" />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-accent-red/10 border-accent-red/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30';
      default:
        return 'bg-bg-tertiary border-border-color';
    }
  };

  return (
    <div className="p-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border
            ${result.isValid 
              ? 'bg-accent-green/20 border-accent-green/30' 
              : 'bg-accent-red/20 border-accent-red/30'}`}>
            {result.isValid ? (
              <CheckCircle className="w-7 h-7 text-accent-green" />
            ) : (
              <Shield className="w-7 h-7 text-accent-red" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Validation</h2>
            <p className="text-text-secondary">
              {result.isValid ? 'All checks passed' : 'Issues found'}
            </p>
          </div>
        </div>

        {result.errors.length > 0 && (
          <button
            onClick={copyAllErrors}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
              border border-border-color text-text-secondary
              hover:border-accent-purple hover:text-white transition-all"
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
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className={`rounded-2xl p-5 border ${errorCount > 0 ? 'bg-accent-red/10 border-accent-red/30' : 'bg-bg-secondary border-border-color'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className={`w-5 h-5 ${errorCount > 0 ? 'text-accent-red' : 'text-text-secondary'}`} />
            <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Errors</span>
          </div>
          <div className={`text-3xl font-bold ${errorCount > 0 ? 'text-accent-red' : 'text-white'}`}>
            {errorCount}
          </div>
        </div>

        <div className={`rounded-2xl p-5 border ${warningCount > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-bg-secondary border-border-color'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-5 h-5 ${warningCount > 0 ? 'text-yellow-500' : 'text-text-secondary'}`} />
            <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Warnings</span>
          </div>
          <div className={`text-3xl font-bold ${warningCount > 0 ? 'text-yellow-500' : 'text-white'}`}>
            {warningCount}
          </div>
        </div>

        <div className={`rounded-2xl p-5 border ${infoCount > 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-bg-secondary border-border-color'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Info className={`w-5 h-5 ${infoCount > 0 ? 'text-blue-400' : 'text-text-secondary'}`} />
            <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Info</span>
          </div>
          <div className={`text-3xl font-bold ${infoCount > 0 ? 'text-blue-400' : 'text-white'}`}>
            {infoCount}
          </div>
        </div>
      </div>

      {/* Auto-fix notification */}
      {result.autoFixed && (
        <div className="bg-accent-green/10 border border-accent-green/30 rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-green/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <div className="text-base font-semibold text-accent-green">
                자동 수정 적용됨
              </div>
              <div className="text-sm text-text-secondary mt-0.5">
                {result.fixCount}개의 문법 오류가 자동으로 수정되었습니다.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error List */}
      {result.errors.length > 0 ? (
        <div className="space-y-3">
          {result.errors.map((error, index) => (
            <div 
              key={index}
              className={`rounded-2xl p-5 border ${getSeverityStyle(error.severity)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(error.severity)}
                </div>
                <div className="flex-1">
                  {error.path && (
                    <div className="text-xs font-mono text-text-secondary mb-1.5">
                      {error.path}
                    </div>
                  )}
                  <div className="text-sm text-white">{error.message}</div>
                  {error.suggestion && (
                    <pre className="mt-3 text-xs font-mono text-text-secondary/80 
                      bg-bg-primary rounded-xl p-4 overflow-x-auto">
                      {error.suggestion}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-bg-secondary rounded-2xl border border-border-color p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-accent-green/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-accent-green" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            All checks passed!
          </h3>
          <p className="text-text-secondary">
            JSON 문법, 스키마, 구조 모두 정상입니다.
          </p>
        </div>
      )}
    </div>
  );
}
