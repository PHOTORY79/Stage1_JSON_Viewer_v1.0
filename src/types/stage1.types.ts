// Stage 1 JSON Types — AIFI FF 6.0 Scenario Schema

export type CurrentStep = 'scenario_development';

export interface FilmMetadata {
  title_working: string;
  genre: string;
  duration_minutes: number;
  style: string;
  artist: string;
  medium: string;
  era: string;
  aspect_ratio: string;
}

export interface ConceptArtList {
  characters: Record<string, string>;
  locations: Record<string, string>;
  props: Record<string, string>;
}

export interface Scene {
  scene_number: number;
  scene_id: string;
  scene_heading: string;
  scene_scenario: string;
}

export interface Scenario {
  scenario_title: string;
  scenes: Scene[];
}

export interface Stage1JSON {
  film_id: string;
  current_step: CurrentStep;
  timestamp: string;
  film_metadata: FilmMetadata;
  concept_art_list: ConceptArtList;
  scenario: Scenario;
}

// Validation Types
export type ErrorSeverity = 'error' | 'warning' | 'info';
export type ErrorType = 'syntax' | 'schema' | 'structure';
export type ErrorCategory = 'essential' | 'story' | 'visual' | 'schema' | 'other';

export interface ValidationError {
  type: ErrorType;
  severity: ErrorSeverity;
  category: ErrorCategory;
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
  | 'concept_art'
  | 'scenario'
  | 'validation';

export interface AppState {
  jsonInput: string;
  parsedJson: Stage1JSON | null;
  validationResult: ValidationResult | null;
  currentView: AppView;
  isLoading: boolean;
}
