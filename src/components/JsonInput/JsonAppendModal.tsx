import React from 'react';
import { X } from 'lucide-react';
import { JsonInput } from './JsonInput';
import { ParsedFile } from '../../utils/jsonMerger';

interface JsonAppendModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAppend: (files: ParsedFile[]) => void;
}

export function JsonAppendModal({ isOpen, onClose, onAppend }: JsonAppendModalProps) {
    if (!isOpen) return null;

    const handleJsonLoad = (input: string | ParsedFile[]) => {
        // If input is string, parse it into ParsedFile format
        if (typeof input === 'string') {
            try {
                const parsed = JSON.parse(input);
                const file: ParsedFile = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'Pasted JSON',
                    content: input,
                    parsed: parsed,
                    type: 'asset', // Default to asset for appended files unless clearer logic exists
                    filmId: parsed.film_id || 'UNKNOWN'
                };
                onAppend([file]);
            } catch (e) {
                alert("Invalid JSON");
            }
        } else {
            onAppend(input);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl bg-bg-primary border border-white/10 rounded-xl shadow-2xl flex flex-col h-[85vh] relative overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-bg-secondary">
                    <div>
                        <h3 className="text-lg font-bold text-white">JSON 추가 (Append)</h3>
                        <p className="text-sm text-gray-400">현재 프로젝트에 추가할 자산 파일(캐릭터, 장소 등)을 업로드하세요.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body - Reusing JsonInput but effectively it will be "modal in modal" if we are not careful. 
            JsonInput handles its own drag-drop and paste modal. 
            However, JsonInput is designed to fill the container. 
        */}
                <div className="flex-1 overflow-hidden relative">
                    <JsonInput onJsonLoad={handleJsonLoad} />
                </div>
            </div>
        </div>
    );
}
