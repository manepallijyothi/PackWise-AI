import React, { useState } from 'react';
import { AnalysisResult, MaterialScore } from '../types/packaging';
import { PackWiseAssistant } from './PackWiseAssistant';
import { CompareModal } from './CompareModal';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  SlidersHorizontal,
  Scale,
  ArrowRight,
  Leaf,
  Check,
  X,
  Droplets,
  Wind,
  Thermometer,
  Calendar,
  Layers,
  Lock
} from 'lucide-react';

interface RecommendationsTabProps {
  result: AnalysisResult;
  onReAnalyze: () => void;
  onSaveHistory: (result: AnalysisResult) => void;
  isSaved: boolean;
}

export const RecommendationsTab: React.FC<RecommendationsTabProps> = ({
  result,
  onReAnalyze,
  onSaveHistory,
  isSaved
}) => {
  const { isAuthenticated, openLoginModal } = useAuth();
  const [showDetailedReasoning, setShowDetailedReasoning] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  const { input, primaryRecommendation, alternatives, decisionFactors, recommendedPackagingApproach, freshProduceWarning } = result;
  const commodityName = input.customName || input.commodityType;

  const handleSaveClick = () => {
    if (!isAuthenticated) {
      openLoginModal(() => {
        onSaveHistory(result);
      });
      return;
    }
    onSaveHistory(result);
  };

  // SVG Circular Gauge calculation
  const score = primaryRecommendation.compatibility;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="pb-24 pt-1 max-w-xl mx-auto space-y-5">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Analysis Complete
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
            Packaging Analysis Result
          </h1>
        </div>

        <button
          onClick={onReAnalyze}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Edit Inputs</span>
        </button>
      </div>

      {/* Commodity Summary Card */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Commodity</span>
          <h2 className="text-sm font-bold text-slate-900">{commodityName}</h2>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Shelf Life</span>
            <p className="font-bold text-slate-800">{input.targetShelfLifeDays} Days</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Storage</span>
            <p className="font-bold text-slate-800">
              {input.storageType} ({input.storageTemperature}°C)
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Moisture</span>
            <p className="font-bold text-slate-800">{input.moisture}%</p>
          </div>
        </div>
      </div>

      {/* Fresh Fruit & Vegetable Caution Banner */}
      {freshProduceWarning && (
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-bold text-amber-900">Postharvest Respiration Notice</span>
          </div>
          <p className="text-xs leading-relaxed text-amber-800">{freshProduceWarning}</p>
          <div className="pt-1">
            <span className="text-[11px] font-semibold text-amber-900">
              Recommended Packaging Approach:{' '}
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
              {recommendedPackagingApproach}
            </span>
          </div>
        </div>
      )}

      {/* TOP PRIMARY RECOMMENDATION CARD */}
      <div className="bg-white rounded-3xl p-5 border-2 border-emerald-500/40 shadow-md shadow-emerald-500/10 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Top Recommendation</span>
        </div>

        {/* Header with Circular Score Ring */}
        <div className="flex items-center gap-4 pt-1">
          {/* Circular SVG Ring */}
          <div className="relative w-22 h-22 flex items-center justify-center shrink-0">
            <svg className="w-22 h-22 transform -rotate-90">
              <circle
                cx="44"
                cy="44"
                r={radius}
                className="text-slate-100"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="44"
                cy="44"
                r={radius}
                className="text-emerald-500 transition-all duration-1000 ease-out"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-slate-900 leading-none">{score}%</span>
              <span className="text-[9px] font-bold text-emerald-700 uppercase mt-0.5">Match</span>
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {primaryRecommendation.matchClassification}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {primaryRecommendation.material.category}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 leading-snug">
              {primaryRecommendation.material.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Cost: <strong className="text-slate-700">{primaryRecommendation.material.relativeCost}</strong> • Sustainability:{' '}
              <strong className="text-emerald-700">{primaryRecommendation.material.sustainability}</strong>
            </p>
          </div>
        </div>

        {/* Why this was recommended (Dynamic Explainability) */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-800 block mb-2">
            Why this was recommended:
          </span>
          <div className="space-y-1.5">
            {primaryRecommendation.dynamicReasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Advantages & Limitations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Key Advantages</span>
            <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
              {primaryRecommendation.material.advantages.slice(0, 2).map((adv, i) => (
                <li key={i}>{adv}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Limitations</span>
            <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
              {primaryRecommendation.material.limitations.slice(0, 2).map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* EXPLAINABLE AI: DECISION FACTORS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              AI Decision Factors
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Physiological weighting</span>
        </div>

        <div className="space-y-2.5 pt-1">
          {decisionFactors.map((factor) => (
            <div key={factor.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{factor.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-[11px]">{factor.score}%</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      factor.level === 'High'
                        ? 'bg-emerald-100 text-emerald-800'
                        : factor.level === 'Medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {factor.level}
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    factor.level === 'High' ? 'bg-emerald-500' : factor.level === 'Medium' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Reasoning Accordion */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowDetailedReasoning(!showDetailedReasoning)}
            className="w-full flex items-center justify-between text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors py-1"
          >
            <span>{showDetailedReasoning ? 'Hide detailed reasoning' : 'View detailed reasoning'}</span>
            {showDetailedReasoning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetailedReasoning && (
            <div className="mt-2.5 space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {decisionFactors.map((factor) => (
                <div key={factor.id} className="border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0">
                  <span className="font-bold text-slate-800">{factor.name}:</span>{' '}
                  <span className="text-slate-600">{factor.explanation}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ALTERNATIVE MATERIALS (2-3 Alternatives) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Alternative Packaging Materials
          </h2>
          <button
            onClick={() => setIsCompareOpen(true)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Compare Materials</span>
          </button>
        </div>

        <div className="space-y-3">
          {alternatives.map((alt, idx) => (
            <div
              key={alt.material.id}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Alternative {idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        alt.material.sustainability === 'Bio-compostable'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {alt.material.sustainability}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{alt.material.name}</h3>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-slate-900">{alt.compatibility}%</div>
                  <span className="text-[10px] text-slate-400">Compatibility</span>
                </div>
              </div>

              {/* Dynamic Reason */}
              {alt.dynamicReasons.length > 0 && (
                <p className="text-xs text-slate-600 leading-snug">
                  {alt.dynamicReasons[0]}
                </p>
              )}

              {/* Warnings if any */}
              {alt.warnings.length > 0 && (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{alt.warnings[0]}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                <span>Cost: <strong className="text-slate-700">{alt.material.relativeCost}</strong></span>
                <span>Suitable Storage: <strong className="text-slate-700">{input.storageType}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI PACKAGING ASSISTANT (Powered by Gemini 2.5 Flash) */}
      <PackWiseAssistant
        commodity={input}
        primaryRecommendation={primaryRecommendation}
        decisionFactors={decisionFactors}
        analysisResult={result}
      />

      {/* ACTION BAR: SAVE ANALYSIS & COMPARE */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={handleSaveClick}
          disabled={isSaved}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
            isSaved
              ? 'bg-slate-100 text-slate-500 border border-slate-200'
              : !isAuthenticated
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
          }`}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="w-4 h-4" />
              <span>Analysis Saved in History</span>
            </>
          ) : !isAuthenticated ? (
            <>
              <Lock className="w-4 h-4 text-emerald-200" />
              <span>Sign In to Save Analysis</span>
            </>
          ) : (
            <>
              <BookmarkCheck className="w-4 h-4" />
              <span>Save Analysis to History</span>
            </>
          )}
        </button>

        <button
          onClick={() => setIsCompareOpen(true)}
          className="py-3 px-4 rounded-xl font-bold text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Scale className="w-4 h-4 text-emerald-600" />
          <span>Compare Materials Matrix</span>
        </button>
      </div>

      {/* MANDATORY FOOTER / DISCLAIMER */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px] leading-relaxed text-center">
        “PackWise AI provides decision-support recommendations based on entered commodity and storage parameters. Final packaging selection should be validated through food-safety, regulatory, material-compatibility and shelf-life testing.”
      </div>

      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        initialMaterialScores={result.allRankedMaterials}
      />
    </div>
  );
};
