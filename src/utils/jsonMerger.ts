import { Stage1JSON } from '../types/stage1.types';

export interface ParsedFile {
    id: string;
    name: string;
    content: string;
    parsed: Stage1JSON;
    type: 'main' | 'asset' | 'unknown';
    filmId: string;
}

export interface MergeResult {
    success: boolean;
    mergedJson: Stage1JSON | null;
    errors: string[];
    warnings: string[];
}

export function mergeJsonFiles(files: ParsedFile[]): MergeResult {
    const result: MergeResult = {
        success: false,
        mergedJson: null,
        errors: [],
        warnings: []
    };

    if (files.length === 0) {
        result.errors.push("병합할 파일이 없습니다.");
        return result;
    }

    // 1. Validate Film ID consistency
    const firstFilmId = files[0].filmId;
    const inconsistentFiles = files.filter(f => f.filmId !== firstFilmId);
    if (inconsistentFiles.length > 0) {
        result.errors.push(`모든 파일의 film_id가 일치해야 합니다. (기준: ${firstFilmId}, 불일치: ${inconsistentFiles.map(f => f.name).join(', ')})`);
        return result;
    }

    // 2. Identify Main File
    let mainFile = files.find(f => f.parsed.current_step === 'scenario_development' || f.parsed.scenario);

    if (!mainFile) {
        mainFile = files[0];
    }

    // Deep clone the main file to start merging
    const merged: Stage1JSON = JSON.parse(JSON.stringify(mainFile.parsed));

    // Initialize concept_art_list if missing
    if (!merged.concept_art_list) {
        merged.concept_art_list = {
            characters: {},
            locations: {},
            props: {}
        };
    }
    if (!merged.concept_art_list.characters) merged.concept_art_list.characters = {};
    if (!merged.concept_art_list.locations) merged.concept_art_list.locations = {};
    if (!merged.concept_art_list.props) merged.concept_art_list.props = {};

    // 3. Merge Loop — merge concept_art_list and scenario scenes from other files
    for (const file of files) {
        if (file === mainFile) continue;

        const cal = file.parsed.concept_art_list;
        if (cal) {
            // Merge characters
            if (cal.characters) {
                Object.entries(cal.characters).forEach(([key, value]) => {
                    if (merged.concept_art_list.characters[key]) {
                        result.warnings.push(`[${file.name}] 캐릭터 키 중복 무시됨: ${key}`);
                    } else {
                        merged.concept_art_list.characters[key] = value;
                    }
                });
            }

            // Merge locations
            if (cal.locations) {
                Object.entries(cal.locations).forEach(([key, value]) => {
                    if (merged.concept_art_list.locations[key]) {
                        result.warnings.push(`[${file.name}] 장소 키 중복 무시됨: ${key}`);
                    } else {
                        merged.concept_art_list.locations[key] = value;
                    }
                });
            }

            // Merge props
            if (cal.props) {
                Object.entries(cal.props).forEach(([key, value]) => {
                    if (merged.concept_art_list.props[key]) {
                        result.warnings.push(`[${file.name}] 소품 키 중복 무시됨: ${key}`);
                    } else {
                        merged.concept_art_list.props[key] = value;
                    }
                });
            }
        }

        // Merge scenario scenes (append non-duplicate scenes)
        if (file.parsed.scenario?.scenes) {
            const existingIds = new Set(merged.scenario?.scenes?.map(s => s.scene_id) || []);
            file.parsed.scenario.scenes.forEach(scene => {
                if (existingIds.has(scene.scene_id)) {
                    result.warnings.push(`[${file.name}] 씬 ID 중복 무시됨: ${scene.scene_id}`);
                } else {
                    if (!merged.scenario) {
                        merged.scenario = { scenario_title: '', scenes: [] };
                    }
                    merged.scenario.scenes.push(scene);
                    existingIds.add(scene.scene_id);
                }
            });
        }
    }

    result.success = true;
    result.mergedJson = merged;
    return result;
}
