import { CommodityInput, AnalysisResult } from './packaging';

export type RestaurantUploadCategory =
  | 'Food Dish / Menu Item'
  | 'Existing Packaging Photo'
  | 'Packaging Defect / Leak'
  | 'Menu / Nutritional Document'
  | 'Storage / Delivery Setup';

export interface RestaurantPackingStep {
  stepNumber: number;
  title: string;
  instruction: string;
  tip?: string;
}

export interface RestaurantPackagingConsumable {
  name: string;
  purpose: string;
  specification: string;
}

export interface RestaurantAnalysisData {
  itemName: string;
  dishDescription?: string;
  foodType?: string;
  visibleIngredients?: string;
  temperatureCategory: 'Hot' | 'Warm' | 'Cold' | 'Chilled';
  stateCategory: 'Liquid' | 'Semi-liquid' | 'Solid' | 'Crispy';
  oilGreaseLevel: 'High' | 'Moderate' | 'Low';
  steamSensitivity: 'High (Needs Venting)' | 'Moderate' | 'Sealed (Anti-Leak)';
  deliveryDurationMinutes: number;
  distanceSensitivity: string;
  estimatedMoisture: number;
  estimatedOilFat: number;
  estimatedPh: number;
  packingTemperatureC: number;
  isLiquidOrGravy: boolean;
  leakProofRequirement: 'Hermetic / Liquid-tight' | 'Moderate / Grease-resistant' | 'Vented / Crispy';
  microwaveSafeRequired: boolean;
  biodegradablePreference: boolean;

  // Primary Packaging Recommendation
  primaryRecommendation: {
    containerType: string;
    material: string;
    capacity: string;
    lidType: string;
    spillResistance: string;
    thermalRetention: string;
    ecoStatus: string;
    selectionReason: string;
  };

  // Mockup image URL
  mockupImageUrl: string;

  // Step-by-Step Restaurant Packing Guide
  packingGuide: RestaurantPackingStep[];

  // Consumables & Materials list
  consumablesList: RestaurantPackagingConsumable[];

  engineCommodityInput?: CommodityInput;
  engineResult?: AnalysisResult;
}

export interface RestaurantUploadItem {
  id: string;
  userId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileSizeFormatted: string;
  category: RestaurantUploadCategory;
  storageUrl: string;
  dataUrl?: string; // base64 thumbnail or preview
  uploadedAt: string;
  notes?: string;
  extractedAnalysis?: RestaurantAnalysisData;
}

export interface RestaurantUploadProgress {
  fileId: string;
  progressPercent: number;
  status: 'uploading' | 'success' | 'failed';
  errorMessage?: string;
}
