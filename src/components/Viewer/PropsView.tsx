import { useState } from 'react';
import { Package, Copy, Check, ChevronDown, ChevronUp, Send, Columns } from 'lucide-react';
import { formatBlocksToPrompt } from '../../utils/promptFormatter';
import { Stage1JSON, Prop } from '../../types/stage1.types';

interface PropsViewProps {
  data: Stage1JSON;
}

export function PropsView({ data }: PropsViewProps) {
  const { props } = data.visual_blocks;
  const [expandedProp, setExpandedProp] = useState<string | null>(
    props[0]?.id || null
  );
  const [editedBlocks, setEditedBlocks] = useState<Record<string, string>>({});
  const [modificationRequests, setModificationRequests] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleProp = (propId: string) => {
    setExpandedProp(expandedProp === propId ? null : propId);
  };

  const formatBlocks = (blocks: Record<string, string>) => {
    return Object.entries(blocks)
      .map(([key, value]) => `${key}: ${value || '(empty)'}`)
      .join('\n');
  };

  const copyBlocks = async (prop: Prop) => {
    // OLD: const text = formatBlocks(prop.blocks);
    // NEW: Use the utility format
    const text = formatBlocksToPrompt(prop.blocks);
    await navigator.clipboard.writeText(text);
    setCopiedId(`copy-${prop.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopy = (prop: Prop) => {
    // Format the blocks using the utility
    const textToCopy = formatBlocksToPrompt(prop.blocks);

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(prop.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generatePrompt = (prop: Prop) => {
    const editedText = editedBlocks[prop.id] || '';
    const modRequest = modificationRequests[prop.id] || '';

    return `[Stage 1 소품 블록 수정 요청]

■ 대상
- Prop ID: ${prop.id}
- Prop Name: ${prop.name}

■ 수정 요청사항
${modRequest || '(수정 요청사항을 입력해주세요)'}

■ 현재 블록 데이터
${formatBlocks(prop.blocks)}

■ Prop Detail
${prop.prop_detail}

${editedText ? `■ 참고: 사용자 수정안/번역
${editedText}` : ''}

■ 요청
위 수정 요청을 반영하여 소품 블록을 업데이트해주세요.
prop_detail 필드도 블록 변경에 맞게 업데이트해주세요.`;
  };

  const copyPrompt = async (prop: Prop) => {
    const prompt = generatePrompt(prop);
    await navigator.clipboard.writeText(prompt);
    setCopiedId(`prompt-${prop.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/30 to-amber-600/10 
          flex items-center justify-center border border-orange-500/20">
          <Package className="w-7 h-7 text-orange-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">Props</h2>
          <p className="text-text-secondary">
            {props.length} props • 21 blocks each
          </p>
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Columns className="w-4 h-4" />
          <span>2열 비교 뷰</span>
        </div>
      </div>

      {/* Props */}
      <div className="space-y-4">
        {props.map((prop) => {
          const isExpanded = expandedProp === prop.id;

          return (
            <div
              key={prop.id}
              className="bg-bg-secondary rounded-2xl border border-border-color overflow-hidden
                hover:border-orange-500/30 transition-all duration-200"
            >
              {/* Prop Header */}
              <button
                onClick={() => toggleProp(prop.id)}
                className="w-full flex items-center justify-between p-5 
                  hover:bg-bg-tertiary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/40 to-amber-600/40 
                    flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Package className="w-7 h-7 text-orange-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-white">
                      {prop.name}
                    </div>
                    <div className="text-sm text-text-secondary font-mono">{prop.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyBlocks(prop);
                    }}
                    className="p-2.5 rounded-xl hover:bg-bg-tertiary transition-colors"
                    title="블록 전체 복사"
                  >
                    {copiedId === `copy-${prop.id}` ? (
                      <Check className="w-5 h-5 text-accent-green" />
                    ) : (
                      <Copy className="w-5 h-5 text-text-secondary" />
                    )}
                  </button>
                  <div className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-orange-500/20' : ''}`}>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-orange-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-secondary" />
                    )}
                  </div>
                </div>
              </button>

              {/* Summary */}
              <div className="px-5 pb-4 -mt-1">
                <span className="text-xs text-text-secondary bg-bg-tertiary/80 px-3 py-1.5 rounded-lg">
                  {prop.prop_detail}
                </span>
              </div>

              {/* Expanded Content - 2열 구조 */}
              {isExpanded && (
                <div className="border-t border-border-color">
                  {/* 2 Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* 원본 블록 */}
                    <div className="p-5 lg:border-r border-border-color">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📖</span>
                          <span className="text-sm font-semibold text-white">원본 블록 (21개)</span>
                        </div>
                        <button
                          onClick={() => copyBlocks(prop)}
                          className="text-xs text-orange-400 hover:text-orange-300 
                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-orange-500/10 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          전체 복사
                        </button>
                      </div>
                      <div className="bg-bg-primary rounded-xl p-4 max-h-[400px] overflow-y-auto border border-border-color">
                        <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-loose">
                          {formatBlocks(prop.blocks)}
                        </pre>
                      </div>
                    </div>

                    {/* 수정/번역 블록 */}
                    <div className="p-5 border-t lg:border-t-0 border-border-color">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">✏️</span>
                        <span className="text-sm font-semibold text-white">수정/번역 블록</span>
                      </div>
                      <textarea
                        value={editedBlocks[prop.id] || ''}
                        onChange={(e) => setEditedBlocks(prev => ({
                          ...prev,
                          [prop.id]: e.target.value
                        }))}
                        placeholder="번역 결과를 붙여넣거나&#10;수정할 블록을 작성하세요..."
                        className="w-full bg-bg-primary border border-border-color rounded-xl p-4
                          min-h-[200px] max-h-[400px] text-white text-xs font-mono
                          placeholder:text-text-secondary/40 resize-none leading-loose
                          focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  {/* 수정 요청 + 프롬프트 생성 */}
                  <div className="p-5 bg-bg-tertiary/30 border-t border-border-color">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">💬</span>
                      <span className="text-sm font-semibold text-white">수정 요청사항</span>
                    </div>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={modificationRequests[prop.id] || ''}
                        onChange={(e) => setModificationRequests(prev => ({
                          ...prev,
                          [prop.id]: e.target.value
                        }))}
                        placeholder="예: 색상 변경, 크기 수정, 디테일 추가..."
                        className="flex-1 bg-bg-primary border border-border-color rounded-xl px-5 py-3
                          text-white text-sm placeholder:text-text-secondary/40
                          focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                      <button
                        onClick={() => handleCopy(prop)}
                        className="flex items-center gap-2.5 px-6 py-3 rounded-xl
                          bg-gradient-to-r from-accent-purple to-accent-purple-dark
                          text-white font-medium shadow-lg shadow-accent-purple/25 
                          hover:shadow-accent-purple/40 hover:scale-[1.02] transition-all"
                      >
                        {copiedId === prop.id ? (
                          <>
                            <Check className="w-5 h-5" />
                            <span>복사됨!</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            <span>프롬프트 복사</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
