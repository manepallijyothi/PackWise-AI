export type RespirationRate = 'Low' | 'Medium' | 'High';
export type StorageType = 'Ambient' | 'Chilled' | 'Frozen';
export type TransportationCondition = 'Normal' | 'Refrigerated' | 'Frozen/Cold Chain';

export interface CommodityInput {
  commodityType: string;
  customName?: string;
  moisture: number; // 0 - 100 %
  oilFat: number; // 0 - 100 %
  pH: number; // 0 - 14
  respirationRate: RespirationRate;
  targetShelfLifeDays: number; // 1 - 365
  storageTemperature: number; // -30 to 50 °C
  relativeHumidity: number; // 0 - 100 %
  storageType: StorageType;
  transportationCondition: TransportationCondition;
  transportationDurationDays?: number;
  isFreshProduce: boolean;
}

export type BarrierLevel = 'Low' | 'Medium' | 'High' | 'Superior' | 'Total';
export type SustainabilityLevel = 'Low' | 'Medium' | 'High' | 'Bio-compostable';
export type CostLevel = '$' | '$$' | '$$$' | '$$$$';

export interface PackagingMaterial {
  id: string;
  name: string;
  shortName: string;
  category: 'Polyolefin' | 'Polyester' | 'Foil / Laminate' | 'Bio-Polymer' | 'Engineered Barrier' | 'Cellulose Composite';
  // Food science physical barrier properties
  wvtr: number; // g / (m² · day) at 38°C, 90% RH (Lower = higher moisture barrier)
  otr: number; // cc / (m² · day · atm) at 23°C, 0% RH (Lower = higher oxygen barrier)
  co2tr: number; // cc / (m² · day · atm)
  thermalTg: number; // Glass transition temperature in °C
  coldFlexibility: number; // 0 - 100 rating for sub-zero / cold performance
  heatResistance: number; // 0 - 100 rating for hot filling / thermal stability
  oilFatResistance: BarrierLevel;
  lightBarrier: BarrierLevel;
  moistureBarrier: BarrierLevel;
  oxygenBarrier: BarrierLevel;
  // Food commodity suitability scores (0 - 100)
  freshProduceSuitability: number;
  chilledSuitability: number;
  frozenSuitability: number;
  dryFoodSuitability: number;
  sustainability: SustainabilityLevel;
  relativeCost: CostLevel;
  antiFogCapable: boolean;
  gasFlushingMAPCapable: boolean;
  advantages: string[];
  limitations: string[];
  commonApplications: string[];
  recommendedApproach: string;
}

export interface DecisionFactorScore {
  id: string;
  name: string;
  score: number; // 0 - 100 %
  level: 'Low' | 'Medium' | 'High';
  influence: 'Positive' | 'Critical Need' | 'Constraint';
  explanation: string;
}

export interface MaterialScore {
  material: PackagingMaterial;
  compatibility: number; // 0 - 100 %
  rank: number;
  matchClassification: 'Optimal Fit' | 'Strong Alternative' | 'Viable with Limitations' | 'Not Recommended';
  dynamicReasons: string[];
  warnings: string[];
  factorScores: DecisionFactorScore[];
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  input: CommodityInput;
  primaryRecommendation: MaterialScore;
  alternatives: MaterialScore[];
  allRankedMaterials: MaterialScore[];
  decisionFactors: DecisionFactorScore[];
  recommendedPackagingApproach: string;
  freshProduceWarning?: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  commodityName: string;
  recommendedMaterial: string;
  compatibility: number;
  shelfLifeDays: number;
  storageType: StorageType;
  temperature: number;
  result: AnalysisResult;
}

export interface CustomCommodityAIProfile {
  name: string;
  moisture: number;
  oilFat: number;
  pH: number;
  respirationRate: RespirationRate;
  defaultShelfLifeDays: number;
  isFreshProduce: boolean;
  recommendedStorageType: StorageType;
  recommendedTemperature: number;
  recommendedHumidity: number;
  rationale: string;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export interface WMSItem {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight_lbs: number;
  is_fragile: boolean;
  quantity?: number;
}

export interface WMSBox {
  box_id: string;
  box_name: string;
  dimensions_in: {
    length: number;
    width: number;
    height: number;
  };
  max_weight_lbs: number;
  tare_weight_lbs?: number;
  volume_cuin?: number;
}

export interface WMSPackingResponse {
  packing_summary: {
    status: 'SUCCESS' | 'OVERSIZED_ITEM' | 'WEIGHT_LIMIT_EXCEEDED';
    selected_box: {
      box_id: string;
      box_name: string;
      dimensions_in: {
        length: number;
        width: number;
        height: number;
      };
      max_weight_lbs: number;
    };
    utilization_percentage: number;
    total_weight_lbs: number;
  };
  cushioning_requirements: {
    padding_material: string;
    estimated_void_fill_sqft: number;
  };
  packing_instructions: string[];
  warnings_or_flags: string[];
}

export type UserRole = 'Food Producer / MSME' | 'Packaging Material Supplier' | 'Food Tech Researcher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  avatarColor?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

