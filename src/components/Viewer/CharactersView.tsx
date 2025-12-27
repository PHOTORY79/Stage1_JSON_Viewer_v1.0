import { useState } from 'react';
import { Users, Copy, Check, ChevronDown, ChevronUp, Send, Columns } from 'lucide-react';
import { formatBlocksToPrompt } from '../../utils/promptFormatter';
import { Stage1JSON, Character } from '../../types/stage1.types';

interface CharactersViewProps {
  data: Stage1JSON;
}

export function CharactersView({ data }: CharactersViewProps) {
  const { characters } = data.visual_blocks;
  const [expandedChar, setExpandedChar] = useState<string | null>(
    characters[0]?.id || null
  );
  const [editedBlocks, setEditedBlocks] = useState<Record<string, string>>({});
  const [modificationRequests, setModificationRequests] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleCharacter = (charId: string) => {
    setExpandedChar(expandedChar === charId ? null : charId);
  };

  const formatBlocks = (blocks: Record<string, string>) => {
    return Object.entries(blocks)
      .map(([key, value]) => `${key}: ${value || '(empty)'}`)
      .join('\n');
  };

  const handleCopy = (char: Character) => {
    // Format the blocks using the utility
    const textToCopy = formatBlocksToPrompt(char.blocks);

    // Copy logic
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(char.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generatePrompt = (char: Character) => {
    const editedText = editedBlocks[char.id] || '';
    const modRequest = modificationRequests[char.id] || '';

    return `[Stage 1 캐릭터 블록 수정 요청]

■ 대상
- Character ID: ${char.id}
- Character Name: ${char.name}

■ 수정 요청사항
${modRequest || '(수정 요청사항을 입력해주세요)'}

■ 현재 블록 데이터
${formatBlocks(char.blocks)}

■ Character Detail
${char.character_detail}

■ Voice Style
${char.voice_style}

${editedText ? `■ 참고: 사용자 수정안/번역
${editedText}` : ''}

■ 요청
위 수정 요청을 반영하여 캐릭터 블록을 업데이트해주세요.
character_detail 필드도 블록 변경에 맞게 업데이트해주세요.`;
  };

  const copyPrompt = async (char: Character) => {
    const prompt = generatePrompt(char);
    await navigator.clipboard.writeText(prompt);
    setCopiedId(`prompt-${char.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple/30 to-accent-purple/10 
          flex items-center justify-center border border-accent-purple/20">
          <Users className="w-7 h-7 text-accent-purple" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">Characters</h2>
          <p className="text-text-secondary">
            {characters.length} characters • 25 blocks each
          </p>
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Columns className="w-4 h-4" />
          <span>2열 비교 뷰</span>
        </div>
      </div>

      {/* Characters */}
      <div className="space-y-4">
        {characters.map((char) => {
          const isExpanded = expandedChar === char.id;

          return (
            <div
              key={char.id}
              className="bg-bg-secondary rounded-2xl border border-border-color overflow-hidden
                hover:border-accent-purple/30 transition-all duration-200"
            >
              {/* Character Header */}
              <button
                onClick={() => toggleCharacter(char.id)}
                className="w-full flex items-center justify-between p-5 
                  hover:bg-bg-tertiary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-purple/40 to-accent-purple-dark/40 
                    flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-accent-purple/20">
                    {char.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-white">
                      {char.name}
                    </div>
                    <div className="text-sm text-text-secondary font-mono">{char.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPrompt(char);
                    }}
                    className="p-2.5 rounded-xl hover:bg-bg-tertiary transition-colors"
                    title="프롬프트 복사"
                  >
                    {copiedId === `prompt-${char.id}` ? (
                      <Check className="w-5 h-5 text-accent-green" />
                    ) : (
                      <Send className="w-5 h-5 text-text-secondary" />
                    )}
                  </button>
                  <div className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-accent-purple/20' : ''}`}>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-accent-purple" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-secondary" />
                    )}
                  </div>
                </div>
              </button>

              {/* Summary Tags */}
              <div className="px-5 pb-4 -mt-1 flex flex-wrap gap-2">
                <span className="text-xs bg-bg-tertiary/80 px-3 py-1.5 rounded-lg text-text-secondary">
                  🎤 {char.voice_style?.slice(0, 35)}...
                </span>
              </div>

              {/* Expanded Content - 2열 구조 */}
              {isExpanded && (
                <div className="border-t border-border-color">
                  {/* Character Detail */}
                  <div className="p-5 bg-bg-tertiary/30 border-b border-border-color">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📝</span>
                      <span className="text-sm font-semibold text-white">Character Detail</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{char.character_detail}</p>
                  </div>

                  {/* 2 Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* 원본 블록 */}
                    <div className="p-5 lg:border-r border-border-color">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📖</span>
                          <span className="text-sm font-semibold text-white">원본 블록 (25개)</span>
                        </div>
                        <button
                          onClick={() => handleCopy(char)}
                          className="text-xs text-accent-purple hover:text-accent-purple/80 
                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent-purple/10 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          프롬프트 복사
                        </button>
                      </div>
                      <div className="bg-bg-primary rounded-xl p-4 max-h-[400px] overflow-y-auto border border-border-color">
                        <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-loose">
                          {formatBlocks(char.blocks)}
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
                        value={editedBlocks[char.id] || ''}
                        onChange={(e) => setEditedBlocks(prev => ({
                          ...prev,
                          [char.id]: e.target.value
                        }))}
                        placeholder="번역 결과를 붙여넣거나&#10;수정할 블록을 작성하세요...&#10;&#10;예:&#10;12_HAIR: 갈색 웨이브 펌&#10;18_ACCESSORIES: 검정 뿔테 안경"
                        className="w-full bg-bg-primary border border-border-color rounded-xl p-4
                          min-h-[200px] max-h-[400px] text-white text-xs font-mono
                          placeholder:text-text-secondary/40 resize-none leading-loose
                          focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
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
                        value={modificationRequests[char.id] || ''}
                        onChange={(e) => setModificationRequests(prev => ({
                          ...prev,
                          [char.id]: e.target.value
                        }))}
                        placeholder="예: 헤어스타일 변경, 의상을 캐주얼로, 안경 추가..."
                        className="flex-1 bg-bg-primary border border-border-color rounded-xl px-5 py-3
                          text-white text-sm placeholder:text-text-secondary/40
                          focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
                      />
                      <button
                        onClick={() => copyPrompt(char)}
                        className="flex items-center gap-2.5 px-6 py-3 rounded-xl
                          bg-gradient-to-r from-accent-purple to-accent-purple-dark
                          text-white font-medium shadow-lg shadow-accent-purple/25 
                          hover:shadow-accent-purple/40 hover:scale-[1.02] transition-all"
                      >
                        {copiedId === `prompt-${char.id}` ? (
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
