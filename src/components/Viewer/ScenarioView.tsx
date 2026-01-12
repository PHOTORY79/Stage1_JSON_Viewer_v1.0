import { useState, useEffect } from 'react';
import { Clapperboard, Copy, Check, ChevronDown, ChevronUp, Send, Columns, Save, RotateCcw, Undo2 } from 'lucide-react';
import { Stage1JSON, Scene, Scenario } from '../../types/stage1.types';

interface ScenarioViewProps {
  data: Stage1JSON;
  onSceneUpdate?: (sceneId: string, text: string) => void;
  onSceneRevert?: (sceneId: string) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  initialScenario?: Scenario;
}

export function ScenarioView({
  data,
  onSceneUpdate,
  onSceneRevert,
  onUndo,
  canUndo,
  initialScenario
}: ScenarioViewProps) {
  const { scenario } = data.current_work;
  const [expandedScene, setExpandedScene] = useState<string | null>(
    scenario.scenes[0]?.scene_id || null
  );
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [modificationRequests, setModificationRequests] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync editedTexts with scenario on load, but only if empty (optional, preserving user draft preferred)
  // Actually, we should probably NOT auto-fill this to allow "empty means no change"
  // But for direct editing, pre-filling is better user experience? 
  // User wants "Apply", so they type in right panel. 

  const toggleScene = (sceneId: string) => {
    setExpandedScene(expandedScene === sceneId ? null : sceneId);
  };

  const copyScenario = async (scene: Scene) => {
    await navigator.clipboard.writeText(scene.scenario_text);
    setCopiedId(`copy-${scene.scene_id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (sceneId: string) => {
    const text = editedTexts[sceneId];
    if (text && onSceneUpdate) {
      onSceneUpdate(sceneId, text);
      // Optional: Clear edited text or keep it? 
      // Keep it so user can continue editing.
      setCopiedId(`apply-${sceneId}`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleRevert = (sceneId: string) => {
    if (onSceneRevert) {
      if (confirm('정말로 이 씬을 초기 상태로 되돌리시겠습니까?')) {
        onSceneRevert(sceneId);
        // Also clear local edit draft
        setEditedTexts(prev => {
          const next = { ...prev };
          delete next[sceneId];
          return next;
        });
      }
    }
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

        {/* Undo Button */}
        {canUndo && (
          <button
            onClick={onUndo}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary
              border border-border-color text-text-secondary hover:text-white hover:border-accent-purple
              transition-all mr-2"
          >
            <Undo2 className="w-4 h-4" />
            <span>실행 취소</span>
          </button>
        )}

        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Columns className="w-4 h-4" />
          <span>2열 비교 뷰</span>
        </div>
      </div>

      {/* Scenes */}
      <div className="space-y-4">
        {scenario.scenes.map((scene) => {
          const isExpanded = expandedScene === scene.scene_id;
          const initialScene = initialScenario?.scenes.find(s => s.scene_id === scene.scene_id);
          const isModified = initialScene && initialScene.scenario_text !== scene.scenario_text;

          return (
            <div
              key={scene.scene_id}
              className={`bg-bg-secondary rounded-2xl border overflow-hidden transition-all duration-200
                ${isModified ? 'border-accent-yellow/50' : 'border-border-color hover:border-accent-purple/30'}`}
            >
              {/* Scene Header */}
              <button
                onClick={() => toggleScene(scene.scene_id)}
                className="w-full flex items-center justify-between p-5 
                  hover:bg-bg-tertiary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                    ${isModified
                      ? 'bg-accent-yellow/10 text-accent-yellow'
                      : 'bg-gradient-to-br from-accent-purple/30 to-accent-purple/10 text-accent-purple'}`}>
                    {scene.scene_number}
                  </div>
                  <div className="text-left">
                    <div className="text-base font-semibold text-white flex items-center gap-2">
                      Scene {scene.scene_number}
                      <span className="text-text-secondary font-normal">({scene.scene_id})</span>
                      {isModified && (
                        <span className="text-xs bg-accent-yellow/20 text-accent-yellow px-2 py-0.5 rounded-full">
                          Modified
                        </span>
                      )}
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
                          {isModified && (
                            <button
                              onClick={() => handleRevert(scene.scene_id)}
                              className="ml-2 flex items-center gap-1.5 px-2 py-1 rounded bg-accent-red/10 text-accent-red text-xs hover:bg-accent-red/20 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              초기화
                            </button>
                          )}
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
                      <div className="bg-bg-primary rounded-xl p-5 min-h-[300px] max-h-[500px] overflow-y-auto border border-border-color">
                        <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                          {scene.scenario_text}
                        </pre>
                      </div>
                    </div>

                    {/* 수정 시나리오 */}
                    <div className="p-5 border-t lg:border-t-0 border-border-color flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">✏️</span>
                          <span className="text-sm font-semibold text-white">수정 시나리오</span>
                          <span className="text-xs text-text-secondary">(직접 편집)</span>
                        </div>

                        <button
                          onClick={() => handleApply(scene.scene_id)}
                          disabled={!editedTexts[scene.scene_id]}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all
                            ${editedTexts[scene.scene_id]
                              ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/20 hover:scale-105'
                              : 'bg-bg-tertiary text-text-secondary cursor-not-allowed'}`}
                        >
                          {copiedId === `apply-${scene.scene_id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              적용됨
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              적용하기
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={editedTexts[scene.scene_id] || ''}
                        onChange={(e) => setEditedTexts(prev => ({
                          ...prev,
                          [scene.scene_id]: e.target.value
                        }))}
                        placeholder="수정할 시나리오를 여기에 작성하세요...&#10;&#10;작성 후 [적용하기]를 누르면 원본 시나리오가 업데이트됩니다."
                        className="w-full bg-bg-primary border border-border-color rounded-xl p-5
                          min-h-[300px] max-h-[500px] text-white text-sm font-mono flex-1
                          placeholder:text-text-secondary/40 resize-none leading-relaxed
                          focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
                      />
                    </div>
                  </div>

                  {/* 수정 요청 + 프롬프트 생성 */}
                  <div className="p-5 bg-bg-tertiary/30 border-t border-border-color">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">💬</span>
                      <span className="text-sm font-semibold text-white">수정 요청사항 (AI 도움받기)</span>
                    </div>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={modificationRequests[scene.scene_id] || ''}
                        onChange={(e) => setModificationRequests(prev => ({
                          ...prev,
                          [scene.scene_id]: e.target.value
                        }))}
                        placeholder="예: 대사를 더 감정적으로, 지문을 더 상세하게..."
                        className="flex-1 bg-bg-primary border border-border-color rounded-xl px-5 py-3
                          text-white text-sm placeholder:text-text-secondary/40
                          focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20"
                      />
                      <button
                        onClick={() => copyPrompt(scene)}
                        className="flex items-center gap-2.5 px-6 py-3 rounded-xl
                          bg-bg-secondary border border-border-color
                          text-text-secondary font-medium
                          hover:text-white hover:border-accent-purple hover:bg-accent-purple/5 transition-all"
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
