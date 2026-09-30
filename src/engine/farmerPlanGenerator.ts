import {
  FarmerContext,
  PackagingAsset,
  PackingStep,
  PackingTransportPlan,
  RecommendationReportData
} from '../types/farmer';
import { AnalysisResult } from '../types/packaging';

/**
 * Generates dynamic, farmer-friendly step-by-step packing instructions
 * based on crop physiology, package capacity, and transport conditions.
 */
export function generateHowToPackSteps(
  crop: string,
  farmerContext: FarmerContext,
  asset: PackagingAsset,
  recommendation: AnalysisResult
): PackingStep[] {
  const cropLower = (crop || 'Produce').toLowerCase();
  const isTomato = cropLower.includes('tomato');
  const isMango = cropLower.includes('mango');
  const isBerry = cropLower.includes('strawberr') || cropLower.includes('berr');
  const isTuber = cropLower.includes('potato') || cropLower.includes('onion');
  const isFragile = isTomato || isMango || isBerry;

  const duration = farmerContext.transportDuration || 8;
  const isLongTransit = duration >= 6;
  const isAmbient = !farmerContext.refrigerationAvailable;

  const steps: PackingStep[] = [
    {
      stepNumber: 1,
      title: 'Field Harvest Sorting & Culling',
      teTitle: 'పంటను వేరుచేయడం మరియు గ్రేడింగ్',
      instruction: `Inspect all harvested ${crop}. Immediately remove any bruised, cracked, pest-punctured, or over-ripe units. Only pack firm, uniform-sized produce at the appropriate commercial maturity stage.`,
      teInstruction: `కోసిన ${crop}లలో పగిలిన, నలిగిన లేదా చీడపీడలు పట్టిన వాటిని వెంటనే వేరుచేయండి. గట్టిగా మరియు ఒకే పరిమాణంలో ఉన్న నాణ్యమైన పంటను మాత్రమే ఎంచుకోండి.`,
      scientificRationale: `Wounded or over-ripe ${crop} releases high pulses of ethylene (C₂H₄), accelerating softening, fungal decay, and senescence across the entire container within ${duration} hours.`,
      criticalNotice: isTomato ? 'For long transit (>6 hours), pick at the breaker/pink stage (10-30% red color).' : undefined,
      iconName: 'scissors'
    },
    {
      stepNumber: 2,
      title: `Sanitize & Prepare ${asset.name}`,
      teTitle: 'ప్యాకింగ్ పెట్టెను సిద్ధం చేయడం',
      instruction: `Ensure the ${asset.packageType} is completely dry, clean, and free from previous agricultural residue. Check that all ventilation perforations are fully open and clear.`,
      teInstruction: `${asset.packageType} శుభ్రంగా, పొడిగా ఉండేలా చూసుకోండి. గాలి ప్రసరణ రంధ్రాలు మూసుకుపోకుండా స్పష్టంగా ఉన్నాయో లేదో తనిఖీ చేయండి.`,
      scientificRationale: `Perforated airflow is essential to remove respiratory heat (field heat + metabolic heat) and excess transpired humidity, preventing internal sweating.`,
      iconName: 'box'
    },
    {
      stepNumber: 3,
      title: isFragile ? 'Gentle Layering & Orientation Placement' : 'Uniform Volume Placement',
      teTitle: 'సరైన క్రమంలో అమర్చడం',
      instruction: isTomato
        ? `Place tomatoes with the calyx (stem-scar) facing downward or sideways to prevent stem puncture. Maximum 3 layers deep. Do not drop tomatoes into the crate.`
        : `Arrange ${crop} in orderly, compact layers. Distribute weight evenly across the base without forcing or compacting.`,
      teInstruction: isTomato
        ? `టమాటాల తొడిమ భాగం కిందకి లేదా పక్కకి ఉండేలా అమర్చండి, తద్వారా పక్క కాయలకు గుచ్చుకోకుండా ఉంటుంది. గరిష్టంగా 3 వరుసలు మాత్రమే పెట్టండి.`
        : `${crop}ను చక్కగా వరుసలలో అమర్చండి. ఎక్కువ ఒత్తిడి కలిగించకుండా సమానంగా సర్దండి.`,
      scientificRationale: `Vertical compression pressure on lower layers causes internal cell rupture and water-soaked lesions, dropping market value by 40%.`,
      iconName: 'layers'
    },
    {
      stepNumber: 4,
      title: 'Maintain 1-Inch Headspace & Air Ventilation',
      teTitle: 'పైభాగంలో ఖాళీ మరియు గాలి ప్రసరణ',
      instruction: `Fill the crate up to exactly 2.5 cm (1 inch) below the top stacking rim. Never mound produce above the rim. Verify side air slots remain unobstructed.`,
      teInstruction: `పెట్టె పై అంచు కంటే 1 అంగుళం కింద వరకే పంటను నింపండి. ఎట్టి పరిస్థితుల్లోనూ పై అంచు కంటే ఎత్తుగా నింపరాదు. గాలి రంధ్రాలు మూసుకుపోకూడదు.`,
      scientificRationale: `Mounding causes the upper crate in a stack to bear full weight directly onto the fruit below, crushing the top 20% of your crop during transit bumps.`,
      criticalNotice: 'Do not line with plastic sheets that block side air holes.',
      iconName: 'wind'
    },
    {
      stepNumber: 5,
      title: 'Cushioning & Transit Top Shielding',
      teTitle: 'కుషనింగ్ మరియు పై రక్షణ',
      instruction: isLongTransit && isAmbient
        ? `Cover the top layer with a clean, breathable Kraft paper sheet or perforated liner to block road dust and direct sunlight during uncooled transit.`
        : `Verify produce is seated firmly to prevent rolling and abrasion vibration damage during road transit.`,
      teInstruction: isLongTransit && isAmbient
        ? `ఎండ మరియు రోడ్డు దుమ్ము పడకుండా పైభాగంలో రంధ్రాలున్న పేపర్ లేదా బట్టను కప్పండి. గాలి ప్రసరణ ఆగిపోకుండా చూడండి.`
        : `రవాణాలో కుదుపులకు కాయలు దొర్లి దెబ్బతినకుండా స్థిరంగా ఉండేలా చూడండి.`,
      scientificRationale: `Vibration transit frequency (5–20 Hz) causes surface abrasion and accelerated moisture loss through scuffed fruit cuticle.`,
      iconName: 'shield'
    },
    {
      stepNumber: 6,
      title: 'Interlocking Vertical Stacking & Loading',
      teTitle: 'వాహనంలో అమర్చడం మరియు రవాణా',
      instruction: `Stack crates vertically using the interlocking corner tabs. Max 6 crates high on transport vehicle bed. Tie securely with webbed cargo straps, never overtightened wire.`,
      teInstruction: `క్రేట్లను ఒకదానిపై ఒకటి మూలలు సరిగ్గా కలిసేలా నిలువుగా పేర్చండి. గరిష్టంగా 6 క్రేట్ల ఎత్తు మాత్రమే పేర్చండి. తాడుతో గట్టిగా కట్టండి.`,
      scientificRationale: `Interlocking alignment transfers all mechanical compressive load directly through the plastic corner columns, safely bearing up to 240 kg without touching the produce.`,
      iconName: 'truck'
    },
    {
      stepNumber: 7,
      title: 'Add Product & Handling Information Label',
      teTitle: 'లేబుల్ మరియు వివరాలు జతచేయడం',
      instruction: `Affix a prominent perishable handling label specifying: "${crop} — Net Qty: ${Math.min(asset.capacityKg, 20)} kg", harvest date, and "Perishable Fresh Produce • Keep Ventilated • Max Stack 6".`,
      teInstruction: `పెట్టెపై స్పష్టమైన లేబుల్ అంటించండి: "${crop} — నికర బరువు: ${Math.min(asset.capacityKg, 20)} కేజీలు", కోసిన తేదీ, మరియు "తాజా పంట • గాలి తగిలేలా ఉంచండి".`,
      scientificRationale: `Clear traceability and transit handling advisories prevent rough mandi throwing and ensure high retail acceptance at terminal wholesale markets.`,
      iconName: 'file-text'
    }
  ];

  return steps;
}

/**
 * Generates the practical farmer-facing Packing and Transport Plan
 */
export function generatePackingAndTransportPlan(
  crop: string,
  farmerContext: FarmerContext,
  asset: PackagingAsset,
  recommendation: AnalysisResult
): PackingTransportPlan {
  const cropLower = (crop || 'Produce').toLowerCase();
  const isTomato = cropLower.includes('tomato');
  const duration = farmerContext.transportDuration || 8;
  const isLong = duration >= 6;
  const ambientTemp = farmerContext.ambientTemperature || 28;

  return {
    packing: {
      quantityPerPackage: `${Math.min(asset.capacityKg, 20)} kg per ${asset.category.toLowerCase()}`,
      fillLevel: '1 inch (2.5 cm) below top stacking rim (strictly no dome mounding)',
      arrangement: isTomato
        ? 'Stem-end facing downward/sideways; size-graded uniform fruit'
        : 'Uniform size-graded produce arranged in nested rows',
      layers: isTomato ? 'Maximum 3 tiers (18–20 kg total)' : 'Maximum 4 tiers',
      ventilation: `${asset.ventilation} — ensure side wall slots remain open`,
      cushioning: 'Bottom corrugated paper liner or foam bubble mesh for ripe fruit',
      separation: 'Segregate unripe/breaker fruit from mature table fruit; cull bruised units'
    },
    transport: {
      handling: 'Lift only by reinforced side handles; do not drag, drop, or throw crates',
      stacking: 'Maximum 6 crates high in column-stack configuration (max 8 in cold storage)',
      compressionPrecautions: 'Never place gunny sacks, fertilizers, or heavy boxes on top of produce crates',
      ventilationPrecautions: 'Leave 4-inch (10 cm) air passage between crate rows on the truck floor',
      temperatureConsiderations: isLong
        ? `Ambient temp is ${ambientTemp}°C. Schedule transit between 7:00 PM and 6:00 AM to minimize field heat`
        : `Maintain air circulation; avoid standing truck in direct afternoon sun`,
      moistureConsiderations: 'Never pack wet produce with morning dew; moisture accelerates bacterial soft rot',
      transportDuration: `${duration} hours estimated journey time`,
      storageGuidance: 'Hold in shaded, well-ventilated farm staging area on raised wooden pallets'
    },
    dos: [
      `DO harvest ${crop} during cool morning hours (before 9:00 AM) to minimize internal field heat.`,
      `DO inspect and wash reusable ${asset.name} with clean water before loading.`,
      `DO grade produce by size and harvest stage (pack breaker/pink stage for ${duration}h transit).`,
      `DO leave a 1-inch buffer below the crate lip so stacked crates lock on edges, not fruit.`,
      `DO transport during evening/night hours when ambient temperatures drop below 24°C.`,
      `DO use a breathable tarpaulin supported by an overhead frame with a 6-inch air gap for roof ventilation.`
    ],
    donts: [
      `DON'T use airtight plastic covers directly over crates; produce will suffocate and ferment.`,
      `DON'T pack over-ripe, split, or bruised ${crop} with firm market-bound fruit.`,
      `DON'T exceed 20 kg per crate; excessive weight causes severe bottom-layer crushing.`,
      `DON'T stack crates in a brick/staggered pattern; always column-stack corner-to-corner for maximum load support.`,
      `DON'T stand the loaded transport vehicle under direct midday sunlight during mandi waiting periods.`,
      `DON'T walk, stand, or sit on stacked produce crates during loading or unloading.`
    ]
  };
}

/**
 * Builds the comprehensive Recommendation Report Data
 */
export function buildRecommendationReport(
  farmerContext: FarmerContext,
  recommendation: AnalysisResult,
  asset: PackagingAsset
): RecommendationReportData {
  const qty = farmerContext.quantity || 70;
  const capacity = asset.capacityKg || 20;
  const packagesNeeded = Math.ceil(qty / capacity);

  // Losses in traditional unventilated sacks: ~25-30%
  // Losses with validated ventilated packaging: ~3-4%
  const expectedLossReduction = 24.5;
  const shelfLifeExtension = recommendation.input.isFreshProduce ? 5 : 14;

  const crop = farmerContext.crop || 'Crop';
  const duration = farmerContext.transportDuration || 8;
  const now = new Date();

  const whatsappEn = `🌾 *PACKWISE AI — FARMER PACKAGING ADVISORY*
*Government of India • Ministry of Food Processing Industries (MoFPI)*
----------------------------------------------
👨‍🌾 *Crop:* ${crop} (${qty} kg)
📦 *Recommended Package:* ${asset.name}
🔢 *Packages Needed:* ${packagesNeeded} units (${capacity} kg/unit)
⏱️ *Transport:* ${duration} hrs (${farmerContext.refrigerationAvailable ? 'Refrigerated' : 'Uncooled Ambient'})
🛡️ *Expected Loss Reduction:* Saves up to ${Math.round(qty * 0.24)} kg produce from transit spoilage!
✅ *Key Step:* Pack 1-inch below rim, stack max 6 crates high with open side ventilation.
----------------------------------------------
*Report ID:* PW-FARM-${now.getTime().toString().slice(-6)}`;

  const whatsappTe = `🌾 *ప్యాక్‌వైజ్ AI — రైతు ప్యాకేజింగ్ సలహా పత్రం*
*భారత ప్రభుత్వం • ఆహార శుద్ధి పరిశ్రమల మంత్రిత్వ శాఖ (MoFPI)*
----------------------------------------------
👨‍🌾 *పంట:* ${crop} (${qty} కిలోలు)
📦 *సిఫార్సు చేయబడిన ప్యాకేజింగ్:* ${asset.name}
🔢 *కావలసిన పెట్టెల సంఖ్య:* ${packagesNeeded} పెట్టెలు (ఒక్కోటి ${capacity} కేజీలు)
⏱️ *రవాణా సమయం:* ${duration} గంటలు (${farmerContext.refrigerationAvailable ? 'శీతలీకరణతో' : 'సాధారణ రవాణా'})
🛡️ *నష్ట నివారణ:* దాదాపు ${Math.round(qty * 0.24)} కిలోల పంట పాడవకుండా కాపాడుతుంది!
✅ *ముఖ్య సూచన:* పై అంచు కన్నా 1 అంగుళం కిందకు మాత్రమే నింపండి. గరిష్టంగా 6 క్రేట్లు మాత్రమే పేర్చండి.
----------------------------------------------
*రిపోర్ట్ ID:* PW-FARM-${now.getTime().toString().slice(-6)}`;

  return {
    reportId: `PW-FARM-${now.getTime().toString().slice(-6)}`,
    generatedAt: now.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    farmerContext,
    analysisResult: recommendation,
    packagingAsset: asset,
    estimatedPackagesNeeded: packagesNeeded,
    expectedLossReductionPercent: expectedLossReduction,
    estimatedShelfLifeExtensionDays: shelfLifeExtension,
    whatsappShareTextEn: whatsappEn,
    whatsappShareTextTe: whatsappTe
  };
}
