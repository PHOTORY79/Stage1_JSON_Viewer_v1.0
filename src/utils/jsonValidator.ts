import { Stage1JSON, ValidationError, ErrorCategory } from '../types/stage1.types';

/**
 * Stage 1 JSON Detailed Validation — AIFI FF 6.0 Schema
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
            type: 'schema',
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
    } else if (!/^FILM_\d{6}$/.test(json.film_id)) {
        addError('schema', 'film_id 형식이 맞지 않습니다. (FILM_XXXXXX)', 'film_id', 'warning');
    }

    if (!json.current_step) {
        addError('essential', 'current_step이 누락되었습니다.', 'current_step');
    } else if (json.current_step !== 'scenario_development') {
        addError('schema', `유효하지 않은 단계(current_step)입니다: ${json.current_step}. 'scenario_development'만 허용됩니다.`, 'current_step', 'error');
    }

    if (!json.film_metadata) {
        addError('essential', 'film_metadata가 누락되었습니다.', 'film_metadata');
    }

    if (!json.timestamp) {
        addError('essential', 'timestamp가 누락되었습니다.', 'timestamp');
    }

    // ---------------------------------------------------------------------------
    // 2. Film Metadata Validation
    // ---------------------------------------------------------------------------
    if (json.film_metadata) {
        const fm = json.film_metadata;
        const requiredFields = ['title_working', 'genre', 'duration_minutes', 'style', 'medium', 'era', 'aspect_ratio'];
        requiredFields.forEach(field => {
            if ((fm as any)[field] === undefined || (fm as any)[field] === null) {
                addError('schema', `film_metadata.${field}가 누락되었습니다.`, `film_metadata.${field}`, 'warning');
            }
        });

        if (typeof fm.duration_minutes !== 'number' && fm.duration_minutes !== undefined) {
            addError('schema', 'duration_minutes는 숫자여야 합니다.', 'film_metadata.duration_minutes');
        } else if (typeof fm.duration_minutes === 'number' && (fm.duration_minutes < 1 || fm.duration_minutes > 15)) {
            addError('schema', `duration_minutes는 1~15 범위여야 합니다. (현재: ${fm.duration_minutes})`, 'film_metadata.duration_minutes', 'warning');
        }

        if (fm.aspect_ratio && !/^\d+(\.\d+)?:\d+$/.test(fm.aspect_ratio)) {
            addError('schema', `aspect_ratio 형식이 맞지 않습니다: ${fm.aspect_ratio} (예: 16:9)`, 'film_metadata.aspect_ratio', 'warning');
        }
    }

    // ---------------------------------------------------------------------------
    // 3. Concept Art List Validation
    // ---------------------------------------------------------------------------
    if (!json.concept_art_list) {
        addError('essential', 'concept_art_list가 누락되었습니다.', 'concept_art_list');
    } else {
        const cal = json.concept_art_list;
        if (!cal.characters || typeof cal.characters !== 'object') {
            addError('schema', 'concept_art_list.characters가 누락되었거나 올바르지 않습니다.', 'concept_art_list.characters', 'warning');
        } else if (Object.keys(cal.characters).length === 0) {
            addError('schema', 'concept_art_list.characters가 비어있습니다.', 'concept_art_list.characters', 'warning');
        }

        if (!cal.locations || typeof cal.locations !== 'object') {
            addError('schema', 'concept_art_list.locations가 누락되었거나 올바르지 않습니다.', 'concept_art_list.locations', 'warning');
        } else if (Object.keys(cal.locations).length === 0) {
            addError('schema', 'concept_art_list.locations가 비어있습니다.', 'concept_art_list.locations', 'warning');
        }

        if (!cal.props || typeof cal.props !== 'object') {
            addError('schema', 'concept_art_list.props가 누락되었거나 올바르지 않습니다.', 'concept_art_list.props', 'warning');
        }
    }

    // ---------------------------------------------------------------------------
    // 4. Scenario Validation
    // ---------------------------------------------------------------------------
    if (!json.scenario) {
        addError('story', 'scenario 객체가 누락되었습니다.', 'scenario');
    } else {
        if (!json.scenario.scenario_title) {
            addError('story', 'scenario_title이 누락되었습니다.', 'scenario.scenario_title', 'warning');
        }
        if (!Array.isArray(json.scenario.scenes) || json.scenario.scenes.length === 0) {
            addError('story', 'scenes 배열이 비어있거나 누락되었습니다.', 'scenario.scenes', 'warning');
        } else {
            // Validate individual scenes
            json.scenario.scenes.forEach((scene, idx) => {
                const prefix = `scenario.scenes[${idx}]`;
                if (!scene.scene_id) {
                    addError('schema', `scene_id가 누락되었습니다.`, `${prefix}.scene_id`, 'warning');
                } else if (!/^S\d{2}$/.test(scene.scene_id)) {
                    addError('schema', `scene_id 형식이 맞지 않습니다: ${scene.scene_id} (예: S01)`, `${prefix}.scene_id`, 'warning');
                }
                if (!scene.scene_heading) {
                    addError('schema', `scene_heading이 누락되었습니다.`, `${prefix}.scene_heading`, 'warning');
                }
                if (!scene.scene_scenario) {
                    addError('story', `scene_scenario가 비어있습니다.`, `${prefix}.scene_scenario`, 'warning');
                }
                if (typeof scene.scene_number !== 'number') {
                    addError('schema', `scene_number는 숫자여야 합니다.`, `${prefix}.scene_number`, 'warning');
                }
            });
        }
    }

    // ---------------------------------------------------------------------------
    // 5. Structural Checks — Unknown Root Keys
    // ---------------------------------------------------------------------------
    const knownRootKeys = ['film_id', 'current_step', 'timestamp', 'film_metadata', 'concept_art_list', 'scenario'];
    Object.keys(json).forEach(key => {
        if (!knownRootKeys.includes(key)) {
            addError('other', `알 수 없는 최상위 필드입니다: ${key}`, key, 'info');
        }
    });

    return errors;
}
