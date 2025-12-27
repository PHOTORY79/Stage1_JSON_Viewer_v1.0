import {
  FileText,
  BookOpen,
  ScrollText,
  Clapperboard,
  Users,
  MapPin,
  Box,
  AlertCircle,
  CheckCircle,
  Lock
} from 'lucide-react';
import { AppView, Stage1JSON, CurrentStep } from '../../types/stage1.types';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  availableFrom: string[]; // Changed to string[] to allow flexibility or specific union
}

// Update these to match CurrentStep type exactly + add all subsequent steps
const navItems: NavItem[] = [
  {
    id: 'metadata',
    label: 'Metadata',
    icon: <FileText className="w-4 h-4" />,
    availableFrom: ['synopsis_planning', 'scenario_development', 'asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
  {
    id: 'synopsis',
    label: 'Synopsis',
    icon: <BookOpen className="w-4 h-4" />,
    availableFrom: ['synopsis_planning', 'scenario_development', 'asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
  {
    id: 'treatment',
    label: 'Treatment',
    icon: <ScrollText className="w-4 h-4" />,
    availableFrom: ['synopsis_planning', 'scenario_development', 'asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
  {
    id: 'scenario',
    label: 'Scenario',
    icon: <Clapperboard className="w-4 h-4" />,
    availableFrom: ['scenario_development', 'asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
  {
    id: 'characters',
    label: 'Characters',
    icon: <Users className="w-4 h-4" />,
    availableFrom: ['asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
  {
    id: 'locations',
    label: 'Locations',
    icon: <MapPin className="w-4 h-4" />,
    availableFrom: ['asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
  {
    id: 'props',
    label: 'Props',
    icon: <Box className="w-4 h-4" />,
    availableFrom: ['asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
];

interface SidebarProps {
  currentView: AppView;
  data: Stage1JSON | null;
  hasErrors: boolean;
  errorCount: number;
  onViewChange: (view: AppView) => void;
}

export function Sidebar({ currentView, data, hasErrors, errorCount, onViewChange }: SidebarProps) {
  const isAvailable = (item: NavItem): boolean => {
    if (!data) return false;
    const currentStep = data.current_step;

    // 1. Step check: checks if currentStep is in the list
    if (!item.availableFrom.includes(currentStep)) return false;

    // 2. Data existence check
    switch (item.id) {
      case 'metadata':
        return true;
      case 'synopsis':
        return !!(data.current_work?.logline || data.current_work?.synopsis);
      case 'treatment':
        // Treatment might be empty in synopsis_planning, but if data exists, show it.
        // It's possible to have partial data.
        return !!(data.current_work?.treatment?.sequences?.length || data.current_work?.treatment?.treatment_title);
      case 'scenario':
        return !!(data.current_work?.scenario?.scenes?.length);
      case 'characters':
        return !!(data.visual_blocks?.characters?.length);
      case 'locations':
        return !!(data.visual_blocks?.locations?.length);
      case 'props':
        return !!(data.visual_blocks?.props?.length);
      default:
        return true;
    }
  };

  return (
    <aside className="w-60 bg-bg-secondary border-r border-border-color flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 py-6">
        <div className="px-5 mb-3">
          <span className="text-[10px] font-semibold text-text-secondary/60 uppercase tracking-widest">
            Sections
          </span>
        </div>

        <div className="space-y-1 px-3">
          {navItems.map((item) => {
            const available = isAvailable(item);
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => available && onViewChange(item.id)}
                disabled={!available}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                  transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-gradient-to-r from-accent-purple/20 to-accent-purple/5 text-white'
                    : available
                      ? 'text-text-secondary hover:bg-bg-tertiary hover:text-white'
                      : 'text-text-secondary/30 cursor-not-allowed'
                  }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-purple rounded-r-full" />
                )}

                <span className={`transition-colors ${isActive ? 'text-accent-purple' : ''}`}>
                  {available ? item.icon : <Lock className="w-4 h-4" />}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Validation Status */}
      <div className="p-4 border-t border-border-color">
        <button
          onClick={() => onViewChange('validation')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
            transition-all duration-200
            ${currentView === 'validation'
              ? 'bg-gradient-to-r from-accent-purple/20 to-accent-purple/5'
              : 'hover:bg-bg-tertiary'
            }
            ${hasErrors ? 'text-accent-red' : 'text-accent-green'}`}
        >
          {hasErrors ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">Validation</span>
          {hasErrors && (
            <span className="ml-auto bg-accent-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {errorCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
