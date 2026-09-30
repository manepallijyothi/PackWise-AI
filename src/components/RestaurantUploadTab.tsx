import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Utensils,
  Flame,
  Droplets,
  Thermometer,
  ShieldCheck,
  Download,
  RotateCw,
  Printer,
  Maximize2,
  Trash2,
  Box,
  FileText,
  Clock,
  Check,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  RestaurantUploadItem,
  RestaurantAnalysisData,
  RestaurantPackingStep,
  RestaurantPackagingConsumable
} from '../types/restaurant';
import { CommodityInput, AnalysisResult } from '../types/packaging';
import {
  fetchRestaurantUploads,
  uploadRestaurantFile,
  deleteRestaurantUpload,
  analyzeRestaurantUpload
} from '../services/restaurantService';
import { useAuth } from '../context/AuthContext';

interface RestaurantUploadTabProps {
  onApplyToEngine: (commodity: CommodityInput) => void;
  onGoToAnalyze?: () => void;
}

// Quick speed test dishes
const SPEED_TEST_DISHES = [
  {
    name: 'Chicken Dum Biryani',
    type: 'Rice & Meat / Warm Solid',
    temp: 75,
    isLiquid: false,
    crispy: false,
    moisture: 60,
    oil: 15,
    tag: 'Popular'
  },
  {
    name: 'Butter Paneer Masala Gravy',
    type: 'Hot Liquid Gravy / Curry',
    temp: 82,
    isLiquid: true,
    crispy: false,
    moisture: 80,
    oil: 18,
    tag: 'Liquid-Tight'
  },
  {
    name: 'Crispy French Fries & Burger',
    type: 'Fried Finger Food / Crispy',
    temp: 70,
    isLiquid: false,
    crispy: true,
    moisture: 38,
    oil: 24,
    tag: 'Vented'
  },
  {
    name: 'Hot Tomato Basil Soup',
    type: 'High-Temperature Soup',
    temp: 85,
    isLiquid: true,
    crispy: false,
    moisture: 92,
    oil: 6,
    tag: 'Hot-Fill'
  },
  {
    name: 'Chilled Caesar Salad',
    type: 'Cold Fresh Produce Meal',
    temp: 4,
    isLiquid: false,
    crispy: false,
    moisture: 85,
    oil: 5,
    tag: 'Chilled'
  }
];

// Helper to normalize any raw or legacy analysis payload safely
function normalizeRestaurantAnalysis(raw: any): RestaurantAnalysisData {
  const safeRaw = raw && typeof raw === 'object' ? raw : {};
  const isLiquid = Boolean(
    safeRaw.isLiquidOrGravy ||
    safeRaw.stateCategory === 'Liquid' ||
    safeRaw.stateCategory === 'Semi-liquid'
  );
  const isCrispy =
    safeRaw.leakProofRequirement === 'Vented / Crispy' ||
    safeRaw.stateCategory === 'Crispy';
  const packingTemp = typeof safeRaw.packingTemperatureC === 'number' ? safeRaw.packingTemperatureC : 75;

  const rawRec = safeRaw.primaryRecommendation && typeof safeRaw.primaryRecommendation === 'object'
    ? safeRaw.primaryRecommendation
    : undefined;

  const containerType =
    (typeof rawRec?.containerType === 'string' && rawRec.containerType) ||
    (typeof safeRaw.recommendedPackageType === 'string' && safeRaw.recommendedPackageType) ||
    (isLiquid
      ? 'Microwaveable Polypropylene (PP) Tamper-Evident Leak-Proof Bowl'
      : isCrispy
      ? 'Vented Kraft Bio-Board Clamshell Box with Micro-Steam Ports'
      : 'Heavy-Duty Sugarcane Bagasse Biodegradable Clamshell Container');

  const rawMaterial = rawRec?.material;
  const materialName =
    typeof rawMaterial === 'string'
      ? rawMaterial
      : typeof rawMaterial === 'object' && rawMaterial?.name
      ? rawMaterial.name
      : (isLiquid
          ? 'Food-Grade Virgin Polypropylene (#5 PP) - 100% Recyclable'
          : isCrispy
          ? 'Aqueous Coated Virgin Kraft Paperboard (FSC Certified)'
          : 'Natural Unbleached Sugarcane Bagasse Pulp (100% Compostable)');

  const lidType =
    (typeof rawRec?.lidType === 'string' && rawRec.lidType) ||
    (isLiquid
      ? 'Ultra-Tight Snap PP Anti-Fog Dome Lid with Double-Seal Rim'
      : isCrispy
      ? 'Self-Locking Paperboard Flap with Top Corner Steam Vents'
      : 'Interlocking Molded Bagasse Tab-Lock Lid');

  const spillResistance =
    (typeof rawRec?.spillResistance === 'string' && rawRec.spillResistance) ||
    (isLiquid
      ? '99.5% Hermetic Liquid-Tight (Resists 360° tilt during bike courier)'
      : isCrispy
      ? 'Grease-Resistant (Resists hot oil soak for >90 mins)'
      : '95% Spill-Resistant with dry and semi-solid food');

  const thermalRetention =
    (typeof rawRec?.thermalRetention === 'string' && rawRec.thermalRetention) ||
    (isLiquid
      ? 'Retains food above 65°C for 45 minutes of transit'
      : isCrispy
      ? 'Controlled heat retention with steam release to preserve crispiness'
      : 'Maintains optimal eating temperature for 35 minutes');

  const ecoStatus =
    (typeof rawRec?.ecoStatus === 'string' && rawRec.ecoStatus) ||
    (isLiquid
      ? '100% Curbside Recyclable (#5 PP) & Dishwasher Top-Rack Safe'
      : isCrispy
      ? 'Home Compostable & Plastic-Free Aqueous Barrier'
      : '100% Home & Industrial Compostable (EN 13432 Certified)');

  const selectionReason =
    (typeof rawRec?.selectionReason === 'string' && rawRec.selectionReason) ||
    (typeof safeRaw.rationale === 'string' && safeRaw.rationale) ||
    (isLiquid
      ? `For high-moisture liquid/gravy dishes packed hot, hermetic polypropylene prevents transit leaks and enables customer microwave reheating.`
      : isCrispy
      ? `Crispy fried items require micro-venting to prevent trapped steam from softening the crust.`
      : `Sugarcane bagasse offers an eco-friendly, sturdy barrier for warm solid meals, preventing oil seepage.`);

  const mockupImageUrl =
    safeRaw.mockupImageUrl ||
    (isLiquid
      ? '/src/assets/images/soup_curry_container_1790754360693.jpg'
      : '/src/assets/images/takeaway_food_box_1790754347819.jpg');

  const defaultPackingGuide: RestaurantPackingStep[] = [
    {
      stepNumber: 1,
      title: isCrispy ? 'Steam Dissipation Before Closure' : 'Portion & Headroom Check',
      instruction: isCrispy
        ? 'Rest freshly fried food for 20-30 seconds on absorbent paper before boxing to allow initial flash steam to escape.'
        : `Fill container up to 85% capacity (${isLiquid ? 'leave 1.5 cm headspace' : 'level with rim'}).`,
      tip: 'Prevents lid bulging and liquid expansion during transit.'
    },
    {
      stepNumber: 2,
      title: 'Rim Inspection & Seal Closure',
      instruction: isLiquid
        ? 'Wipe container rim free of sauce droplets, align the anti-fog lid, and press firmly around circumference until an audible double-click seals all sides.'
        : 'Fold closure tabs into lock slots firmly to prevent accidental opening during courier handling.',
      tip: 'Listen for audible snap confirmation.'
    },
    {
      stepNumber: 3,
      title: 'Condiment & Sauce Segregation',
      instruction: 'Package raita, chutneys, extra sauces, or gravies in separate 50ml sealed tamper-evident dip cups.',
      tip: 'Prevents main dish from turning soggy during delivery.'
    },
    {
      stepNumber: 4,
      title: 'Flat-Bottom Delivery Bag Placement',
      instruction: 'Place heaviest containers flat at the bottom of the delivery bag. Never tilt or stack hot soup containers on top of delicate fried items.',
      tip: 'Maintain vertical orientation during courier handover.'
    },
    {
      stepNumber: 5,
      title: 'Tamper-Evident Safety Seal',
      instruction: 'Affix tamper-evident food safety tape across the container lid seam or fold the delivery bag lip with a verification seal.',
      tip: 'Assures food safety and customer trust.'
    }
  ];

  const defaultConsumablesList: RestaurantPackagingConsumable[] = [
    {
      name: containerType,
      purpose: 'Primary food contact takeaway container',
      specification: `${materialName}, Capacity: 750ml, Heat range: -10°C to 120°C`
    },
    {
      name: lidType,
      purpose: 'Spill-proof and steam-balanced lid closure',
      specification: 'Anti-fog food contact polymer / molded fiber with positive snap'
    },
    {
      name: 'Takeaway Kraft Delivery Bag',
      purpose: 'Courier transport and thermal grouping',
      specification: 'Flat-bottom heavy kraft paper (120 GSM) with twisted reinforced handles'
    },
    {
      name: 'Greaseproof Food Wrap Liner',
      purpose: 'Direct food contact barrier against oil bleeding',
      specification: '40 GSM aqueous-coated unbleached greaseproof paper (Kit level 7)'
    },
    {
      name: 'Tamper-Evident Portion Sauce Cup (50ml)',
      purpose: 'Side sauces, dips, dressings, and condiments',
      specification: 'Food-grade PP with leak-tight hinged lid'
    },
    {
      name: 'Eco Cutlery & Unbleached Napkin Set',
      purpose: 'Customer dining hygiene',
      specification: 'Birchwood / CPLA compostable fork & spoon with 2-ply recycled kraft napkin'
    }
  ];

  return {
    itemName: safeRaw.itemName || 'Takeaway Dish',
    dishDescription: safeRaw.dishDescription || 'Restaurant Menu Item',
    foodType:
      safeRaw.foodType ||
      (isLiquid ? 'Curry / Gravy / Soup' : isCrispy ? 'Crispy / Fried Snack' : 'Prepared Meal / Main Dish'),
    visibleIngredients: safeRaw.visibleIngredients || safeRaw.itemName || 'Food Item',
    temperatureCategory:
      safeRaw.temperatureCategory ||
      (packingTemp >= 65 ? 'Hot' : packingTemp >= 40 ? 'Warm' : packingTemp <= 10 ? 'Chilled' : 'Cold'),
    stateCategory: safeRaw.stateCategory || (isLiquid ? 'Liquid' : isCrispy ? 'Crispy' : 'Solid'),
    oilGreaseLevel:
      safeRaw.oilGreaseLevel || (safeRaw.estimatedOilFat >= 18 ? 'High' : safeRaw.estimatedOilFat >= 8 ? 'Moderate' : 'Low'),
    steamSensitivity:
      safeRaw.steamSensitivity || (isCrispy ? 'High (Needs Venting)' : isLiquid ? 'Sealed (Anti-Leak)' : 'Moderate'),
    deliveryDurationMinutes: safeRaw.deliveryDurationMinutes || 35,
    distanceSensitivity: safeRaw.distanceSensitivity || 'Bike courier transit within 8 km delivery radius',
    estimatedMoisture: typeof safeRaw.estimatedMoisture === 'number' ? safeRaw.estimatedMoisture : 60,
    estimatedOilFat: typeof safeRaw.estimatedOilFat === 'number' ? safeRaw.estimatedOilFat : 14,
    estimatedPh: typeof safeRaw.estimatedPh === 'number' ? safeRaw.estimatedPh : 5.2,
    packingTemperatureC: packingTemp,
    isLiquidOrGravy: isLiquid,
    leakProofRequirement:
      safeRaw.leakProofRequirement ||
      (isLiquid ? 'Hermetic / Liquid-tight' : isCrispy ? 'Vented / Crispy' : 'Moderate / Grease-resistant'),
    microwaveSafeRequired: safeRaw.microwaveSafeRequired !== undefined ? safeRaw.microwaveSafeRequired : packingTemp >= 60,
    biodegradablePreference: safeRaw.biodegradablePreference !== undefined ? safeRaw.biodegradablePreference : true,
    primaryRecommendation: {
      containerType,
      material: materialName,
      capacity: (typeof rawRec?.capacity === 'string' && rawRec.capacity) || '750 ml (Standard Takeaway Portion)',
      lidType,
      spillResistance,
      thermalRetention,
      ecoStatus,
      selectionReason
    },
    mockupImageUrl,
    packingGuide:
      safeRaw.packingGuide && Array.isArray(safeRaw.packingGuide) && safeRaw.packingGuide.length > 0
        ? safeRaw.packingGuide
        : defaultPackingGuide,
    consumablesList:
      safeRaw.consumablesList && Array.isArray(safeRaw.consumablesList) && safeRaw.consumablesList.length > 0
        ? safeRaw.consumablesList
        : defaultConsumablesList,
    engineCommodityInput: safeRaw.engineCommodityInput,
    engineResult: safeRaw.engineResult
  };
}

export const RestaurantUploadTab: React.FC<RestaurantUploadTabProps> = ({
  onApplyToEngine,
  onGoToAnalyze
}) => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<RestaurantUploadItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);

  // Upload & speed analysis state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Active AI Analysis & Packaging Recommendation
  const [activeAnalysis, setActiveAnalysis] = useState<RestaurantAnalysisData | null>(null);
  const [analyzingDishName, setAnalyzingDishName] = useState<string | null>(null);
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);
  const [showImageZoom, setShowImageZoom] = useState<boolean>(false);
  const [isRegeneratingMockup, setIsRegeneratingMockup] = useState<boolean>(false);
  const [mockupKey, setMockupKey] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Load uploaded items on mount
  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    setIsLoadingList(true);
    try {
      const items = await fetchRestaurantUploads();
      const normalizedItems = (items || []).map((item) => ({
        ...item,
        extractedAnalysis: item.extractedAnalysis
          ? normalizeRestaurantAnalysis(item.extractedAnalysis)
          : undefined
      }));
      setUploads(normalizedItems);

      const withAnalysis = normalizedItems.find((i) => i.extractedAnalysis);
      if (withAnalysis && withAnalysis.extractedAnalysis) {
        setActiveAnalysis(withAnalysis.extractedAnalysis);
        setActiveImagePreview(withAnalysis.dataUrl || withAnalysis.extractedAnalysis.mockupImageUrl);
      } else {
        // Auto-select first speed preset so the user immediately sees a clean recommendation
        handleRunSpeedPreset(SPEED_TEST_DISHES[0]);
      }
    } catch (err) {
      console.warn('Failed to load uploads', err);
      handleRunSpeedPreset(SPEED_TEST_DISHES[0]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(20);

    // Read local thumbnail preview immediately for instant speed
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setActiveImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    const res = await uploadRestaurantFile(
      file,
      'Food Dish / Menu Item',
      user?.email || 'restaurant-operator',
      undefined,
      (pct) => setUploadProgress(pct)
    );

    setIsUploading(false);

    if (res.success && res.item) {
      const newItem = res.item;
      setUploads((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
      // Immediately run AI analysis
      runAnalysisOnItem(newItem);
    } else {
      setUploadError(res.error || 'Upload failed. Please check file format.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const runAnalysisOnItem = async (item: RestaurantUploadItem) => {
    setAnalyzingDishName(item.fileName);
    try {
      const res = await analyzeRestaurantUpload(
        item.id,
        item.fileName.split('.')[0],
        item.notes,
        75
      );

      if (res.success && res.analysis) {
        const normalized = normalizeRestaurantAnalysis(res.analysis);
        setActiveAnalysis(normalized);
        if (item.dataUrl) {
          setActiveImagePreview(item.dataUrl);
        } else {
          setActiveImagePreview(normalized.mockupImageUrl);
        }
      } else {
        setUploadError(res.error || 'Failed to extract food packaging characteristics.');
      }
    } catch {
      setUploadError('AI vision analysis encountered a network issue.');
    } finally {
      setAnalyzingDishName(null);
    }
  };

  // Instant speed preset runner (0.2s speed demo)
  const handleRunSpeedPreset = (dish: typeof SPEED_TEST_DISHES[0]) => {
    setAnalyzingDishName(dish.name);
    setTimeout(() => {
      const isLiquid = dish.isLiquid;
      const isCrispy = dish.crispy;
      const packingTemp = dish.temp;

      const mockupImageUrl = isLiquid
        ? '/src/assets/images/soup_curry_container_1790754360693.jpg'
        : '/src/assets/images/takeaway_food_box_1790754347819.jpg';

      const containerType = isLiquid
        ? 'Microwaveable Polypropylene (PP) Tamper-Evident Leak-Proof Bowl'
        : isCrispy
        ? 'Vented Kraft Bio-Board Clamshell Box with Micro-Steam Ports'
        : 'Heavy-Duty Sugarcane Bagasse Biodegradable Clamshell Container';

      const materialName = isLiquid
        ? 'Food-Grade Virgin Polypropylene (#5 PP) - 100% Recyclable'
        : isCrispy
        ? 'Aqueous Coated Virgin Kraft Paperboard (FSC Certified)'
        : 'Natural Unbleached Sugarcane Bagasse Pulp (100% Compostable)';

      const lidType = isLiquid
        ? 'Ultra-Tight Snap PP Anti-Fog Dome Lid with Double-Seal Rim'
        : isCrispy
        ? 'Self-Locking Paperboard Flap with Top Corner Steam Vents'
        : 'Interlocking Molded Bagasse Tab-Lock Lid';

      const spillResistance = isLiquid
        ? '99.5% Hermetic Liquid-Tight (Resists 360° tilt during bike courier)'
        : isCrispy
        ? 'Grease-Resistant (Resists hot oil soak for >90 mins)'
        : '95% Spill-Resistant with dry and semi-solid food';

      const thermalRetention = isLiquid
        ? 'Retains food above 65°C for 45 minutes of transit'
        : isCrispy
        ? 'Controlled heat retention with steam release to preserve crispiness'
        : 'Maintains optimal eating temperature for 35 minutes';

      const ecoStatus = isLiquid
        ? '100% Curbside Recyclable (#5 PP) & Dishwasher Top-Rack Safe'
        : isCrispy
        ? 'Home Compostable & Plastic-Free Aqueous Barrier'
        : '100% Home & Industrial Compostable (EN 13432 Certified)';

      const selectionReason = isLiquid
        ? `For high-moisture (${dish.moisture}%) liquid/gravy dishes packed at ${packingTemp}°C, hermetic polypropylene prevents transit leaks, withstands grease, and enables customer microwave reheating.`
        : isCrispy
        ? `Crispy fried items require micro-venting to prevent trapped condensation from softening the crust, combined with high grease resistance.`
        : `Sugarcane bagasse offers an eco-friendly, sturdy barrier for warm solid meals, preventing oil seepage while maintaining sustainability.`;

      const packingGuide: RestaurantPackingStep[] = [
        {
          stepNumber: 1,
          title: isCrispy ? 'Steam Dissipation Before Closure' : 'Portion & Headroom Check',
          instruction: isCrispy
            ? 'Rest freshly fried food for 20-30 seconds on absorbent paper before boxing to allow initial flash steam to escape.'
            : `Fill container up to 85% capacity (${isLiquid ? 'leave 1.5 cm headspace' : 'level with rim'}).`,
          tip: 'Prevents lid bulging and liquid expansion during transit.'
        },
        {
          stepNumber: 2,
          title: 'Rim Inspection & Seal Closure',
          instruction: isLiquid
            ? 'Wipe container rim free of sauce droplets, align the anti-fog lid, and press firmly around circumference until an audible double-click seals all sides.'
            : 'Fold closure tabs into lock slots firmly to prevent accidental opening during courier handling.',
          tip: 'Listen for audible snap confirmation.'
        },
        {
          stepNumber: 3,
          title: 'Condiment & Sauce Segregation',
          instruction: 'Package raita, chutneys, extra sauces, or gravies in separate 50ml sealed tamper-evident dip cups.',
          tip: 'Prevents main dish from turning soggy during delivery.'
        },
        {
          stepNumber: 4,
          title: 'Flat-Bottom Delivery Bag Placement',
          instruction: 'Place heaviest containers flat at the bottom of the delivery bag. Never tilt or stack hot soup containers on top of delicate fried items.',
          tip: 'Maintain vertical orientation during courier handover.'
        },
        {
          stepNumber: 5,
          title: 'Tamper-Evident Safety Seal',
          instruction: 'Affix tamper-evident food safety tape across the container lid seam or fold the delivery bag lip with a verification seal.',
          tip: 'Assures food safety and customer trust.'
        }
      ];

      const consumablesList: RestaurantPackagingConsumable[] = [
        {
          name: containerType,
          purpose: 'Primary food contact takeaway container',
          specification: `${materialName}, Capacity: 750ml, Heat range: -10°C to 120°C`
        },
        {
          name: lidType,
          purpose: 'Spill-proof and steam-balanced lid closure',
          specification: 'Anti-fog food contact polymer / molded fiber with positive snap'
        },
        {
          name: 'Takeaway Kraft Delivery Bag',
          purpose: 'Courier transport and thermal grouping',
          specification: 'Flat-bottom heavy kraft paper (120 GSM) with twisted reinforced handles'
        },
        {
          name: 'Greaseproof Food Wrap Liner',
          purpose: 'Direct food contact barrier against oil bleeding',
          specification: '40 GSM aqueous-coated unbleached greaseproof paper (Kit level 7)'
        },
        {
          name: 'Tamper-Evident Portion Sauce Cup (50ml)',
          purpose: 'Side sauces, dips, dressings, and condiments',
          specification: 'Food-grade PP with leak-tight hinged lid'
        },
        {
          name: 'Eco Cutlery & Unbleached Napkin Set',
          purpose: 'Customer dining hygiene',
          specification: 'Birchwood / CPLA compostable fork & spoon with 2-ply recycled kraft napkin'
        }
      ];

      const analysisData: RestaurantAnalysisData = {
        itemName: dish.name,
        dishDescription: dish.type,
        foodType: dish.type,
        visibleIngredients: dish.name,
        temperatureCategory: dish.temp >= 65 ? 'Hot' : dish.temp >= 40 ? 'Warm' : dish.temp <= 10 ? 'Chilled' : 'Cold',
        stateCategory: isLiquid ? 'Liquid' : isCrispy ? 'Crispy' : 'Solid',
        oilGreaseLevel: dish.oil >= 18 ? 'High' : dish.oil >= 8 ? 'Moderate' : 'Low',
        steamSensitivity: isCrispy ? 'High (Needs Venting)' : isLiquid ? 'Sealed (Anti-Leak)' : 'Moderate',
        deliveryDurationMinutes: 35,
        distanceSensitivity: 'Bike courier transit within 8 km delivery radius',
        estimatedMoisture: dish.moisture,
        estimatedOilFat: dish.oil,
        estimatedPh: isLiquid ? 4.8 : 5.8,
        packingTemperatureC: packingTemp,
        isLiquidOrGravy: isLiquid,
        leakProofRequirement: isLiquid ? 'Hermetic / Liquid-tight' : isCrispy ? 'Vented / Crispy' : 'Moderate / Grease-resistant',
        microwaveSafeRequired: packingTemp >= 60,
        biodegradablePreference: true,
        primaryRecommendation: {
          containerType,
          material: materialName,
          capacity: '750 ml (Standard Takeaway Portion)',
          lidType,
          spillResistance,
          thermalRetention,
          ecoStatus,
          selectionReason
        },
        mockupImageUrl,
        packingGuide,
        consumablesList
      };

      setActiveAnalysis(analysisData);
      setActiveImagePreview(mockupImageUrl);
      setAnalyzingDishName(null);
    }, 250);
  };

  // One-tap quick attribute toggle
  const updateAttribute = (key: keyof RestaurantAnalysisData, value: any) => {
    if (!activeAnalysis) return;
    const updated = normalizeRestaurantAnalysis({ ...activeAnalysis, [key]: value });
    setActiveAnalysis(updated);
  };

  const handleApplyToEngineClick = () => {
    if (!activeAnalysis) return;
    const commodity: CommodityInput = {
      commodityType: 'Custom Commodity',
      customName: activeAnalysis.itemName || 'Restaurant Takeaway Dish',
      moisture: activeAnalysis.estimatedMoisture || 65,
      oilFat: activeAnalysis.estimatedOilFat || 14,
      pH: activeAnalysis.estimatedPh || 5.2,
      respirationRate: 'Low',
      targetShelfLifeDays: 2,
      storageTemperature: activeAnalysis.packingTemperatureC > 40 ? 65 : 4,
      relativeHumidity: 70,
      storageType: activeAnalysis.packingTemperatureC > 40 ? 'Ambient' : 'Chilled',
      transportationCondition: 'Normal',
      transportationDurationDays: 1,
      isFreshProduce: false
    };
    onApplyToEngine(commodity);
  };

  const handleRegenerateMockup = () => {
    setIsRegeneratingMockup(true);
    setTimeout(() => {
      setMockupKey((prev) => prev + 1);
      setIsRegeneratingMockup(false);
    }, 500);
  };

  const handleDownloadMockup = () => {
    if (!activeAnalysis) return;
    const link = document.createElement('a');
    link.href = activeAnalysis.mockupImageUrl || activeImagePreview || '/src/assets/images/takeaway_food_box_1790754347819.jpg';
    link.download = `takeaway_${activeAnalysis.itemName.toLowerCase().replace(/\s+/g, '_')}_mockup.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintGuide = () => {
    window.print();
  };

  const handleDeleteUpload = async (id: string) => {
    const ok = await deleteRestaurantUpload(id);
    if (ok) {
      setUploads((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return (
    <div className="pb-28 pt-1 max-w-2xl mx-auto space-y-5">
      {/* Level 2 Header - Clean, Minimal & Professional */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <Utensils className="w-3.5 h-3.5 text-emerald-600" />
            <span>LEVEL 2 — RESTAURANT / CAFÉ / TAKEAWAY</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Speed-First Packaging Recommendation
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Restaurant Food Photo & Takeaway Packaging AI
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          Designed for instant speed. Take a photo or upload an image of your food dish. The AI vision system detects temperature, gravy vs crispy texture, steam sensitivity, and recommends the exact takeaway container, lid, and kitchen packing instructions in seconds.
        </p>
      </div>

      {/* Two Major Input Options — Speed First */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Select or Capture Food Dish</span>
          </h2>
          <span className="text-[11px] text-emerald-700 font-semibold">Instant Analysis</span>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        {/* OPTION A & OPTION B BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* OPTION A — UPLOAD FOOD IMAGE */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-md shadow-emerald-700/15 cursor-pointer"
          >
            <UploadCloud className="w-5 h-5 text-emerald-100" />
            <div className="text-left">
              <span className="block text-sm font-black">Upload Food Image</span>
              <span className="block text-[11px] text-emerald-100 font-normal">
                Choose photo from device or files
              </span>
            </div>
          </button>

          {/* OPTION B — TAKE PHOTO */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-md shadow-slate-900/15 cursor-pointer"
          >
            <Camera className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <span className="block text-sm font-black">Take a Photo</span>
              <span className="block text-[11px] text-slate-300 font-normal">
                Use device camera for instant shot
              </span>
            </div>
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/70'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-600">
            or drag & drop your food photograph here (JPG, PNG, WEBP)
          </span>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-1 pt-1">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 text-center">Uploading photo... {uploadProgress}%</p>
          </div>
        )}

        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Speed Testing Presets (1-tap demo) */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Quick Test Speed Dishes (Tap to Analyze in 0.2s):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SPEED_TEST_DISHES.map((dish) => (
              <button
                key={dish.name}
                onClick={() => handleRunSpeedPreset(dish)}
                className={`text-[11px] px-2.5 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  activeAnalysis?.itemName === dish.name
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{dish.name}</span>
                <span className="text-[10px] text-slate-400 ml-1.5 font-normal">({dish.tag})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state during analysis */}
      {analyzingDishName && (
        <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">
            Analyzing {analyzingDishName} with Multimodal Vision...
          </h3>
          <p className="text-xs text-slate-500">
            Detecting food texture, temperature, oil content, and steam sensitivity for takeaway.
          </p>
        </div>
      )}

      {/* AI FOOD IMAGE ANALYSIS: Identified Attributes with One-Tap Confirmation / Edit */}
      {activeAnalysis && !analyzingDishName && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  AI Food Image Analysis
                </span>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  {activeAnalysis.itemName}
                </h3>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 font-medium">
              Tap any pill below to adjust
            </span>
          </div>

          {/* Identified Food Attributes Grid with One-Tap Confirmation / Edit */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Temperature */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
                <span className="flex items-center gap-1 text-slate-600">
                  <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                  Temp
                </span>
                <span>{activeAnalysis.packingTemperatureC}°C</span>
              </div>
              <p className="font-extrabold text-slate-900 text-xs mb-1.5">
                {activeAnalysis.temperatureCategory}
              </p>
              <div className="flex flex-wrap gap-1">
                {(['Hot', 'Warm', 'Cold', 'Chilled'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      updateAttribute('temperatureCategory', t);
                      updateAttribute('packingTemperatureC', t === 'Hot' ? 75 : t === 'Warm' ? 50 : t === 'Cold' ? 18 : 4);
                    }}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                      activeAnalysis.temperatureCategory === t
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* State */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
                <span className="flex items-center gap-1 text-slate-600">
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  State
                </span>
                <span>{activeAnalysis.estimatedMoisture}% M</span>
              </div>
              <p className="font-extrabold text-slate-900 text-xs mb-1.5">
                {activeAnalysis.stateCategory}
              </p>
              <div className="flex flex-wrap gap-1">
                {(['Liquid', 'Semi-liquid', 'Solid', 'Crispy'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      updateAttribute('stateCategory', s);
                      updateAttribute('isLiquidOrGravy', s === 'Liquid' || s === 'Semi-liquid');
                      if (s === 'Crispy') updateAttribute('steamSensitivity', 'High (Needs Venting)');
                      if (s === 'Liquid') updateAttribute('steamSensitivity', 'Sealed (Anti-Leak)');
                    }}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                      activeAnalysis.stateCategory === s
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Oil / Grease Level */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
                <span className="flex items-center gap-1 text-slate-600">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Oil / Fat
                </span>
                <span>{activeAnalysis.estimatedOilFat}%</span>
              </div>
              <p className="font-extrabold text-slate-900 text-xs mb-1.5">
                {activeAnalysis.oilGreaseLevel} Grease
              </p>
              <div className="flex flex-wrap gap-1">
                {(['High', 'Moderate', 'Low'] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => updateAttribute('oilGreaseLevel', o)}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                      activeAnalysis.oilGreaseLevel === o
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Steam Sensitivity */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
                <span className="flex items-center gap-1 text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Seal Type
                </span>
                <span>Vent / Seal</span>
              </div>
              <p className="font-extrabold text-slate-900 text-[11px] truncate mb-1.5">
                {activeAnalysis.steamSensitivity}
              </p>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: 'Vented', val: 'High (Needs Venting)' as const },
                  { label: 'Sealed', val: 'Sealed (Anti-Leak)' as const }
                ].map((st) => (
                  <button
                    key={st.label}
                    onClick={() => updateAttribute('steamSensitivity', st.val)}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                      activeAnalysis.steamSensitivity === st.val
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESTAURANT RESULT — AI PACKAGING RECOMMENDATION */}
      {activeAnalysis && !analyzingDishName && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                AI Packaging Recommendation
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {activeAnalysis.primaryRecommendation?.containerType || 'Takeaway Food Container'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintGuide}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Print Kitchen Packing Guide"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Guide</span>
              </button>

              <button
                onClick={handleApplyToEngineClick}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Full Engine Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 1. PRIMARY PACKAGING RECOMMENDATION & AI MOCKUP IMAGE */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* AI-GENERATED PACKAGING MOCKUP IMAGE */}
            <div className="md:col-span-5 space-y-2">
              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-4/3 flex items-center justify-center">
                <img
                  key={mockupKey}
                  src={activeAnalysis.mockupImageUrl || activeImagePreview || '/src/assets/images/takeaway_food_box_1790754347819.jpg'}
                  alt={activeAnalysis.itemName}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    isRegeneratingMockup ? 'scale-95 opacity-50 blur-xs' : 'scale-100 opacity-100'
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
                  Takeaway Mockup
                </div>
              </div>

              {/* Action Buttons: Regenerate Image & Download Image */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerateMockup}
                  disabled={isRegeneratingMockup}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRegeneratingMockup ? 'animate-spin' : ''}`} />
                  <span>Regenerate Image</span>
                </button>

                <button
                  onClick={handleDownloadMockup}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </button>
              </div>
            </div>

            {/* Packaging Specification Cards */}
            <div className="md:col-span-7 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Container Material
                  </span>
                  <p className="font-bold text-slate-800">
                    {activeAnalysis.primaryRecommendation?.material || 'Food-Grade Packaging Material'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Size / Capacity
                  </span>
                  <p className="font-bold text-slate-800">
                    {activeAnalysis.primaryRecommendation?.capacity || '750 ml (Standard Takeaway Portion)'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Lid Type & Venting
                  </span>
                  <p className="font-bold text-slate-800">
                    {activeAnalysis.primaryRecommendation?.lidType || 'Tamper-Evident Snap-Seal Lid'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Spill / Leak Resistance
                  </span>
                  <p className="font-bold text-emerald-700">
                    {activeAnalysis.primaryRecommendation?.spillResistance || 'Leak-Resistant'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Thermal Retention
                  </span>
                  <p className="font-bold text-slate-800">
                    {activeAnalysis.primaryRecommendation?.thermalRetention || 'Maintains Optimal Temperature'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">
                    Sustainability Rating
                  </span>
                  <p className="font-extrabold text-emerald-950">
                    {activeAnalysis.primaryRecommendation?.ecoStatus || '100% Recyclable / Compostable'}
                  </p>
                </div>
              </div>

              {/* Rationale */}
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">
                  Why This Container Was Chosen:
                </span>
                <p className="text-emerald-950 leading-relaxed font-medium">
                  {activeAnalysis.primaryRecommendation?.selectionReason || 'Selected based on dish characteristics and delivery safety.'}
                </p>
              </div>
            </div>
          </div>

          {/* 3. STEP-BY-STEP RESTAURANT PACKING & HANDLING GUIDE */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Kitchen Packing & Handling Instructions (SOP)</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                For Kitchen & Dispatch Staff
              </span>
            </div>

            <div className="space-y-2">
              {activeAnalysis.packingGuide.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {step.stepNumber}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">{step.title}</p>
                    <p className="text-slate-600 leading-relaxed">{step.instruction}</p>
                    {step.tip && (
                      <p className="text-[11px] text-emerald-700 font-medium pt-0.5">
                        💡 Pro-tip: {step.tip}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. PACKAGING MATERIAL & CONSUMABLES SPECIFICATION */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Box className="w-4 h-4 text-emerald-600" />
                <span>Packaging Consumables Specification</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                Material Name → Purpose → Specification
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {activeAnalysis.consumablesList.map((c, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>{c.name}</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">{c.purpose}</div>
                  <div className="text-slate-500 font-medium text-[11px] sm:text-right">{c.specification}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Library & History (Clean & Minimal) */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Uploaded Food Photos Library ({uploads.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400">Stored Locally</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {uploads.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                    {item.dataUrl ? (
                      <img src={item.dataUrl} alt={item.fileName} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate text-xs">{item.fileName}</p>
                    <p className="text-[10px] text-slate-400">{item.fileSizeFormatted}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => runAnalysisOnItem(item)}
                    className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    Analyze
                  </button>
                  <button
                    onClick={() => handleDeleteUpload(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {showImageZoom && activeAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-700">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">{activeAnalysis.itemName}</h4>
                <p className="text-[11px] text-slate-400">{activeAnalysis.primaryRecommendation?.containerType || 'Takeaway Food Container'}</p>
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
                src={activeAnalysis.mockupImageUrl || activeImagePreview || '/src/assets/images/takeaway_food_box_1790754347819.jpg'}
                alt={activeAnalysis.itemName}
                referrerPolicy="no-referrer"
                className="max-h-[60vh] object-contain rounded-xl"
              />
            </div>
            <div className="p-4 text-xs text-slate-600 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span>{activeAnalysis.primaryRecommendation?.material || 'Food-Grade Material'}</span>
              <button
                onClick={handleDownloadMockup}
                className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
