import { Stage1JSON, Character, Location, Prop } from '../types/stage1.types';

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
    // Priority: 'scenario_development' step or has 'current_work.scenario' > first file
    let mainFile = files.find(f => f.parsed.current_step === 'scenario_development' || (f.parsed.current_work && f.parsed.current_work.scenario));

    // If no explicit main file found, use the first one but warn if it looks like an asset file
    if (!mainFile) {
        mainFile = files[0];
        if (mainFile.parsed.current_step === 'asset_addition') {
            // It's possible we are merging multiple asset files into one base asset file? 
            // Or user just provided asset files without a scenario file. 
            // We'll accept it but maybe the base structure comes from this file.
        }
    }

    // Deep clone the main file to start merging
    const merged: Stage1JSON = JSON.parse(JSON.stringify(mainFile.parsed));

    // Initialize visual_blocks if missing
    if (!merged.visual_blocks) {
        merged.visual_blocks = {
            characters: [],
            locations: [],
            props: []
        };
    }
    if (!merged.visual_blocks.characters) merged.visual_blocks.characters = [];
    if (!merged.visual_blocks.locations) merged.visual_blocks.locations = [];
    if (!merged.visual_blocks.props) merged.visual_blocks.props = [];

    // Helper sets for deduplication
    const charIds = new Set<string>(merged.visual_blocks.characters.map((c: Character) => c.id));
    const locIds = new Set<string>(merged.visual_blocks.locations.map((l: Location) => l.id));
    const propIds = new Set<string>(merged.visual_blocks.props.map((p: Prop) => p.id));

    // 3. Merge Loop
    for (const file of files) {
        if (file === mainFile) continue; // Skip the main file as it's already base

        const vb = file.parsed.visual_blocks;
        if (!vb) continue;

        // Merge Characters
        if (vb.characters) {
            vb.characters.forEach((char: Character) => {
                if (charIds.has(char.id)) {
                    result.warnings.push(`[${file.name}] 캐릭터 ID 중복 무시됨: ${char.id} (${char.name})`);
                } else {
                    merged.visual_blocks!.characters!.push(char);
                    charIds.add(char.id);
                }
            });
        }

        // Merge Locations
        if (vb.locations) {
            vb.locations.forEach((loc: Location) => {
                if (locIds.has(loc.id)) {
                    result.warnings.push(`[${file.name}] 장소 ID 중복 무시됨: ${loc.id} (${loc.name})`);
                } else {
                    merged.visual_blocks!.locations!.push(loc);
                    locIds.add(loc.id);
                }
            });
        }

        // Merge Props
        if (vb.props) {
            vb.props.forEach((prop: Prop) => {
                if (propIds.has(prop.id)) {
                    result.warnings.push(`[${file.name}] 소품 ID 중복 무시됨: ${prop.id} (${prop.name})`);
                } else {
                    merged.visual_blocks!.props!.push(prop);
                    propIds.add(prop.id);
                }
            });
        }
    }

    // 4. Upgrade Step
    // If we have any visual blocks, we can consider upgrading the step
    const hasVisuals =
        (merged.visual_blocks.characters && merged.visual_blocks.characters.length > 0) ||
        (merged.visual_blocks.locations && merged.visual_blocks.locations.length > 0) ||
        (merged.visual_blocks.props && merged.visual_blocks.props.length > 0);

    if (hasVisuals) {
        merged.current_step = 'concept_art_blocks_completed';
    }

    result.success = true;
    result.mergedJson = merged;
    return result;
}
