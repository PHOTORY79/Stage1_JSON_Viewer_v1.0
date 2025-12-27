import { useState } from 'react';
import { ScrollText, Copy, Check } from 'lucide-react';
import { Stage1JSON } from '../../types/stage1.types';

interface TreatmentViewProps {
  data: Stage1JSON;
}

export function TreatmentView({ data }: TreatmentViewProps) {
  const { treatment } = data.current_work;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const narrativeFunctionConfig: Record<string, { label: string; color: string; bg: string }> = {
    'exposition': { label: 'Exposition', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    'rising_action': { label: 'Rising Action', color: 'text-orange-400', bg: 'bg-orange-500/20' },
    'climax': { label: 'Climax', color: 'text-red-400', bg: 'bg-red-500/20' },
    'falling_action': { label: 'Falling Action', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    'resolution': { label: 'Resolution', color: 'text-green-400', bg: 'bg-green-500/20' },
    'conflict': { label: 'Conflict', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  };

  return (
    <div className="p-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple/30 to-accent-purple/10 
          flex items-center justify-center border border-accent-purple/20">
          <ScrollText className="w-7 h-7 text-accent-purple" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Treatment</h2>
          <p className="text-text-secondary">{treatment.treatment_title}</p>
        </div>
      </div>

      {/* Story Structure */}
      <div className="bg-bg-secondary rounded-2xl border border-border-color p-5 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
          <ScrollText className="w-5 h-5 text-accent-purple" />
        </div>
        <div>
          <div className="text-xs text-text-secondary uppercase tracking-wider mb-0.5">Story Structure</div>
          <div className="text-white font-medium">{treatment.story_structure_type}</div>
        </div>
      </div>

      {/* Sequences */}
      <div className="space-y-4">
        {treatment.sequences.map((seq, index) => {
          const funcConfig = narrativeFunctionConfig[seq.narrative_function] || 
            { label: seq.narrative_function, color: 'text-gray-400', bg: 'bg-gray-500/20' };
          
          return (
            <div 
              key={seq.sequence_id}
              className="bg-bg-secondary rounded-2xl border border-border-color overflow-hidden
                hover:border-accent-purple/30 transition-all duration-200"
            >
              <div className="flex items-center justify-between p-5 border-b border-border-color">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-purple/30 to-accent-purple/10 
                    flex items-center justify-center text-accent-purple font-bold text-lg">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-base font-semibold text-white">
                        {seq.sequence_id}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full ${funcConfig.bg} ${funcConfig.color} font-medium`}>
                        {funcConfig.label}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary">{seq.sequence_title}</div>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(seq.treatment_text, seq.sequence_id)}
                  className="p-2.5 rounded-xl hover:bg-bg-tertiary transition-colors"
                  title="복사"
                >
                  {copiedId === seq.sequence_id ? (
                    <Check className="w-5 h-5 text-accent-green" />
                  ) : (
                    <Copy className="w-5 h-5 text-text-secondary hover:text-white transition-colors" />
                  )}
                </button>
              </div>
              <div className="p-5">
                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {seq.treatment_text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
