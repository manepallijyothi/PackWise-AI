import React, { useState, useMemo } from 'react';
import {
  FarmerContext,
  FarmerLanguage,
  PackagingAsset
} from '../../types/farmer';
import { CommodityInput, AnalysisResult } from '../../types/packaging';
import { PRESET_COMMODITIES } from '../../data/presetCommodities';
import { calculateAnalysisResult } from '../../engine/recommendationEngine';
import { resolvePackagingAsset } from '../../data/packagingAssets';

// The EXACT FIVE Connected Functional Containers
import { GeminiLiveFarmerVoice } from './GeminiLiveFarmerVoice';
import { RecommendedPackagingContainer } from './RecommendedPackagingContainer';
import { HowToPackContainer } from './HowToPackContainer';
import { PackingTransportPlanContainer } from './PackingTransportPlanContainer';
import { RecommendationReportContainer } from './RecommendationReportContainer';

import { Sprout, Mic, Package, ClipboardList, Truck, FileText, CheckCircle2 } from 'lucide-react';

interface FarmerPostHarvestTabProps {
  onSaveToHistory?: (result: AnalysisResult) => void;
}

export const FarmerPostHarvestTab: React.FC<FarmerPostHarvestTabProps> = ({ onSaveToHistory }) => {
  // Shared persistent Farmer Language: 'en' | 'te'
  const [language, setLanguage] = useState<FarmerLanguage>('en');

  // ONE Persistent Shared FarmerContext
  const [farmerContext, setFarmerContext] = useState<FarmerContext>({
    crop: 'Tomato',
    quantity: 70,
    freshness: 'fresh',
    transportDuration: 8,
    refrigerationAvailable: false,
    ambientTemperature: 28,
    storageType: 'Ambient',
    confirmedFields: ['crop', 'quantity', 'transportDuration', 'refrigerationAvailable'],
    unknownFields: [],
    assumptions: ['Ambient daytime road temperature 28°C']
  });

  // Map FarmerContext to CommodityInput for the FoodTech Recommendation Engine
  const commodityInput: CommodityInput = useMemo(() => {
    const cropName = (farmerContext.crop || 'Tomato').trim();
    const preset = PRESET_COMMODITIES.find((p) =>
      p.name.toLowerCase().includes(cropName.toLowerCase())
    );

    const isRefrigerated = Boolean(farmerContext.refrigerationAvailable);
    const transportHours = farmerContext.transportDuration || 8;
    const transportDays = Math.max(1, Math.ceil(transportHours / 24));

    if (preset) {
      return {
        ...preset.defaultValues,
        commodityType: preset.name,
        customName: cropName,
        storageTemperature: isRefrigerated ? 4 : (farmerContext.ambientTemperature || 28),
        storageType: isRefrigerated ? 'Chilled' : 'Ambient',
        transportationCondition: isRefrigerated ? 'Refrigerated' : 'Normal',
        transportationDurationDays: transportDays,
        targetShelfLifeDays: Math.max(transportDays + 3, 7),
        isFreshProduce: true
      };
    }

    // Default horticultural profile
    return {
      commodityType: 'Custom Commodity',
      customName: cropName,
      moisture: 90,
      oilFat: 0.3,
      pH: 4.5,
      respirationRate: 'High',
      targetShelfLifeDays: Math.max(transportDays + 3, 7),
      storageTemperature: isRefrigerated ? 4 : (farmerContext.ambientTemperature || 28),
      relativeHumidity: 85,
      storageType: isRefrigerated ? 'Chilled' : 'Ambient',
      transportationCondition: isRefrigerated ? 'Refrigerated' : 'Normal',
      transportationDurationDays: transportDays,
      isFreshProduce: true
    };
  }, [farmerContext]);

  // ONE Actual Recommendation Result from the FOODPACK Recommendation Engine
  const recommendationResult: AnalysisResult = useMemo(() => {
    return calculateAnalysisResult(commodityInput);
  }, [commodityInput]);

  // Physical Packaging Asset with real photography & verified supplier link
  const packagingAsset: PackagingAsset = useMemo(() => {
    return resolvePackagingAsset(
      recommendationResult.primaryRecommendation.material.id,
      commodityInput
    );
  }, [recommendationResult, commodityInput]);

  const handleSaveReport = () => {
    if (onSaveToHistory) {
      onSaveToHistory(recommendationResult);
    }
  };

  const stepsList = [
    { id: 'container-1-voice', label: '1. Live Voice', icon: Mic },
    { id: 'container-2-recommendation', label: '2. Packaging', icon: Package },
    { id: 'container-3-how-to-pack', label: '3. How to Pack', icon: ClipboardList },
    { id: 'container-4-transport-plan', label: '4. Transport', icon: Truck },
    { id: 'container-5-report', label: '5. Report', icon: FileText }
  ];

  const scrollToStep = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="pb-28 pt-1 max-w-2xl mx-auto space-y-6">
      {/* Page Title & MoFPI Level 1 Header - Minimal & Professional */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            <span>LEVEL 1 — FARMER POST-HARVEST PACKAGING ASSISTANT</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Ministry of Food Processing Industries • SIH26236
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {language === 'te'
              ? 'రైతు కోత అనంతర ప్యాకేజింగ్ సలహా వ్యవస్థ'
              : 'Farmer Post-Harvest Packaging Advisory'}
          </h1>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {language === 'te'
              ? 'జెమిని లైవ్ వాయిస్ ద్వారా పంట వివరాలు మాట్లాడండి. సిఫార్సు చేయబడిన ప్యాకేజింగ్, ప్యాకింగ్ విధానం, రవాణా ప్రణాళిక మరియు నివేదిక స్వయంచాలకంగా నవీకరించబడతాయి.'
              : 'Speak naturally in Telugu or English. Your conversation dynamically drives the FoodPack recommendation engine, automatically generating validated packaging, packing instructions, and transport plans.'}
          </p>
        </div>

        {/* Clean Workflow Navigation Steps */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 overflow-x-auto">
          {stepsList.map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => scrollToStep(s.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors shrink-0 cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5 text-emerald-600" />
                <span>{s.label}</span>
                {idx < stepsList.length - 1 && (
                  <span className="text-slate-300 ml-1">→</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================
          CONTAINER 1: GEMINI LIVE FARMER VOICE
          ==================================================== */}
      <section id="container-1-voice" className="scroll-mt-18">
        <GeminiLiveFarmerVoice
          farmerContext={farmerContext}
          onUpdateFarmerContext={setFarmerContext}
          language={language}
          onChangeLanguage={setLanguage}
        />
      </section>

      {/* Subtle Step Divider */}
      <div className="flex items-center justify-center -my-2">
        <div className="h-6 w-px bg-slate-200" />
      </div>

      {/* ====================================================
          CONTAINER 2: RECOMMENDED PACKAGING
          ==================================================== */}
      <section id="container-2-recommendation" className="scroll-mt-18">
        <RecommendedPackagingContainer
          farmerContext={farmerContext}
          recommendation={recommendationResult}
          asset={packagingAsset}
          language={language}
        />
      </section>

      {/* Subtle Step Divider */}
      <div className="flex items-center justify-center -my-2">
        <div className="h-6 w-px bg-slate-200" />
      </div>

      {/* ====================================================
          CONTAINER 3: HOW TO PACK
          ==================================================== */}
      <section id="container-3-how-to-pack" className="scroll-mt-18">
        <HowToPackContainer
          crop={farmerContext.crop || 'Produce'}
          farmerContext={farmerContext}
          asset={packagingAsset}
          recommendation={recommendationResult}
          language={language}
          onChangeLanguage={setLanguage}
        />
      </section>

      {/* Subtle Step Divider */}
      <div className="flex items-center justify-center -my-2">
        <div className="h-6 w-px bg-slate-200" />
      </div>

      {/* ====================================================
          CONTAINER 4: PACKING & TRANSPORT PLAN
          ==================================================== */}
      <section id="container-4-transport-plan" className="scroll-mt-18">
        <PackingTransportPlanContainer
          crop={farmerContext.crop || 'Produce'}
          farmerContext={farmerContext}
          asset={packagingAsset}
          recommendation={recommendationResult}
          language={language}
        />
      </section>

      {/* Subtle Step Divider */}
      <div className="flex items-center justify-center -my-2">
        <div className="h-6 w-px bg-slate-200" />
      </div>

      {/* ====================================================
          CONTAINER 5: RECOMMENDATION REPORT
          ==================================================== */}
      <section id="container-5-report" className="scroll-mt-18">
        <RecommendationReportContainer
          farmerContext={farmerContext}
          recommendation={recommendationResult}
          asset={packagingAsset}
          language={language}
          onSaveToHistory={handleSaveReport}
        />
      </section>
    </div>
  );
};
