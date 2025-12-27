import { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle, Info, Copy, Check, AlertTriangle, Shield, XCircle, Minus } from 'lucide-react';
import { ValidationResult, ValidationError, ErrorCategory } from '../../types/stage1.types';

interface ValidationPanelProps {
  result: ValidationResult;
}

export function ValidationPanel({ result }: ValidationPanelProps) {
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ErrorCategory | 'all'>('all');

  // Group errors by category
  const groupedErrors = useMemo(() => {
    const groups: Record<ErrorCategory, ValidationError[]> = {
      essential: [],
      story: [],
      visual: [],
      schema: [],
      other: []
    };

    result.errors.forEach(err => {
      const cat = err.category || 'other'; // fallback
      if (groups[cat]) {
        groups[cat].push(err);
      } else {
        groups['other'].push(err);
      }
    });

    return groups;
  }, [result.errors]);

  const getCategoryStatus = (category: ErrorCategory, errors: ValidationError[]) => {
    if (errors.length === 0) return 'pass';
    const hasError = errors.some(e => e.severity === 'error');
    return hasError ? 'fail' : 'warning';
  };

  const getCardStyle = (category: ErrorCategory, isSelected: boolean) => {
    const errors = groupedErrors[category];
    const status = getCategoryStatus(category, errors);
    const baseStyle = "relative p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02]";

    let colorStyle = "";
    if (status === 'pass') colorStyle = "bg-accent-green/10 border-accent-green/30";
    else if (status === 'fail') colorStyle = "bg-accent-red/10 border-accent-red/30";
    else colorStyle = "bg-yellow-500/10 border-yellow-500/30";

    const selectedStyle = isSelected ? "ring-2 ring-accent-purple shadow-lg shadow-accent-purple/20" : "opacity-90 hover:opacity-100";

    return `${baseStyle} ${colorStyle} ${selectedStyle}`;
  };

  const renderStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    if (status === 'pass') return <CheckCircle className="w-5 h-5 text-accent-green" />;
    if (status === 'fail') return <XCircle className="w-5 h-5 text-accent-red" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  const filteredErrors = selectedCategory === 'all'
    ? result.errors
    : groupedErrors[selectedCategory];

  const copyFixPrompt = async () => {
    const errorText = filteredErrors
      .map((e, i) => `${i + 1}. ${e.path ? `${e.path}: ` : ''}${e.message}`)
      .join('\n');

    const prompt = `[Stage 1 JSON 검증 오류 수정 요청]

■ 카테고리: ${selectedCategory === 'all' ? '전체' : selectedCategory.toUpperCase()}

■ 오류 목록:
${errorText}

■ 요청:
위 오류를 수정하여 완전한 JSON을 출력해주세요.`;

    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories: { key: ErrorCategory; label: string; subtext: string }[] = [
    { key: 'essential', label: '필수필드', subtext: '4/4' }, // Fixed count for essential
    { key: 'story', label: '스토리', subtext: 'Check' },
    { key: 'visual', label: '비주얼', subtext: '3 items' },
    { key: 'schema', label: '스키마', subtext: 'Type' },
    { key: 'other', label: '기타', subtext: 'Etc' },
  ];

  return (
    <div className="p-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Validation Dashboard</h2>
          <p className="text-text-secondary">
            JSON 데이터의 무결성을 검증합니다.
          </p>
        </div>

        {result.errors.length > 0 && (
          <button
            onClick={copyFixPrompt}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-bg-secondary border border-border-color text-text-secondary
              hover:bg-accent-purple hover:text-white hover:border-accent-purple 
              transition-all duration-200 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>복사됨!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>수정 프롬프트 복사</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {categories.map((cat) => {
          const errors = groupedErrors[cat.key];
          const status = getCategoryStatus(cat.key, errors);
          const isSelected = selectedCategory === cat.key;

          return (
            <div
              key={cat.key}
              onClick={() => setSelectedCategory(isSelected ? 'all' : cat.key)}
              className={getCardStyle(cat.key, isSelected)}
            >
              <div className="flex flex-col items-center justify-center text-center py-2">
                <span className="text-sm text-white/80 font-medium mb-2">{cat.label}</span>
                <div className="flex items-center gap-2 mb-1">
                  {renderStatusIcon(status)}
                  <span className={`text-lg font-bold ${status === 'pass' ? 'text-accent-green' :
                      status === 'fail' ? 'text-accent-red' : 'text-yellow-500'
                    }`}>
                    {status === 'pass' ? 'OK' : `${errors.length}건`}
                  </span>
                </div>
                {/* Optional Subtext Logic */}
                <span className="text-xs text-white/40">
                  {status === 'pass' ? 'Pass' : errors.length + ' Issues'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed List */}
      <div className="bg-bg-secondary/50 rounded-2xl border border-border-color overflow-hidden">
        <div className="p-4 border-b border-border-color bg-bg-secondary flex justify-between items-center">
          <h3 className="font-semibold text-white">
            {selectedCategory === 'all' ? '전체 검증 결과' : `${selectedCategory.toUpperCase()} 검증 결과`}
          </h3>
          <span className="text-sm text-text-secondary">
            {filteredErrors.length} detected
          </span>
        </div>

        {filteredErrors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-green/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-accent-green" />
            </div>
            <p className="text-white font-medium">발견된 문제가 없습니다.</p>
            <p className="text-sm text-text-secondary mt-1">
              해당 카테고리의 모든 검증을 통과했습니다.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-color">
            {filteredErrors.map((error, index) => (
              <div key={index} className="p-4 hover:bg-bg-secondary transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {error.severity === 'error' ? (
                      <XCircle className="w-5 h-5 text-accent-red" />
                    ) : error.severity === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${error.category === 'essential' ? 'bg-purple-500/20 text-purple-300' :
                          error.category === 'story' ? 'bg-blue-500/20 text-blue-300' :
                            error.category === 'visual' ? 'bg-pink-500/20 text-pink-300' :
                              'bg-gray-700 text-gray-300'
                        }`}>
                        {error.category}
                      </span>
                      {error.path && (
                        <span className="text-xs font-mono text-text-secondary truncate">
                          {error.path}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {error.message}
                    </p>
                    {error.suggestion && (
                      <pre className="mt-2 text-xs font-mono text-text-secondary/80 bg-black/20 rounded p-2 overflow-x-auto">
                        {error.suggestion}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
