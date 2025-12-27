import { Stage1JSON, ValidationError, ErrorCategory, CurrentStep } from '../types/stage1.types';

/**
 * Stage 1 JSON Detailed Validation
 */
export function validateStage1Json(json: Stage1JSON): ValidationError[] {
    const errors: ValidationError[] = [];

    const addError = (
        category: ErrorCategory,
        message: string,
        path: string,
        severity: 'error' | 'warning' | 'info' = 'error'
    ) => {
        errors.push({
            type: 'schema', // Default type
            severity,
            category,
            path,
            message,
        });
    };

    // ---------------------------------------------------------------------------
    // 1. Essential Fields Validation
    // ---------------------------------------------------------------------------
    if (!json.film_id) {
        addError('essential', 'film_id가 누락되었습니다.', 'film_id');
    } else if (typeof json.film_id !== 'string') {
        addError('schema', 'film_id는 문자열이어야 합니다.', 'film_id');
    }

    if (!json.current_step) {
        addError('essential', 'current_step이 누락되었습니다.', 'current_step');
    } else {
        const validSteps: CurrentStep[] = [
            'synopsis_planning',
            'scenario_development',
            'asset_addition',
            'concept_art_blocks_completed',
            'concept_art_generation',
        ];
        if (!validSteps.includes(json.current_step)) {
            addError('schema', `유효하지 않은 단계(current_step)입니다: ${json.current_step}`, 'current_step', 'error');
        }
    }

    if (!json.film_metadata) {
        addError('essential', 'film_metadata가 누락되었습니다.', 'film_metadata');
    }

    if (!json.timestamp) {
        addError('essential', 'timestamp가 누락되었습니다.', 'timestamp');
    }

    // If essential structure is missing, stop further deep validation or proceed with caution?
    // We'll proceed but rely on optional chaining.

    // ---------------------------------------------------------------------------
    // 2. Story Validation (Based on current_step)
    // ---------------------------------------------------------------------------
    const step = json.current_step;
    const cw = json.current_work || {};

    // Check logline & synopsis existence
    if (['synopsis_planning', 'logline_synopsis_development'].includes(step as string)) {
        if (!cw.logline) addError('story', 'logline이 누락되었습니다.', 'current_work.logline', 'warning');
        if (!cw.synopsis) addError('story', 'synopsis가 누락되었습니다.', 'current_work.synopsis', 'warning');
    }

    // Check treatment
    if ((step as string) === 'treatment_expansion' || ['scenario_development', 'concept_art_blocks_completed'].includes(step)) {
        if (!cw.treatment) addError('story', 'treatment 객체가 누락되었습니다.', 'current_work.treatment', 'warning');
        else if (!cw.treatment.treatment_title) addError('story', 'treatment_title이 누락되었습니다.', 'current_work.treatment.treatment_title', 'warning');
    }

    // Check scenario
    if (['scenario_development', 'concept_art_blocks_completed'].includes(step)) {
        if (!cw.scenario) addError('story', 'scenario 객체가 누락되었습니다.', 'current_work.scenario');
        else {
            if (!cw.scenario.scenario_title) addError('story', 'scenario_title이 누락되었습니다.', 'current_work.scenario.scenario_title', 'warning');
            if (!Array.isArray(cw.scenario.scenes) || cw.scenario.scenes.length === 0) {
                addError('story', 'scenes 배열이 비어있거나 누락되었습니다.', 'current_work.scenario.scenes', 'warning');
            }
        }
    }

    // ---------------------------------------------------------------------------
    // 3. Visual Validation
    // ---------------------------------------------------------------------------
    const vb = json.visual_blocks || {};

    // Check existence if step requires it
    const requiresVisuals = ['asset_addition', 'concept_art_blocks_completed', 'concept_art_generation'].includes(step);

    if (requiresVisuals) {
        if (!json.visual_blocks) {
            addError('visual', 'visual_blocks 객체가 최상위 레벨에 누락되었습니다.', 'visual_blocks');
        } else {
            // Check arrays
            ['characters', 'locations', 'props'].forEach((key) => {
                // @ts-ignore - indexing visual_blocks
                if (!Array.isArray(vb[key])) {
                    addError('visual', `${key} 배열이 누락되었습니다.`, `visual_blocks.${key}`);
                } else {
                    // @ts-ignore
                    if (vb[key].length === 0) {
                        addError('visual', `${key} 목록이 비어있습니다.`, `visual_blocks.${key}`, 'warning');
                    }
                }
            });
        }
    } else {
        // Info if present when not required
        if (json.visual_blocks && Object.keys(json.visual_blocks).length > 0) {
            // Not an error, just present
        }
    }

    // ---------------------------------------------------------------------------
    // 4. Schema/Type Validation (Sample checks)
    // ---------------------------------------------------------------------------

    // Metadata types
    if (json.film_metadata) {
        if (typeof json.film_metadata.duration_minutes !== 'number' && json.film_metadata.duration_minutes !== undefined) {
            addError('schema', 'duration_minutes는 숫자여야 합니다.', 'film_metadata.duration_minutes');
        }
        // Check known optional fields that should have specific types if present
        if (json.film_metadata.artist && typeof json.film_metadata.artist !== 'string') {
            addError('schema', 'artist는 문자열이어야 합니다.', 'film_metadata.artist');
        }
    }

    // ---------------------------------------------------------------------------
    // 5. Other / Structural Checks
    // ---------------------------------------------------------------------------
    // Example: unexpected fields or structural anomalies
    const knownRootKeys = ['film_id', 'current_step', 'timestamp', 'film_metadata', 'current_work', 'visual_blocks'];
    Object.keys(json).forEach(key => {
        if (!knownRootKeys.includes(key)) {
            addError('other', `알 수 없는 최상위 필드입니다: ${key}`, key, 'info');
        }
    });

    return errors;
}
