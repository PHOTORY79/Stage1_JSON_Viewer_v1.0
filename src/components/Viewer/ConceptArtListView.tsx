import { Stage1JSON } from '../../types/stage1.types';
import { Users, MapPin, Box } from 'lucide-react';

interface ConceptArtListViewProps {
    data: Stage1JSON;
}

interface MappingTableProps {
    title: string;
    icon: React.ReactNode;
    items: Record<string, string>;
    emptyMessage: string;
}

function MappingTable({ title, icon, items, emptyMessage }: MappingTableProps) {
    const entries = Object.entries(items);

    return (
        <div className="bg-bg-secondary rounded-2xl border border-border-color overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-color flex items-center gap-3">
                <span className="text-accent-purple">{icon}</span>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <span className="ml-auto text-xs text-text-secondary bg-bg-tertiary px-2 py-1 rounded-full">
                    {entries.length}개
                </span>
            </div>

            {/* Table */}
            {entries.length === 0 ? (
                <div className="px-6 py-8 text-center text-text-secondary text-sm">
                    {emptyMessage}
                </div>
            ) : (
                <table className="w-full">
                    <thead>
                        <tr className="text-xs text-text-secondary/60 uppercase tracking-wider">
                            <th className="text-left px-6 py-3 font-semibold">English Key</th>
                            <th className="text-left px-6 py-3 font-semibold">한글 명칭</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(([key, value], idx) => (
                            <tr
                                key={key}
                                className={`border-t border-border-color/50 hover:bg-bg-tertiary/50 transition-colors
                  ${idx % 2 === 0 ? '' : 'bg-bg-tertiary/20'}`}
                            >
                                <td className="px-6 py-3 text-sm font-mono text-accent-purple">{key}</td>
                                <td className="px-6 py-3 text-sm text-white">{value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export function ConceptArtListView({ data }: ConceptArtListViewProps) {
    const { concept_art_list } = data;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            {/* Page Title */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Concept Art List</h2>
                <p className="text-sm text-text-secondary">
                    등장 요소 영문-한글 매핑 목록입니다. 샷 분할 시 scene_conceptart 생성에 참조됩니다.
                </p>
            </div>

            <MappingTable
                title="Characters (캐릭터)"
                icon={<Users className="w-5 h-5" />}
                items={concept_art_list.characters || {}}
                emptyMessage="등록된 캐릭터가 없습니다."
            />

            <MappingTable
                title="Locations (장소)"
                icon={<MapPin className="w-5 h-5" />}
                items={concept_art_list.locations || {}}
                emptyMessage="등록된 장소가 없습니다."
            />

            <MappingTable
                title="Props (소품)"
                icon={<Box className="w-5 h-5" />}
                items={concept_art_list.props || {}}
                emptyMessage="등록된 소품이 없습니다."
            />
        </div>
    );
}
