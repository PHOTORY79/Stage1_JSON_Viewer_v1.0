# Stage 1 JSON Viewer 업데이트 명세서

> **프로젝트 경로:** `D:\Stage1_JSON_Viewer_v1.0`  
> **버전:** v1.0 → v1.1  
> **작성일:** 2025-12-27

---

## 📋 업데이트 개요

| # | 기능 | 우선순위 |
|---|------|----------|
| 1 | `asset_addition` step 인식 | 높음 |
| 2 | 복수 파일 업로드/붙여넣기 | 높음 |
| 3 | 파일 병합 엔진 | 높음 |
| 4 | 병합된 JSON 다운로드 | 높음 |
| 5 | 프롬프트 복사 기능 개선 | 중간 |

---

## 1. `asset_addition` Step 인식

### 현재 문제
- `current_step: "asset_addition"` 파일 업로드 시 인식 안됨
- Sidebar에서 진행률 표시 오류

### 수정 사항

**파일:** `src/types/stage1.types.ts`

```typescript
// 변경 전
export type CurrentStep = 
  | 'logline_synopsis_development'
  | 'treatment_expansion'
  | 'scenario_development'
  | 'concept_art_blocks_completed';

// 변경 후
export type CurrentStep = 
  | 'logline_synopsis_development'
  | 'treatment_expansion'
  | 'scenario_development'
  | 'concept_art_blocks_completed'
  | 'asset_addition';  // 추가
```

**파일:** `src/components/Viewer/MetadataView.tsx`

```typescript
// stepConfig에 추가
const stepConfig: Record<string, { label: string; color: string; progress: number }> = {
  'logline_synopsis_development': { label: 'Step 1: 로그라인/시놉시스', color: 'bg-blue-500', progress: 25 },
  'treatment_expansion': { label: 'Step 2: 트리트먼트', color: 'bg-orange-500', progress: 50 },
  'scenario_development': { label: 'Step 3: 시나리오', color: 'bg-yellow-500', progress: 75 },
  'concept_art_blocks_completed': { label: 'Step 4: 완성', color: 'bg-accent-green', progress: 100 },
  'asset_addition': { label: 'Step 4: 컨셉아트 추가', color: 'bg-accent-green', progress: 100 },  // 추가
};
```

**파일:** `src/components/Layout/Sidebar.tsx`

```typescript
// navItems의 availableFrom에 'asset_addition' 추가
// characters, locations, props 항목에:
availableFrom: ['concept_art_blocks_completed', 'asset_addition']
```

---

## 2. 복수 파일 업로드/붙여넣기

### 현재 상태
- 단일 파일만 업로드 가능
- 붙여넣기도 단일 JSON만 가능

### 수정 사항

**파일:** `src/components/JsonInput/JsonInput.tsx`

#### 2-1. 다중 파일 드래그앤드롭

```typescript
// 기존: 단일 파일
const file = e.dataTransfer.files[0];

// 변경: 다중 파일
const files = Array.from(e.dataTransfer.files);
files.forEach(file => {
  if (file.type === 'application/json' || file.name.endsWith('.json')) {
    readFile(file);
  }
});
```

#### 2-2. 파일 목록 UI

```
┌─────────────────────────────────────────────────────┐
│ 📁 업로드된 파일 (3개)                    [+ 추가]  │
├─────────────────────────────────────────────────────┤
│ ✅ FILM_724915_stage1_clean.json (메인)       [x]  │
│ ✅ 캐릭터.json (asset_addition)               [x]  │
│ ✅ 장소.json (asset_addition)                 [x]  │
├─────────────────────────────────────────────────────┤
│           [🔗 파일 병합하기]                        │
└─────────────────────────────────────────────────────┘
```

#### 2-3. 복수 붙여넣기 탭 UI

```
┌─────────────────────────────────────────────────────┐
│ [JSON 1] [JSON 2] [JSON 3] [+]                      │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ {"film_id": "FILM_724915", ...}                 │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│                              [취소] [병합하기]      │
└─────────────────────────────────────────────────────┘
```

#### 2-4. 상태 관리 변경

```typescript
// 기존
const [jsonInput, setJsonInput] = useState<string>('');

// 변경
interface JsonFile {
  id: string;
  name: string;
  content: string;
  parsed: any;
  type: 'main' | 'asset_addition';
  filmId: string;
}

const [jsonFiles, setJsonFiles] = useState<JsonFile[]>([]);
```

---

## 3. 파일 병합 엔진

### 병합 로직

**새 파일:** `src/utils/jsonMerger.ts`

```typescript
interface MergeResult {
  success: boolean;
  mergedJson: Stage1JSON | null;
  errors: string[];
  warnings: string[];
}

export function mergeJsonFiles(files: JsonFile[]): MergeResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. film_id 검증
  const filmIds = [...new Set(files.map(f => f.parsed.film_id))];
  if (filmIds.length > 1) {
    errors.push(`film_id 불일치: ${filmIds.join(', ')}`);
    return { success: false, mergedJson: null, errors, warnings };
  }

  // 2. 메인 파일 찾기 (scenario_development 또는 가장 완성도 높은 것)
  const mainFile = files.find(f => 
    f.parsed.current_step === 'scenario_development' ||
    f.parsed.current_step === 'concept_art_blocks_completed'
  ) || files.find(f => f.parsed.current_work?.scenario);

  if (!mainFile) {
    errors.push('메인 파일을 찾을 수 없습니다.');
    return { success: false, mergedJson: null, errors, warnings };
  }

  // 3. visual_blocks 병합
  const mergedVisualBlocks = {
    characters: [] as any[],
    locations: [] as any[],
    props: [] as any[],
  };

  files.forEach(file => {
    const vb = file.parsed.visual_blocks;
    if (vb) {
      if (vb.characters?.length) mergedVisualBlocks.characters.push(...vb.characters);
      if (vb.locations?.length) mergedVisualBlocks.locations.push(...vb.locations);
      if (vb.props?.length) mergedVisualBlocks.props.push(...vb.props);
    }
  });

  // 4. 중복 ID 체크
  const charIds = mergedVisualBlocks.characters.map(c => c.id);
  const locIds = mergedVisualBlocks.locations.map(l => l.id);
  const propIds = mergedVisualBlocks.props.map(p => p.id);

  if (new Set(charIds).size !== charIds.length) {
    warnings.push('중복된 캐릭터 ID가 있습니다.');
  }
  // ... locations, props도 동일

  // 5. 최종 병합
  const mergedJson: Stage1JSON = {
    ...mainFile.parsed,
    current_step: 'concept_art_blocks_completed',  // 자동 업그레이드
    visual_blocks: mergedVisualBlocks,
  };

  return { success: true, mergedJson, errors, warnings };
}
```

### 병합 플로우

```
[파일 업로드] 
     ↓
[film_id 검증] → 불일치 시 경고 표시
     ↓
[메인 파일 감지] → scenario/treatment/synopsis 있는 파일
     ↓
[visual_blocks 병합] → characters + locations + props
     ↓
[current_step 업그레이드] → "concept_art_blocks_completed"
     ↓
[병합 결과 미리보기]
     ↓
[뷰어 표시 + 다운로드 가능]
```

---

## 4. 병합된 JSON 다운로드

### 기존 다운로드 버튼 활용

**파일:** `src/components/Layout/Header.tsx`

다운로드 시 병합된 완전한 JSON 저장:

```typescript
const handleDownload = useCallback(() => {
  if (!mergedJson) return;
  
  const jsonStr = JSON.stringify(mergedJson, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${mergedJson.film_id}_stage1_merged.json`;  // 파일명
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}, [mergedJson]);
```

---

## 5. 프롬프트 복사 기능 개선

### 변경 대상 파일
- `src/components/Viewer/CharactersView.tsx`
- `src/components/Viewer/LocationsView.tsx`
- `src/components/Viewer/PropsView.tsx`

### 변경 사항

#### 5-1. 버튼 텍스트 변경

```typescript
// 변경 전
<Copy className="w-3.5 h-3.5" />
전체 복사

// 변경 후
<Copy className="w-3.5 h-3.5" />
프롬프트 복사
```

#### 5-2. 변환 함수 추가

**파일:** `src/utils/promptFormatter.ts` (신규)

```typescript
/**
 * 블록 데이터를 프롬프트 형식으로 변환
 * 
 * 변환 규칙:
 * 1. 번호와 '_' 제거: "1_STYLE" → "STYLE"
 * 2. 형식: "LABEL:값; LABEL2:값2; ..."
 * 3. 빈 값은 제외
 */
export function formatBlocksToPrompt(blocks: Record<string, string>): string {
  return Object.entries(blocks)
    .filter(([_, value]) => value && value.trim() !== '')  // 빈 값 제외
    .map(([key, value]) => {
      const label = key.replace(/^\d+_/, '');  // "1_STYLE" → "STYLE"
      return `${label}:${value}`;
    })
    .join('; ');
}
```

#### 5-3. 복사 함수 변경

```typescript
// 변경 전
const formatBlocks = (blocks: Record<string, string>) => {
  return Object.entries(blocks)
    .map(([key, value]) => `${key}: ${value || '(empty)'}`)
    .join('\n');
};

// 변경 후
import { formatBlocksToPrompt } from '../../utils/promptFormatter';

const copyPromptToClipboard = async (blocks: Record<string, string>) => {
  const prompt = formatBlocksToPrompt(blocks);
  await navigator.clipboard.writeText(prompt);
  // ... 복사 완료 처리
};
```

#### 5-4. 변환 예시

**입력 (blocks):**
```json
{
  "1_STYLE": "Photorealistic portrait",
  "2_ARTIST": "Yeon Sang-ho",
  "3_MEDIUM": "Photography",
  "4_GENRE": "Hero Disaster Action",
  "5_CHARACTER": "Jieun, Korean male 35 office worker",
  "6_MOOD_PERSONALITY": "contemplative thoughtful anxious",
  "7_ERA": "modern Seoul 2025",
  "8_CAMERA": "Medium Shot, front view, eye level"
}
```

**출력 (프롬프트):**
```
STYLE:Photorealistic portrait; ARTIST:Yeon Sang-ho; MEDIUM:Photography; GENRE:Hero Disaster Action; CHARACTER:Jieun, Korean male 35 office worker; MOOD_PERSONALITY:contemplative thoughtful anxious; ERA:modern Seoul 2025; CAMERA:Medium Shot, front view, eye level
```

---

## 📁 테스트 파일

아래 파일들로 테스트:

| 파일명 | 타입 | 내용 |
|--------|------|------|
| `FILM_724915_stage1_clean.json` | 메인 | scenario까지 완성, visual_blocks 비어있음 |
| `캐릭터.json` | asset_addition | characters만 포함 |
| `장소.json` | asset_addition | locations만 포함 |
| `소품.json` | asset_addition | props만 포함 |

### 테스트 시나리오

1. **단일 메인 파일** → 기존처럼 작동
2. **메인 + 통합 컨셉아트** → 2개 파일 병합
3. **메인 + 캐릭터 + 장소 + 소품** → 4개 파일 병합
4. **film_id 다른 파일 혼합** → 오류 표시
5. **병합 후 다운로드** → 완전한 JSON 저장
6. **프롬프트 복사** → 새 형식으로 복사

---

## 📝 파일 변경 목록

```
src/
├── types/
│   └── stage1.types.ts          # CurrentStep 타입 추가
├── utils/
│   ├── jsonParser.ts            # 기존 유지
│   ├── jsonMerger.ts            # 신규: 병합 로직
│   └── promptFormatter.ts       # 신규: 프롬프트 변환
├── components/
│   ├── Layout/
│   │   ├── Header.tsx           # 다운로드 로직 수정
│   │   └── Sidebar.tsx          # asset_addition 인식
│   ├── JsonInput/
│   │   └── JsonInput.tsx        # 복수 파일 UI
│   ├── Viewer/
│   │   ├── MetadataView.tsx     # stepConfig 추가
│   │   ├── CharactersView.tsx   # 프롬프트 복사
│   │   ├── LocationsView.tsx    # 프롬프트 복사
│   │   └── PropsView.tsx        # 프롬프트 복사
└── App.tsx                      # 상태 관리 변경
```

---

## ✅ 체크리스트

- [ ] `asset_addition` step 인식
- [ ] 복수 파일 드래그앤드롭
- [ ] 복수 붙여넣기 탭
- [ ] film_id 검증
- [ ] visual_blocks 병합
- [ ] 병합된 JSON 다운로드
- [ ] 프롬프트 복사 형식 변경
- [ ] 테스트 완료