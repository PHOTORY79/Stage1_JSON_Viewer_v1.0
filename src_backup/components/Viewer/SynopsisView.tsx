import { BookOpen, Quote, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Stage1JSON } from '../../types/stage1.types';

interface SynopsisViewProps {
  data: Stage1JSON;
}

export function SynopsisView({ data }: SynopsisViewProps) {
  const { logline, synopsis } = data.current_work;
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const acts = [
    { id: 'act1', label: 'ACT 1', subtitle: '발단 (Setup)', content: synopsis.act1, color: 'from-blue-500/20 to-blue-500/5', accent: 'text-blue-400', border: 'border-blue-500/30' },
    { id: 'act2', label: 'ACT 2', subtitle: '전개 (Confrontation)', content: synopsis.act2, color: 'from-orange-500/20 to-orange-500/5', accent: 'text-orange-400', border: 'border-orange-500/30' },
    { id: 'act3', label: 'ACT 3', subtitle: '결말 (Resolution)', content: synopsis.act3, color: 'from-green-500/20 to-green-500/5', accent: 'text-green-400', border: 'border-green-500/30' },
  ];

  return (
    <div className="p-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple/30 to-accent-purple/10 
          flex items-center justify-center border border-accent-purple/20">
          <BookOpen className="w-7 h-7 text-accent-purple" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Synopsis</h2>
          <p className="text-text-secondary">로그라인 및 3막 시놉시스</p>
        </div>
      </div>

      {/* Logline */}
      <div className="relative bg-gradient-to-r from-accent-purple/15 to-accent-purple/5 
        border border-accent-purple/30 rounded-2xl p-6 mb-8 overflow-hidden">
        {/* Decorative quote mark */}
        <div className="absolute top-4 right-6 text-accent-purple/10">
          <Quote className="w-20 h-20" />
        </div>
        
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Quote className="w-4 h-4 text-accent-purple" />
              <span className="text-xs text-accent-purple font-semibold uppercase tracking-widest">
                Logline
              </span>
            </div>
            <p className="text-lg text-white leading-relaxed font-medium">{logline}</p>
          </div>
          <button
            onClick={() => copyToClipboard(logline, 'logline')}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors flex-shrink-0"
            title="복사"
          >
            {copiedSection === 'logline' ? (
              <Check className="w-5 h-5 text-accent-green" />
            ) : (
              <Copy className="w-5 h-5 text-text-secondary hover:text-white transition-colors" />
            )}
          </button>
        </div>
      </div>

      {/* 3 Acts */}
      <div className="space-y-4">
        {acts.map((act, index) => (
          <div 
            key={act.id}
            className={`bg-gradient-to-r ${act.color} rounded-2xl border ${act.border} overflow-hidden
              hover:scale-[1.01] transition-all duration-200`}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center 
                  text-xl font-bold ${act.accent}`}>
                  {index + 1}
                </div>
                <div>
                  <div className={`text-base font-bold ${act.accent}`}>{act.label}</div>
                  <div className="text-sm text-text-secondary">{act.subtitle}</div>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(act.content, act.id)}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                title="복사"
              >
                {copiedSection === act.id ? (
                  <Check className="w-5 h-5 text-accent-green" />
                ) : (
                  <Copy className="w-5 h-5 text-text-secondary hover:text-white transition-colors" />
                )}
              </button>
            </div>
            <div className="p-5">
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {act.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
