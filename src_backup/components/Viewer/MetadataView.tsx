import { Film, Clock, Palette, Calendar, Monitor, User } from 'lucide-react';
import { Stage1JSON } from '../../types/stage1.types';

interface MetadataViewProps {
  data: Stage1JSON;
}

export function MetadataView({ data }: MetadataViewProps) {
  const { film_id, current_step, timestamp, film_metadata } = data;

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  const stepConfig: Record<string, { label: string; color: string; progress: number }> = {
    'logline_synopsis_development': { label: 'Step 1: 로그라인/시놉시스', color: 'bg-blue-500', progress: 25 },
    'treatment_expansion': { label: 'Step 2: 트리트먼트', color: 'bg-orange-500', progress: 50 },
    scenario_development: { label: '시나리오 작성', color: 'bg-blue-500', progress: 50 },
    asset_addition: { label: '에셋 추가', color: 'bg-purple-500', progress: 100 },
    concept_art_blocks_completed: { label: '블록 완성', color: 'bg-purple-500', progress: 100 },
  };

  const currentStepConfig = stepConfig[current_step] || { label: current_step, color: 'bg-gray-500', progress: 0 };

  return (
    <div className="p-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple/30 to-accent-purple/10 
          flex items-center justify-center border border-accent-purple/20">
          <Film className="w-7 h-7 text-accent-purple" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Film Metadata</h2>
          <p className="text-text-secondary">영화 기본 정보 및 시스템 데이터</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-bg-secondary rounded-2xl border border-border-color p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">{currentStepConfig.label}</span>
          <span className="text-sm text-text-secondary">{currentStepConfig.progress}%</span>
        </div>
        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={`h-full ${currentStepConfig.color} transition-all duration-500 rounded-full`}
            style={{ width: `${currentStepConfig.progress}%` }}
          />
        </div>
      </div>

      {/* System Info */}
      <div className="bg-bg-secondary rounded-2xl border border-border-color p-6 mb-6">
        <h3 className="text-xs font-semibold text-text-secondary/60 uppercase tracking-widest mb-5">
          System Info
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-text-secondary mb-1">Film ID</div>
            <div className="text-sm font-mono text-accent-purple font-medium">{film_id}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary mb-1">Current Step</div>
            <div className="text-sm text-white font-medium">{currentStepConfig.label}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary mb-1">Last Updated</div>
            <div className="text-sm text-white">{formatTimestamp(timestamp)}</div>
          </div>
        </div>
      </div>

      {/* Film Details */}
      <div className="bg-bg-secondary rounded-2xl border border-border-color p-6">
        <h3 className="text-xs font-semibold text-text-secondary/60 uppercase tracking-widest mb-5">
          Film Details
        </h3>

        {/* Title - Large */}
        <div className="mb-8">
          <div className="text-xs text-text-secondary mb-2">작품 제목</div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {film_metadata.title_working}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetaCard
            icon={<Film className="w-4 h-4" />}
            label="Genre"
            value={film_metadata.genre}
          />
          <MetaCard
            icon={<Clock className="w-4 h-4" />}
            label="Duration"
            value={`${film_metadata.duration_minutes} min`}
          />
          <MetaCard
            icon={<Palette className="w-4 h-4" />}
            label="Style"
            value={film_metadata.style}
          />
          <MetaCard
            icon={<Monitor className="w-4 h-4" />}
            label="Medium"
            value={film_metadata.medium}
          />
          <MetaCard
            icon={<Calendar className="w-4 h-4" />}
            label="Era"
            value={film_metadata.era}
          />
          <MetaCard
            icon={<Monitor className="w-4 h-4" />}
            label="Aspect Ratio"
            value={film_metadata.aspect_ratio}
          />
          <MetaCard
            icon={<User className="w-4 h-4" />}
            label="Artist"
            value={film_metadata.artist || '(none)'}
            muted={!film_metadata.artist}
          />
        </div>
      </div>
    </div>
  );
}

interface MetaCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}

function MetaCard({ icon, label, value, muted }: MetaCardProps) {
  return (
    <div className="bg-bg-tertiary/50 rounded-xl p-4 hover:bg-bg-tertiary transition-colors">
      <div className="flex items-center gap-2 text-text-secondary mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className={`text-sm font-medium ${muted ? 'text-text-secondary/50 italic' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
