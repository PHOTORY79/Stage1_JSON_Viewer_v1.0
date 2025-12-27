import { useState } from 'react';
import { Clapperboard, Copy, Check, ChevronDown, ChevronUp, Send, Columns } from 'lucide-react';
import { Stage1JSON, Scene } from '../../types/stage1.types';

interface ScenarioViewProps {
  data: Stage1JSON;
}

export function ScenarioView({ data }: ScenarioViewProps) {
  const { scenario } = data.current_work;
  const [expandedScene, setExpandedScene] = useState<string | null>(
    scenario.scenes[0]?.scene_id || null
  );
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [modificationRequests, setModificationRequests] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleScene = (sceneId: string) => {
    setExpandedScene(expandedScene === sceneId ? null : sceneId);
  };

  const copyScenario = async (scene: Scene) => {
    await navigator.clipboard.writeText(scene.scenario_text);
    setCopiedId(`copy-${scene.scene_id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generatePrompt = (scene: Scene) => {
    const editedText = editedTexts[scene.scene_id] || '';
    const modRequest = modificationRequests[scene.scene_id] || '';

    return `[Stage 1 시나리오 수정 요청]

■ 대상
- Scene: ${scene.scene_id} (Scene ${scene.scene_number})
- Sequence: ${scene.sequence_id}

■ 수정 요청사항
${modRequest || '(수정 요청사항을 입력해주세요)'}

■ 원본 시나리오
${scene.scenario_text}

${editedText ? `■ 참고: 사용자 수정안
${editedText}` : ''}

■ 요청
위 수정 요청을 반영하여 시나리오를 다시 작성해주세요.
JSON의 해당 scene의 scenario_text 필드만 업데이트하여 출력해주세요.`;
  };

  const copyPrompt = async (scene: Scene) => {
    const prompt = generatePrompt(scene);
    await navigator.clipboard.writeText(prompt);
    setCopiedId(`prompt-${scene.scene_id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple/30 to-accent-purple/10 
          flex items-center justify-center border border-accent-purple/20">
          <Clapperboard className="w-7 h-7 text-accent-purple" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">Scenario</h2>
          <p className="text-text-secondary">
            {scenario.scenario_title} • {scenario.scenes.length} scenes
          </p>
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Columns className="w-4 h-4" />
          <span>2열 비교 뷰</span>
        </div>
      </div>

      {/* Scenes */}
      <div className="space-y-4">
        {scenario.scenes.map((scene) => {
          const isExpanded = expandedScene === scene.scene_id;
          
          return (
            <div
              key={scene.scene_id}
              className="bg-bg-secondary rounded-2xl border border-border-color overflow-hidden
                hover:border-accent-purple/30 transition-all duration-200"
            >
              {/* Scene Header */}
              <button
                onClick={() => toggleScene(scene.scene_id)}
                className="w-full flex items-center justify-between p-5 
                  hover:bg-bg-tertiary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-purple/30 to-accent-purple/10 
                    flex items-center justify-center text-accent-purple font-bold text-lg">
                    {scene.scene_number}
                  </div>
                  <div className="text-left">
                    <div className="text-base font-semibold text-white">
                      Scene {scene.scene_number}
                      <span className="text-text-secondary font-normal ml-2">({scene.scene_id})</span>
                    </div>
                    <div className="text-sm text-text-secondary">{scene.sequence_id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyScenario(scene);
                    }}
                    className="p-2.5 rounded-xl hover:bg-bg-tertiary transition-colors"
                    title="시나리오 복사"
                  >
                    {copiedId === `copy-${scene.scene_id}` ? (
                      <Check className="w-5 h-5 text-accent-green" />
                    ) : (
                      <Copy className="w-5 h-5 text-text-secondary" />
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

              {/* Expanded Content - 2열 구조 */}
              {isExpanded && (
                <div className="border-t border-border-color">
                  {/* 2 Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* 원본 시나리오 */}
                    <div className="p-5 lg:border-r border-border-color">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📖</span>
                          <span className="text-sm font-semibold text-white">원본 시나리오</span>
                        </div>
                        <button
                          onClick={() => copyScenario(scene)}
                          className="text-xs text-accent-purple hover:text-accent-purple/80 
                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent-purple/10 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          복사
                        </button>
                      </div>
                      <div className="bg-bg-primary rounded-xl p-5 min-h-[250px] max-h-[400px] overflow-y-auto border border-border-color">
                        <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                          {scene.scenario_text}
                        </pre>
                      </div>
                    </div>

                    {/* 수정 시나리오 */}
                    <div className="p-5 border-t lg:border-t-0 border-border-color">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">✏️</span>
                        <span className="text-sm font-semibold text-white">수정 시나리오</span>
                        <span className="text-xs text-text-secondary">(선택사항)</span>
                      </div>
                      <textarea
                        value={editedTexts[scene.scene_id] || ''}
                        onChange={(e) => setEditedTexts(prev => ({
                          ...prev,
                          [scene.scene_id]: e.target.value
                        }))}
                        placeholder="수정할 시나리오를 여기에 작성하세요...&#10;&#10;비워두면 원본 기준으로 수정 요청이 생성됩니다."
                        className="w-full bg-bg-primary border border-border-color rounded-xl p-5
                          min-h-[250px] max-h-[400px] text-white text-sm font-mono
                          placeholder:text-text-secondary/40 resize-none leading-relaxed
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
                        value={modificationRequests[scene.scene_id] || ''}
                        onChange={(e) => setModificationRequests(prev => ({
                          ...prev,
                          [scene.scene_id]: e.target.value
                        }))}
                        placeholder="예: 대사를 더 감정적으로, 지문을 더 상세하게, 장소 묘사 추가..."
                        className="flex-1 bg-bg-primary border border-border-color rounded-xl px-5 py-3
                          text-white text-sm placeholder:text-text-secondary/40
                          focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
                      />
                      <button
                        onClick={() => copyPrompt(scene)}
                        className="flex items-center gap-2.5 px-6 py-3 rounded-xl
                          bg-gradient-to-r from-accent-purple to-accent-purple-dark
                          text-white font-medium shadow-lg shadow-accent-purple/25 
                          hover:shadow-accent-purple/40 hover:scale-[1.02] transition-all"
                      >
                        {copiedId === `prompt-${scene.scene_id}` ? (
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
