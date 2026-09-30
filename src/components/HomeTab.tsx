import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplets,
  Thermometer,
  Wind,
  Clock,
  Apple,
  Wheat,
  Flame,
  History,
  Sprout,
  Mic,
  Radio,
  Utensils
} from 'lucide-react';
import { HistoryRecord } from '../types/packaging';

interface HomeTabProps {
  onStartAnalysis: () => void;
  onSelectPreset: (presetId: string) => void;
  onViewHistoryItem: (record: HistoryRecord) => void;
  onGoToLogistics?: () => void;
  onGoToFarmer?: () => void;
  onGoToRestaurant?: () => void;
  recentHistory: HistoryRecord[];
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onStartAnalysis,
  onSelectPreset,
  onViewHistoryItem,
  onGoToLogistics,
  onGoToFarmer,
  onGoToRestaurant,
  recentHistory
}) => {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const insights = [
    {
      title: 'What happens if moisture increases?',
      icon: Droplets,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      summary: 'High moisture accelerates mold and requires anti-fog micro-breathability.',
      detail:
        'When internal commodity moisture exceeds 80%, enclosed relative humidity reaches saturation. Non-breathable films cause water droplet condensation, triggering Botrytis mold and slime. In dry goods (e.g., milk powder or chips), higher external humidity causes hygroscopic caking, requiring ultra-low WVTR (< 1.0 g/m²/day).'
    },
    {
      title: 'What happens if storage temperature changes?',
      icon: Thermometer,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      summary: 'Glass transition (Tg) dictates polymer brittleness and gas transmission kinetics.',
      detail:
        'Per the Arrhenius relationship, gas and vapor permeation through polymers increases 30–50% for every 10°C rise. In sub-zero cold chains (-18°C), materials with glass transition temperatures above 0°C (like unplasticized PET or PLA) experience cold embrittlement, pinhole flex cracks, and seal failure.'
    },
    {
      title: 'Why does respiration matter?',
      icon: Wind,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      summary: 'Living produce suffocates in airtight packaging; gas exchange must balance O₂ and CO₂.',
      detail:
        'Harvested horticultural commodities continue aerobic respiration: Glucose + 6O₂ → 6CO₂ + 6H₂O + Heat. Sealed airtight pouches deplete O₂ below the 1% extinction threshold, triggering anaerobic fermentation. This causes noxious ethanol off-flavors, tissue browning, and rapid decay. Laser micro-perforated MAP film is vital.'
    },
    {
      title: 'What happens when shelf life increases?',
      icon: Clock,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      summary: 'Extended shelf life shifts packaging from monolayer films to high-barrier laminates.',
      detail:
        'Over 30–60+ days, cumulative gas permeation induces severe lipid auto-oxidation in fatty foods and textural loss in staples. Long-life ambient commodities require multi-layer barrier films (e.g., Metallized BOPP, EVOH, or Aluminium Foil tri-laminates) coupled with inert gas flushing (N₂).'
    }
  ];

  return (
    <div className="space-y-6 pb-24 pt-2">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-emerald-50/80 via-white to-white rounded-2xl p-5 border border-emerald-100/80 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Smart FoodTech Decision Engine</span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
          PackWise AI
        </h1>
        <p className="text-sm font-medium text-emerald-700 mt-0.5">
          Smart packaging decisions powered by intelligent analysis
        </p>

        <p className="text-xs text-slate-600 mt-3 leading-relaxed">
          Find suitable packaging materials based on commodity properties, storage conditions,
          transportation and target shelf life.
        </p>

        {/* Two Separate User Levels — Clean & Professional */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Select Your User Flow:
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">2 Specialized Levels</span>
          </div>

          {/* Level 1: Farmer / Producer */}
          {onGoToFarmer && (
            <button
              onClick={onGoToFarmer}
              className="w-full p-4 rounded-2xl bg-white hover:bg-emerald-50/50 border-2 border-emerald-600 text-slate-900 transition-all cursor-pointer shadow-xs group text-left"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mic className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        LEVEL 1
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Farmer / Producer Level
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                      "Talk to FoodPack AI" • Voice interaction, dynamic questions & post-harvest packaging
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          )}

          {/* Level 2: Restaurant / Café / Takeaway */}
          {onGoToRestaurant && (
            <button
              onClick={onGoToRestaurant}
              className="w-full p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 transition-all cursor-pointer shadow-xs group text-left"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Utensils className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        LEVEL 2
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Restaurant / Café / Takeaway Level
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                      Upload Food Photo or Take Camera Shot • Instant takeaway packaging recommendation in seconds
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          )}

          {/* Additional Tooling: Direct Parameters Analyzer */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={onStartAnalysis}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Manual FoodTech Analyzer</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>

            {onGoToLogistics && (
              <button
                onClick={onGoToLogistics}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>WMS Packing</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Analysis Presets */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Quick Analysis Presets
          </h2>
          <span className="text-[11px] text-emerald-600 font-medium">Ready to test</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => onSelectPreset('tomato')}
            className="flex flex-col items-start p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Apple className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Fresh Tomato</span>
            <span className="text-[10px] text-slate-500 mt-0.5">High Respiration</span>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1">4°C Chilled</span>
          </button>

          <button
            onClick={() => onSelectPreset('rice')}
            className="flex flex-col items-start p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Wheat className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Basmati Rice</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Dry Hygroscopic</span>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1">Ambient 60d</span>
          </button>

          <button
            onClick={() => onSelectPreset('potato-chips')}
            className="flex flex-col items-start p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Potato Chips</span>
            <span className="text-[10px] text-slate-500 mt-0.5">35% Fat / Crisp</span>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1">Nitrogen MAP</span>
          </button>
        </div>
      </div>

      {/* Recent Recommendations Preview */}
      {recentHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Recommendations
            </h2>
            <span className="text-[11px] text-slate-400">{recentHistory.length} saved</span>
          </div>

          <div className="space-y-2">
            {recentHistory.slice(0, 2).map((item) => (
              <div
                key={item.id}
                onClick={() => onViewHistoryItem(item)}
                className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center">
                    {item.compatibility}%
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{item.commodityName}</h3>
                    <p className="text-[11px] text-slate-500">
                      Recommended: <span className="font-medium text-slate-700">{item.recommendedMaterial}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {item.storageType}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{item.shelfLifeDays}d target</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How does PackWise AI work? (3 Simple Steps) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
          How does PackWise AI work?
        </h2>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Enter commodity information</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Provide moisture, fat, pH, postharvest respiration kinetics, and storage logistics.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Analyze packaging requirements</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                The food science scoring engine computes continuous WVTR, OTR, and glass-transition compatibility.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Get an explainable recommendation</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Receive the top material, dynamic biochemical reasoning, alternative films, and interactive AI Q&A.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Packaging Insights (Interactive Curiosity Section) */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Packaging Insights
            </h2>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
              Interactive
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Tap to learn</span>
        </div>

        <div className="space-y-2">
          {insights.map((item, idx) => {
            const Icon = item.icon;
            const isExpanded = expandedInsight === idx;

            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setExpandedInsight(isExpanded ? null : idx)}
                  className="w-full p-3 text-left flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${item.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">{item.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-xs text-slate-700 font-normal leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
