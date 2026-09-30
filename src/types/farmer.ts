import { CommodityInput, AnalysisResult } from './packaging';

export type FarmerLanguage = 'en' | 'te';

export interface FarmerContext {
  crop: string;
  variety?: string;
  quantity?: number; // in kg
  harvestStage?: string;
  freshness?: 'fresh' | 'stored' | 'processed' | string;
  maturity?: string;
  harvestDate?: string;

  transportDistance?: number; // km
  transportDuration?: number; // hours
  transportMode?: string; // 'Open truck', 'Auto-rickshaw', 'Mini truck / Tata Ace', 'Refrigerated van', etc.
  roadCondition?: 'smooth' | 'bumpy / rough' | 'rural unpaved' | string;
  handlingFrequency?: 'minimal' | 'moderate' | 'frequent / multi-point' | string;

  ambientTemperature?: number; // °C
  humidity?: number; // %
  rainExposure?: boolean;

  storageType?: 'Ambient' | 'Chilled' | 'Cold Storage' | 'Shaded farm shed' | string;
  storageTemperature?: number; // °C
  storageDuration?: number; // days
  refrigerationAvailable?: boolean;

  targetBuyer?: 'Local Mandi / APMC' | 'Direct Consumer' | 'Retail Supermarket' | 'Food Processor / Exporter' | string;

  budgetPreference?: 'economical' | 'balanced' | 'premium' | string;
  sustainabilityPreference?: 'reusable' | 'recyclable' | 'biodegradable' | 'standard' | string;

  packagingPreference?: string;
  brandingRequired?: boolean;
  traceabilityRequired?: boolean;

  existingPackaging?: string; // e.g. "gunny sacks", "plastic crates", "loose on truck"

  specialRequirements?: string;

  confirmedFields: string[];
  unknownFields: string[];
  assumptions: string[];

  conversationSummary?: string;
  lastQuestion?: string;
}

export interface PackagingAsset {
  packageId: string;
  materialId: string;
  name: string;
  category: 'Crate' | 'Box' | 'Pouch' | 'Liner' | 'Sack' | 'Container';
  packageType: string;
  capacityKg: number;
  structure: string;
  ventilation: string;
  reusability: string;
  imageUrl: string;
  additionalImages?: string[];
  source: string;
  license: string;
  validationStatus: 'Verified MoFPI Standard' | 'Industry Validated' | 'Pending Field Trial';
  validatedProperties: {
    materialName: string;
    wvtr: string;
    otr: string;
    temperatureRange: string;
    stackingLoadKg: number;
    impactResistance: 'High' | 'Medium' | 'Superior';
    cushioningNeed: string;
  };
}

export interface ShoppingOffer {
  packageId: string;
  title: string;
  supplier: string;
  url: string;
  source: string;
  availability: 'In Stock' | 'Bulk Orders Only' | 'Seasonal Availability' | 'Supplier link unavailable';
  priceEstimate?: string;
  minOrderQuantity?: string;
}

export interface PackingStep {
  stepNumber: number;
  title: string;
  teTitle?: string;
  instruction: string;
  teInstruction?: string;
  scientificRationale: string;
  criticalNotice?: string;
  iconName: 'scissors' | 'box' | 'layers' | 'wind' | 'shield' | 'truck' | 'check' | 'file-text';
}

export interface PackingTransportPlan {
  packing: {
    quantityPerPackage: string;
    fillLevel: string;
    arrangement: string;
    layers: string;
    ventilation: string;
    cushioning: string;
    separation: string;
  };
  transport: {
    handling: string;
    stacking: string;
    compressionPrecautions: string;
    ventilationPrecautions: string;
    temperatureConsiderations: string;
    moistureConsiderations: string;
    transportDuration: string;
    storageGuidance: string;
  };
  dos: string[];
  donts: string[];
}

export interface RecommendationReportData {
  reportId: string;
  generatedAt: string;
  farmerContext: FarmerContext;
  analysisResult: AnalysisResult;
  packagingAsset: PackagingAsset;
  estimatedPackagesNeeded: number;
  expectedLossReductionPercent: number;
  estimatedShelfLifeExtensionDays: number;
  whatsappShareTextEn: string;
  whatsappShareTextTe: string;
}

export interface FarmerVoiceMessage {
  id: string;
  sender: 'farmer' | 'assistant' | 'system';
  text: string;
  teText?: string;
  audioUrl?: string;
  timestamp: string;
  extractedDelta?: Partial<FarmerContext>;
}
