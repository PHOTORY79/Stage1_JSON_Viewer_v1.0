import { ValidationResult, ValidationError } from '../types/stage1.types';

interface AutoFixResult {
  fixed: boolean;
  json: string;
  fixes: string[];
}

/**
 * JSON 자동 수정 시도
 */
export function autoFixJson(input: string): AutoFixResult {
  let json = input;
  const fixes: string[] = [];

  // 1. 후행 쉼표 제거
  const trailingCommaPattern = /,(\s*[\}\]])/g;
  if (trailingCommaPattern.test(json)) {
    json = json.replace(trailingCommaPattern, '$1');
    fixes.push('후행 쉼표 제거');
  }

  // 2. 작은따옴표를 큰따옴표로 변환
  const singleQuoteKeyPattern = /'([^']+)'(\s*:)/g;
  if (singleQuoteKeyPattern.test(json)) {
    json = json.replace(singleQuoteKeyPattern, '"$1"$2');
    fixes.push('작은따옴표 → 큰따옴표 변환');
  }

  // 3. "null" 문자열을 null로 변환
  const stringNullPattern = /:\s*"null"/g;
  if (stringNullPattern.test(json)) {
    json = json.replace(stringNullPattern, ': null');
    fixes.push('"null" → null 변환');
  }

  // 4. 연속된 쉼표 제거
  const doubleCommaPattern = /,\s*,/g;
  if (doubleCommaPattern.test(json)) {
    json = json.replace(doubleCommaPattern, ',');
    fixes.push('연속된 쉼표 제거');
  }

  return {
    fixed: fixes.length > 0,
    json,
    fixes
  };
}

/**
 * JSON 파싱 시도 및 오류 정보 추출
 */
export function parseJson(input: string): ValidationResult {
  if (!input.trim()) {
    return {
      isValid: false,
      errors: [{
        type: 'syntax',
        severity: 'error',
        category: 'schema', // Added category
        path: '',
        message: 'JSON이 비어있습니다.',
      }],
      autoFixed: false,
    };
  }

  // 1차: 원본 파싱 시도
  try {
    JSON.parse(input);
    return {
      isValid: true,
      errors: [],
      autoFixed: false,
    };
  } catch (firstError) {
    // 2차: 자동 수정 후 파싱 시도
    const fixResult = autoFixJson(input);

    if (fixResult.fixed) {
      try {
        JSON.parse(fixResult.json);
        return {
          isValid: true,
          errors: fixResult.fixes.map(fix => ({
            type: 'syntax' as const,
            severity: 'info' as const,
            category: 'schema' as const, // Added category
            path: '',
            message: `자동 수정: ${fix}`,
          })),
          autoFixed: true,
          fixedJson: fixResult.json,
          fixCount: fixResult.fixes.length,
        };
      } catch {
        // 자동 수정 후에도 실패
      }
    }

    // 파싱 실패 - 오류 정보 추출
    const errorInfo = extractErrorInfo(firstError as Error, input);

    return {
      isValid: false,
      errors: [errorInfo],
      autoFixed: false,
    };
  }
}

/**
 * JSON 파싱 오류에서 상세 정보 추출
 */
function extractErrorInfo(error: Error, input: string): ValidationError {
  const message = error.message;

  const positionMatch = message.match(/position\s+(\d+)/i);

  let line: number | undefined;
  let context = '';

  if (positionMatch) {
    const position = parseInt(positionMatch[1], 10);
    const lines = input.substring(0, position).split('\n');
    line = lines.length;

    const allLines = input.split('\n');
    const startLine = Math.max(0, line - 3);
    const endLine = Math.min(allLines.length, line + 2);
    context = allLines.slice(startLine, endLine)
      .map((l, i) => `${startLine + i + 1}: ${l}`)
      .join('\n');
  }

  return {
    type: 'syntax',
    severity: 'error',
    category: 'schema', // Added category
    path: line ? `Line ${line}` : '',
    message: message,
    line,
    suggestion: context ? `오류 위치 근처:\n${context}` : undefined,
  };
}

/**
 * 오류 수정 요청 프롬프트 생성
 */
export function generateErrorPrompt(errors: ValidationError[], jsonInput: string): string {
  const errorList = errors
    .filter(e => e.severity === 'error')
    .map((e, i) => `${i + 1}. ${e.path ? `${e.path}: ` : ''}${e.message}`)
    .join('\n');

  const contextParts = errors
    .filter(e => e.suggestion)
    .map(e => e.suggestion)
    .join('\n\n');

  return `[Stage 1 JSON 오류 수정 요청]

■ 오류 목록
${errorList}

${contextParts ? `■ 오류 주변 코드\n${contextParts}\n` : ''}
■ 요청
위 오류를 수정한 완전한 JSON을 다시 출력해주세요.`;
}

/**
 * JSON을 보기 좋게 포맷팅
 */
export function formatJson(json: string): string {
  try {
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return json;
  }
}
