import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Share2,
  Bookmark,
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
  Calendar,
  Truck,
  Box,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { FarmerContext, PackagingAsset, FarmerLanguage } from '../../types/farmer';
import { AnalysisResult } from '../../types/packaging';
import { buildRecommendationReport } from '../../engine/farmerPlanGenerator';

interface RecommendationReportContainerProps {
  farmerContext: FarmerContext;
  recommendation: AnalysisResult;
  asset: PackagingAsset;
  language: FarmerLanguage;
  onSaveToHistory?: () => void;
}

export const RecommendationReportContainer: React.FC<RecommendationReportContainerProps> = ({
  farmerContext,
  recommendation,
  asset,
  language,
  onSaveToHistory
}) => {
  const report = buildRecommendationReport(farmerContext, recommendation, asset);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const copyWhatsAppAdvisory = (lang: FarmerLanguage) => {
    const textToCopy = lang === 'te' ? report.whatsappShareTextTe : report.whatsappShareTextEn;
    navigator.clipboard.writeText(textToCopy);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    if (onSaveToHistory) {
      onSaveToHistory();
    }
    setIsSaved(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all print:shadow-none print:border-none">
      {/* Container Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Container 5 of 5 • Official Advisory Report
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                MoFPI SIH26236
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {language === 'te' ? 'రైతు పోస్ట్-హార్వెస్ట్ సిఫార్సు నివేదిక' : 'Farmer Post-Harvest Recommendation Report'}
            </h2>
          </div>
        </div>

        <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-xl text-slate-700 border border-slate-200">
          {report.reportId}
        </span>
      </div>

      <div className="p-5 space-y-6">
        {/* Loss Prevention & Package Count Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
              Packages Needed
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-950">
                {report.estimatedPackagesNeeded}
              </span>
              <span className="text-xs font-bold text-emerald-800">
                units ({asset.capacityKg} kg each)
              </span>
            </div>
            <p className="text-[10px] text-emerald-700 mt-1">
              For {farmerContext.quantity || 70} kg total harvest
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block mb-1">
              Loss Reduction Impact
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-sky-950">
                ~{report.expectedLossReductionPercent}%
              </span>
              <span className="text-xs font-bold text-sky-800">savings</span>
            </div>
            <p className="text-[10px] text-sky-700 mt-1">
              Avoids {Math.round((farmerContext.quantity || 70) * 0.24)} kg transit rotting
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block mb-1">
              Shelf Life Extension
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-purple-950">
                +{report.estimatedShelfLifeExtensionDays}
              </span>
              <span className="text-xs font-bold text-purple-800">Days</span>
            </div>
            <p className="text-[10px] text-purple-700 mt-1">
              Vs. traditional non-perforated gunny sacks
            </p>
          </div>
        </div>

        {/* Structured Session Details */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Session Audit & Farmer Inputs
            </span>
            <span className="text-slate-500 text-[11px]">{report.generatedAt}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-400 block text-[10px]">Crop & Variety:</span>
              <span className="font-semibold text-slate-800">
                {farmerContext.crop || 'Produce'} {farmerContext.variety ? `(${farmerContext.variety})` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Batch Quantity:</span>
              <span className="font-semibold text-slate-800">{farmerContext.quantity || 70} kg</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Transport Duration:</span>
              <span className="font-semibold text-slate-800">{farmerContext.transportDuration || 8} hours</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Storage Condition:</span>
              <span className="font-semibold text-slate-800">
                {farmerContext.storageType || 'Ambient'} ({farmerContext.refrigerationAvailable ? 'Refrigerated' : 'Uncooled'})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Target Buyer:</span>
              <span className="font-semibold text-slate-800">{farmerContext.targetBuyer || 'Local Mandi / APMC'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Recommended Material:</span>
              <span className="font-semibold text-emerald-800">{asset.name}</span>
            </div>
          </div>

          {/* Confirmed vs Assumptions */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-4 text-[11px]">
            <div>
              <span className="font-bold text-slate-600">Confirmed Fields: </span>
              <span className="text-emerald-700 font-medium">
                {farmerContext.confirmedFields?.join(', ') || 'crop, quantity, transportDuration'}
              </span>
            </div>
            {farmerContext.unknownFields && farmerContext.unknownFields.length > 0 && (
              <div>
                <span className="font-bold text-slate-600">Assumptions: </span>
                <span className="text-slate-500">
                  Default {farmerContext.ambientTemperature || 28}°C ambient road temperature
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: Print, WhatsApp, Save */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => copyWhatsAppAdvisory(language)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              {copiedWhatsapp ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copiedWhatsapp ? 'Copied to Clipboard!' : 'Share WhatsApp Summary'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print / PDF</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSaved
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>{isSaved ? 'Advisory Saved' : 'Save to History'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
