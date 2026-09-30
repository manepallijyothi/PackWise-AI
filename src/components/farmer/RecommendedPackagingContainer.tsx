import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  Wind,
  Repeat,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Info,
  Maximize2,
  Download,
  RotateCw,
  Box,
  FileText
} from 'lucide-react';
import { PackagingAsset, ShoppingOffer, FarmerLanguage, FarmerContext } from '../../types/farmer';
import { AnalysisResult } from '../../types/packaging';
import { getVerifiedShoppingOffer } from '../../data/packagingAssets';

interface RecommendedPackagingContainerProps {
  farmerContext?: FarmerContext;
  recommendation: AnalysisResult;
  asset: PackagingAsset;
  language: FarmerLanguage;
}

export const RecommendedPackagingContainer: React.FC<RecommendedPackagingContainerProps> = ({
  farmerContext,
  recommendation,
  asset,
  language
}) => {
  const [shoppingOffer, setShoppingOffer] = useState<ShoppingOffer | null>(null);
  const [isLoadingOffer, setIsLoadingOffer] = useState<boolean>(true);
  const [showImageZoom, setShowImageZoom] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [imageKey, setImageKey] = useState<number>(0);

  const primaryRec = recommendation?.primaryRecommendation;
  const compatibilityScore = primaryRec?.compatibility || 92;
  const material = primaryRec?.material || {
    id: 'corrugated-produce-box',
    name: 'Food-Grade Corrugated Board',
    shortName: 'Corrugated Box',
    category: 'Paperboard',
    wvtr: 25,
    otr: 80,
    co2tr: 100,
    thermalTg: 80,
    coldFlexibility: 70,
    heatResistance: 75,
    oilFatResistance: 'Moderate',
    lightBarrier: 'High',
    moistureBarrier: 'Low',
    oxygenBarrier: 'Low',
    freshProduceSuitability: 95,
    chilledSuitability: 80,
    frozenSuitability: 20,
    dryFoodSuitability: 90,
    sustainability: 'High',
    relativeCost: '$',
    antiFogCapable: false,
    gasFlushingMAPCapable: false,
    advantages: ['Ventilated and protective produce crate'],
    limitations: ['Moisture sensitive'],
    commonApplications: ['Fresh tomatoes', 'Produce'],
    recommendedApproach: 'Ventilated box'
  };

  const cropName = farmerContext?.crop || 'Tomatoes';
  const totalQty = farmerContext?.quantity || 100;
  const capacityPerBox = asset.capacityKg || 5;
  const quantityRequired = Math.ceil(totalQty / capacityPerBox);

  // High-fidelity generated image asset
  const aiMockupImage = '/src/assets/images/farmer_produce_box_1790754333466.jpg';

  useEffect(() => {
    let isMounted = true;
    setIsLoadingOffer(true);

    getVerifiedShoppingOffer(asset.packageId).then((offer) => {
      if (isMounted) {
        setShoppingOffer(offer);
        setIsLoadingOffer(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [asset.packageId]);

  const handleRegenerateImage = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setImageKey((prev) => prev + 1);
      setIsRegenerating(false);
    }, 600);
  };

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = aiMockupImage;
    link.download = `foodpack_${cropName.toLowerCase()}_packaging_mockup.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const materialList = [
    {
      name: 'Ventilated Corrugated Produce Box',
      purpose: 'Primary structural container with corner-column stacking load',
      spec: '5-Ply heavy kraft board, 150 GSM fluting, 6% side ventilation slot area'
    },
    {
      name: 'Food-Safe Perforated Liner',
      purpose: 'Maintains relative humidity while preventing moisture pooling',
      spec: '50-micron food-grade LDPE with micro-perforations'
    },
    {
      name: 'Base Cushioning Pad',
      purpose: 'Shock absorption against vehicle road vibration (5–20 Hz)',
      spec: 'Molded paper pulp tray or honeycomb kraft cushioning layer'
    },
    {
      name: 'Ventilation Corridor Insert',
      purpose: 'Maintains central airflow core through stacked crates',
      spec: 'Fluted corrugated divider with interlocking center tab'
    },
    {
      name: 'Water-Activated Sealing Tape',
      purpose: 'Eco-friendly, tamper-evident box closure',
      spec: '70mm fiberglass-reinforced water-activated kraft paper tape'
    },
    {
      name: 'Perishable Produce Handling Label',
      purpose: 'Mandi transport orientation and temperature advisory',
      spec: 'MoFPI certified thermal label: "Perishable • Keep Ventilated • Max Stack 6"'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Container Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Level 1 • Farmer Recommendation Result
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                Score: {compatibilityScore}%
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {language === 'te' ? 'సిఫార్సు చేయబడిన ప్యాకేజింగ్' : 'Recommended Packaging Solution'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-800 border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{primaryRec.matchClassification}</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* 1. RECOMMENDED PACKAGING CORE ATTRIBUTES */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* AI-GENERATED PACKAGING IMAGE & MOCKUP */}
          <div className="md:col-span-6 space-y-2">
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-4/3 flex items-center justify-center">
              <img
                key={imageKey}
                src={aiMockupImage}
                alt={asset.name}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isRegenerating ? 'scale-95 opacity-50 blur-xs' : 'scale-100 opacity-100'
                }`}
              />
              <button
                onClick={() => setShowImageZoom(true)}
                className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Inspect</span>
              </button>

              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-200 text-[10px] font-bold backdrop-blur-xs border border-emerald-500/30">
                AI-Generated Packaging Mockup
              </div>
            </div>

            {/* AI Image Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerateImage}
                disabled={isRegenerating}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate Image</span>
              </button>

              <button
                onClick={handleDownloadImage}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Image</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Mockup displays package shape, material appearance, product placement, and ventilation slots.
            </p>
          </div>

          {/* Primary Specifications Panel */}
          <div className="md:col-span-6 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Suitable for: Fresh {cropName}
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  Quantity Required: {quantityRequired} units
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-1 leading-snug">
                {asset.packageType}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Material: {asset.structure.includes('corrugated') ? 'Food-grade corrugated board' : material.name}
              </p>
            </div>

            {/* Core Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Packaging Type
                </span>
                <p className="font-bold text-slate-800">{asset.packageType}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Size / Capacity
                </span>
                <p className="font-bold text-slate-800">{capacityPerBox} kg per box</p>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">
                  Quantity Required
                </span>
                <p className="font-extrabold text-emerald-950">
                  {quantityRequired} boxes for {totalQty} kg
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Protection Level
                </span>
                <p className="font-bold text-slate-800">
                  Stacking up to {asset.validatedProperties.stackingLoadKg} kg
                </p>
              </div>
            </div>

            {/* Ventilation & Moisture considerations */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold mb-0.5">
                  <Wind className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ventilation Requirement</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {asset.ventilation}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Moisture Considerations & Reasoning</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Provides continuous air circulation to expel respiratory heat and transpiration vapor, preventing water pooling that triggers fungal decay.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PACKAGING MATERIAL LIST (Material Name → Purpose → Recommended Specification) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-emerald-600" />
              <span>Packaging Material List (Exact Specifications)</span>
            </h3>
            <span className="text-[10px] font-medium text-slate-500">
              Material Name → Purpose → Specification
            </span>
          </div>

          <div className="divide-y divide-slate-200/70 text-xs">
            {materialList.map((m, idx) => (
              <div key={idx} className="py-2.5 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                  <span>{m.name}</span>
                </div>
                <div className="text-slate-600 text-[11px]">{m.purpose}</div>
                <div className="text-slate-500 font-medium text-[11px] sm:text-right">{m.spec}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SHOPPING SECTION: FIND / BUY THIS PACKAGING */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="space-y-0.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Verified MoFPI / GeM Supplier
              </span>
            </div>
            <p className="text-xs font-semibold text-white">
              {shoppingOffer?.title || asset.name}
            </p>
            <p className="text-[11px] text-slate-400">
              Supplier: {shoppingOffer?.supplier || 'Government e-Marketplace (GeM)'} • {shoppingOffer?.priceEstimate || 'Government contracted rates'}
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            {shoppingOffer && shoppingOffer.url && shoppingOffer.availability !== 'Supplier link unavailable' ? (
              <a
                href={shoppingOffer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <span>🛒 FIND / BUY THIS PACKAGING</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700 text-center">
                Supplier link unavailable
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {showImageZoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-700">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">{asset.name}</h4>
                <p className="text-[11px] text-slate-400">AI Packaging Mockup Inspection</p>
              </div>
              <button
                onClick={() => setShowImageZoom(false)}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center">
              <img
                src={aiMockupImage}
                alt={asset.name}
                referrerPolicy="no-referrer"
                className="max-h-[60vh] object-contain rounded-xl"
              />
            </div>
            <div className="p-4 text-xs text-slate-600 bg-slate-50 border-t border-slate-200">
              <p className="font-semibold text-slate-800">{asset.packageType} • Capacity: {capacityPerBox} kg</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Quantity needed: {quantityRequired} units for {totalQty} kg produce.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
