// Stage 1 JSON Types

export type CurrentStep =
  | 'synopsis_planning'
  | 'scenario_development'
  | 'asset_addition'
  | 'concept_art_blocks_completed'
  | 'concept_art_generation';

export interface FilmMetadata {
  title_working: string;
  genre: string;
  duration_minutes: number;
  style: string;
  artist: string | null;
  medium: string;
  era: string;
  aspect_ratio: string;
}

export interface Synopsis {
  act1: string;
  act2: string;
  act3: string;
}

export interface Sequence {
  sequence_id: string;
  sequence_title: string;
  narrative_function: string;
  treatment_text: string;
}

export interface Treatment {
  treatment_title: string;
  story_structure_type: string;
  sequences: Sequence[];
}

export interface Scene {
  scene_number: number;
  scene_id: string;
  sequence_id: string;
  scenario_text: string;
}

export interface Scenario {
  scenario_title: string;
  scenes: Scene[];
}

export interface CurrentWork {
  logline: string;
  synopsis: Synopsis;
  treatment: Treatment;
  scenario: Scenario;
}

// Block types as Record for flexibility
export type CharacterBlocks = Record<string, string>;
export type LocationBlocks = Record<string, string>;
export type PropBlocks = Record<string, string>;

export interface Character {
  id: string;
  name: string;
  blocks: CharacterBlocks;
  character_detail: string;
  voice_style: string;
}

export interface Location {
  id: string;
  name: string;
  blocks: LocationBlocks;
}

export interface Prop {
  id: string;
  name: string;
  blocks: PropBlocks;
  prop_detail: string;
}

export interface VisualBlocks {
  characters: Character[];
  locations: Location[];
  props: Prop[];
}

export interface Stage1JSON {
  film_id: string;
  current_step: CurrentStep;
  timestamp: string;
  film_metadata: FilmMetadata;
  current_work: CurrentWork;
  visual_blocks: VisualBlocks;
}

// Validation Types
export type ErrorSeverity = 'error' | 'warning' | 'info';
export type ErrorType = 'syntax' | 'schema' | 'structure';
export type ErrorCategory = 'essential' | 'story' | 'visual' | 'schema' | 'other';

export interface ValidationError {
  type: ErrorType;
  severity: ErrorSeverity;
  category: ErrorCategory; // Added category
  path: string;
  message: string;
  line?: number;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  autoFixed: boolean;
  fixedJson?: string;
  fixCount?: number;
}

// App State Types
export type AppView =
  | 'empty'
  | 'metadata'
  | 'synopsis'
  | 'treatment'
  | 'scenario'
  | 'characters'
  | 'locations'
  | 'props'
  | 'validation';

export interface AppState {
  jsonInput: string;
  parsedJson: Stage1JSON | null;
  validationResult: ValidationResult | null;
  currentView: AppView;
  isLoading: boolean;
}
