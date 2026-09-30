import React, { useState } from 'react';
import {
  Truck,
  Box,
  Layers,
  Thermometer,
  Wind,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  ShieldAlert,
  Droplets,
  Clock
} from 'lucide-react';
import { FarmerContext, PackagingAsset, FarmerLanguage } from '../../types/farmer';
import { AnalysisResult } from '../../types/packaging';
import { generatePackingAndTransportPlan } from '../../engine/farmerPlanGenerator';

interface PackingTransportPlanContainerProps {
  crop: string;
  farmerContext: FarmerContext;
  asset: PackagingAsset;
  recommendation: AnalysisResult;
  language: FarmerLanguage;
}

export const PackingTransportPlanContainer: React.FC<PackingTransportPlanContainerProps> = ({
  crop,
  farmerContext,
  asset,
  recommendation,
  language
}) => {
  const plan = generatePackingAndTransportPlan(crop, farmerContext, asset, recommendation);
  const [activeTab, setActiveTab] = useState<'plan' | 'dos_donts'>('plan');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Container Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Container 4 of 5 • Logistics Protocol
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                Transit: {farmerContext.transportDuration || 8}h
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {language === 'te' ? 'ప్యాకింగ్ మరియు రవాణా ప్రణాళిక' : 'Packing & Transport Logistics Plan'}
            </h2>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'plan'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'te' ? 'వివరాలు' : 'Specifications'}
          </button>
          <button
            onClick={() => setActiveTab('dos_donts')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'dos_donts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'te' ? 'చేయవలసినవి / చేయకూడనివి' : '✓ DO & ✕ DON\'T'}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {activeTab === 'plan' ? (
          <div className="space-y-6">
            {/* 1. PACKING SPECIFICATIONS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Box className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === 'te' ? '1. ప్యాకింగ్ వివరాలు (PACKING)' : '1. Packing Specifications'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Quantity per Package
                  </span>
                  <p className="font-semibold text-slate-800">{plan.packing.quantityPerPackage}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Fill Level
                  </span>
                  <p className="font-semibold text-slate-800">{plan.packing.fillLevel}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Arrangement & Layers
                  </span>
                  <p className="font-semibold text-slate-800">
                    {plan.packing.arrangement} • {plan.packing.layers}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Cushioning & Separation
                  </span>
                  <p className="font-semibold text-slate-800">
                    {plan.packing.cushioning} • {plan.packing.separation}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. TRANSPORT SPECIFICATIONS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Truck className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === 'te' ? '2. రవాణా మరియు నిల్వ మార్గదర్శకాలు (TRANSPORT)' : '2. Transport & Stacking Logistics'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Handling & Stacking
                  </span>
                  <p className="font-semibold text-slate-800">
                    {plan.transport.handling} • {plan.transport.stacking}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Compression Precautions
                  </span>
                  <p className="font-semibold text-slate-800">
                    {plan.transport.compressionPrecautions}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Temperature & Weather Guidance
                  </span>
                  <p className="font-semibold text-slate-800">
                    {plan.transport.temperatureConsiderations} • {plan.transport.moistureConsiderations}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Air Circulation & Holding
                  </span>
                  <p className="font-semibold text-slate-800">
                    {plan.transport.ventilationPrecautions} • {plan.transport.storageGuidance}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* DOs AND DON'Ts VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* DO COLUMN */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-extrabold text-emerald-950 uppercase tracking-wide">
                  ✓ DO (తప్పనిసరిగా చేయవలసినవి)
                </h4>
              </div>
              <ul className="space-y-2 text-emerald-950 font-medium">
                {plan.dos.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DON'T COLUMN */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-rose-200">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h4 className="text-sm font-extrabold text-rose-950 uppercase tracking-wide">
                  ✕ DON'T (ఎట్టి పరిస్థితుల్లోనూ చేయకూడనివి)
                </h4>
              </div>
              <ul className="space-y-2 text-rose-950 font-medium">
                {plan.donts.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
