import React from 'react';
import { X, ShieldCheck, Sparkles, Building2, BookOpen, Layers } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">About PackWise AI</h2>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                Smart India Hackathon • SIH26236
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs text-slate-700 leading-relaxed">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Problem Statement
            </span>
            <p className="font-bold text-slate-900 text-sm">
              SIH26236: AI-Based Intelligent Food Packaging Material Recommendation System for Food Commodities
            </p>
            <p className="text-slate-600 mt-1">
              Organization: <strong className="text-slate-800">Ministry of Food Processing Industries (MoFPI)</strong>
              <br />
              Theme: <span className="text-emerald-700 font-medium">Agriculture, FoodTech & Rural Development</span>
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Core Technical Capabilities
            </span>
            <ul className="space-y-1.5 list-disc list-inside text-slate-600">
              <li>
                <strong className="text-slate-800">Continuous Physical Engine:</strong> Real WVTR, OTR, and glass-transition (Tg) scoring without static bounds or hardcoded answers.
              </li>
              <li>
                <strong className="text-slate-800">Postharvest Fresh Produce Logic:</strong> Prevents anaerobic suffocation in respiring produce; prioritizes micro-perforated MAP and anti-fog technology.
              </li>
              <li>
                <strong className="text-slate-800">Gemini 2.5 Flash Integration:</strong> AI commodity auto-profiling with response schemas and contextual Q&A assistant.
              </li>
              <li>
                <strong className="text-slate-800">13 Industry Materials:</strong> Full physical profile database from flexible polyolefins to bio-polymers and high-barrier EVOH/Alu laminates.
              </li>
              <li>
                <strong className="text-slate-800">Dual Persistence:</strong> Backend Express API with JSON storage and localStorage offline resilience.
              </li>
            </ul>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
            <p className="font-semibold mb-1">Target MoFPI Impact:</p>
            India experiences substantial postharvest food loss (~15-20% in horticultural produce). PackWise AI accelerates informed material selection for food processors, rural FPOs, and packaging manufacturers to prevent spoilage and reduce plastic waste.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
