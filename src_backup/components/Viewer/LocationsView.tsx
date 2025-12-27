import { useState } from 'react';
import { MapPin, Copy, Check, ChevronDown, ChevronUp, Send, Columns } from 'lucide-react';
import { formatBlocksToPrompt } from '../../utils/promptFormatter';
import { Stage1JSON, Location } from '../../types/stage1.types';

interface LocationsViewProps {
  data: Stage1JSON;
}

export function LocationsView({ data }: LocationsViewProps) {
  const { locations } = data.visual_blocks;
  const [expandedLoc, setExpandedLoc] = useState<string | null>(
    locations[0]?.id || null
  );
  const [editedBlocks, setEditedBlocks] = useState<Record<string, string>>({});
  const [modificationRequests, setModificationRequests] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleLocation = (locId: string) => {
    setExpandedLoc(expandedLoc === locId ? null : locId);
  };

  const formatBlocks = (blocks: Record<string, string>) => {
    return Object.entries(blocks)
      .map(([key, value]) => `${key}: ${value || '(empty)'}`)
      .join('\n');
  };

  const handleCopy = (loc: Location) => {
    // Format the blocks using the utility
    const textToCopy = formatBlocksToPrompt(loc.blocks);

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(loc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generatePrompt = (loc: Location) => {
    const editedText = editedBlocks[loc.id] || '';
    const modRequest = modificationRequests[loc.id] || '';

    return `[Stage 1 장소 블록 수정 요청]

■ 대상
- Location ID: ${loc.id}
- Location Name: ${loc.name}

■ 수정 요청사항
${modRequest || '(수정 요청사항을 입력해주세요)'}

■ 현재 블록 데이터
${formatBlocks(loc.blocks)}

${editedText ? `■ 참고: 사용자 수정안/번역
${editedText}` : ''}

■ 요청
위 수정 요청을 반영하여 장소 블록을 업데이트해주세요.`;
  };

  const copyPrompt = async (loc: Location) => {
    const prompt = generatePrompt(loc);
    await navigator.clipboard.writeText(prompt);
    setCopiedId(`prompt-${loc.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-600/10 
          flex items-center justify-center border border-green-500/20">
          <MapPin className="w-7 h-7 text-green-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">Locations</h2>
          <p className="text-text-secondary">
            {locations.length} locations • 28 blocks each
          </p>
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Columns className="w-4 h-4" />
          <span>2열 비교 뷰</span>
        </div>
      </div>

      {/* Locations */}
      <div className="space-y-4">
        {locations.map((loc) => {
          const isExpanded = expandedLoc === loc.id;

          return (
            <div
              key={loc.id}
              className="bg-bg-secondary rounded-2xl border border-border-color overflow-hidden
                hover:border-green-500/30 transition-all duration-200"
            >
              {/* Location Header */}
              <button
                onClick={() => toggleLocation(loc.id)}
                className="w-full flex items-center justify-between p-5 
                  hover:bg-bg-tertiary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/40 to-emerald-600/40 
                    flex items-center justify-center shadow-lg shadow-green-500/20">
                    <MapPin className="w-7 h-7 text-green-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-white">
                      {loc.name}
                    </div>
                    <div className="text-sm text-text-secondary font-mono">{loc.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(loc);
                    }}
                    className="p-2.5 rounded-xl hover:bg-bg-tertiary transition-colors"
                    title="블록 전체 복사"
                  >
                    {copiedId === loc.id ? (
                      <Check className="w-5 h-5 text-accent-green" />
                    ) : (
                      <Copy className="w-5 h-5 text-text-secondary" />
                    )}
                  </button>
                  <div className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-green-500/20' : ''}`}>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-secondary" />
                    )}
                  </div>
                </div>
              </button>

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
                          <span className="text-sm font-semibold text-white">원본 블록 (28개)</span>
                        </div>
                        <button
                          onClick={() => handleCopy(loc)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-bg-tertiary hover:bg-white/10 rounded-lg transition-colors border border-white/5"
                        >
                          {copiedId === loc.id ? (
                            <>
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-green-500">복사됨</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300">프롬프트 복사</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-bg-primary rounded-xl p-4 max-h-[400px] overflow-y-auto border border-border-color">
                        <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-loose">
                          {formatBlocks(loc.blocks)}
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
                        value={editedBlocks[loc.id] || ''}
                        onChange={(e) => setEditedBlocks(prev => ({
                          ...prev,
                          [loc.id]: e.target.value
                        }))}
                        placeholder="번역 결과를 붙여넣거나&#10;수정할 블록을 작성하세요..."
                        className="w-full bg-bg-primary border border-border-color rounded-xl p-4
                          min-h-[200px] max-h-[400px] text-white text-xs font-mono
                          placeholder:text-text-secondary/40 resize-none leading-loose
                          focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
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
                        value={modificationRequests[loc.id] || ''}
                        onChange={(e) => setModificationRequests(prev => ({
                          ...prev,
                          [loc.id]: e.target.value
                        }))}
                        placeholder="예: 분위기를 더 어둡게, 날씨를 비오는 날로 변경..."
                        className="flex-1 bg-bg-primary border border-border-color rounded-xl px-5 py-3
                          text-white text-sm placeholder:text-text-secondary/40
                          focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      />
                      <button
                        onClick={() => copyPrompt(loc)}
                        className="flex items-center gap-2.5 px-6 py-3 rounded-xl
                          bg-gradient-to-r from-green-500 to-emerald-600
                          text-white font-medium shadow-lg shadow-green-500/25 
                          hover:shadow-green-500/40 hover:scale-[1.02] transition-all"
                      >
                        {copiedId === `prompt-${loc.id}` ? (
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
