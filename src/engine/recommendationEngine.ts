import { CommodityInput, PackagingMaterial, MaterialScore, DecisionFactorScore, AnalysisResult } from '../types/packaging';
import { PACKAGING_MATERIALS } from '../data/materials';

/**
 * Advanced FoodTech Mathematical Recommendation Engine
 * Replaces hardcoded static bounds with continuous multi-criteria scoring
 * based on WVTR, OTR, thermal glass-transition, and food physiology metrics.
 */

interface ComputedWeights {
  wWVTR: number;
  wOTR: number;
  wThermal: number;
  wShelfLife: number;
  wChemical: number;
}

export function calculateAnalysisResult(input: CommodityInput): AnalysisResult {
  const allScores = PACKAGING_MATERIALS.map((material) => scoreMaterial(material, input));

  // Sort descending by continuous compatibility score
  allScores.sort((a, b) => b.compatibility - a.compatibility);

  // Assign ranks
  allScores.forEach((item, index) => {
    item.rank = index + 1;
    if (index === 0) {
      item.matchClassification = 'Optimal Fit';
    } else if (item.compatibility >= 75) {
      item.matchClassification = 'Strong Alternative';
    } else if (item.compatibility >= 60) {
      item.matchClassification = 'Viable with Limitations';
    } else {
      item.matchClassification = 'Not Recommended';
    }
  });

  const primaryRecommendation = allScores[0];
  const alternatives = allScores.slice(1, 4);

  // Overall decision factors derived from user input
  const decisionFactors = computeOverallDecisionFactors(input, primaryRecommendation.material);

  // Determine recommended packaging approach
  let recommendedPackagingApproach = primaryRecommendation.material.recommendedApproach;
  let freshProduceWarning: string | undefined = undefined;

  if (input.isFreshProduce) {
    freshProduceWarning =
      'Fresh produce continues to respire after harvest (absorbing O₂ and emitting CO₂ + H₂O). Packaging must provide equilibrium gas exchange to avoid anaerobic ethanol fermentation and excessive condensation.';
    if (input.respirationRate === 'High') {
      recommendedPackagingApproach = 'Modified Atmosphere Packaging (MAP) with laser micro-perforations & anti-fog additives';
    } else {
      recommendedPackagingApproach = 'Semi-permeable equilibrium atmosphere overwrap or ventilated thermoformed clamshell';
    }
  }

  return {
    id: `pw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    input,
    primaryRecommendation,
    alternatives,
    allRankedMaterials: allScores,
    decisionFactors,
    recommendedPackagingApproach,
    freshProduceWarning
  };
}

/**
 * Score a single material against commodity input using continuous physical metrics
 */
function scoreMaterial(material: PackagingMaterial, input: CommodityInput): MaterialScore {
  const dynamicReasons: string[] = [];
  const warnings: string[] = [];

  // 1. Calculate continuous physical sub-scores (0 - 100)
  const { score: sWVTR, reason: rWVTR, warning: wWVTR } = computeWVTRScore(material, input);
  const { score: sOTR, reason: rOTR, warning: wOTR } = computeOTRScore(material, input);
  const { score: sThermal, reason: rThermal, warning: wThermal } = computeThermalScore(material, input);
  const { score: sShelfLife, reason: rShelfLife } = computeShelfLifeScore(material, input);
  const { score: sChemical, reason: rChemical, warning: wChem } = computeChemicalScore(material, input);

  if (rWVTR) dynamicReasons.push(rWVTR);
  if (rOTR) dynamicReasons.push(rOTR);
  if (rThermal) dynamicReasons.push(rThermal);
  if (rShelfLife) dynamicReasons.push(rShelfLife);
  if (rChemical) dynamicReasons.push(rChemical);

  if (wWVTR) warnings.push(wWVTR);
  if (wOTR) warnings.push(wOTR);
  if (wThermal) warnings.push(wThermal);
  if (wChem) warnings.push(wChem);

  // 2. Compute dynamic criterion weights based on commodity sensitivity
  const weights = computeCriterionWeights(input);

  // 3. Weighted continuous aggregation
  const rawScore =
    weights.wWVTR * sWVTR +
    weights.wOTR * sOTR +
    weights.wThermal * sThermal +
    weights.wShelfLife * sShelfLife +
    weights.wChemical * sChemical;

  // Round to nearest integer between 5 and 98 to represent realistic continuous confidence
  const compatibility = Math.round(Math.min(98, Math.max(5, rawScore)));

  // Generate material-specific factor scores
  const factorScores: DecisionFactorScore[] = [
    {
      id: 'wvtr-factor',
      name: 'Moisture Management (WVTR)',
      score: Math.round(sWVTR),
      level: sWVTR >= 75 ? 'High' : sWVTR >= 50 ? 'Medium' : 'Low',
      influence: sWVTR >= 75 ? 'Positive' : 'Constraint',
      explanation: rWVTR || `WVTR rating: ${material.wvtr} g/(m²·day) vs food moisture ${input.moisture}%.`
    },
    {
      id: 'otr-factor',
      name: 'Oxygen Barrier & Gas Permeation (OTR)',
      score: Math.round(sOTR),
      level: sOTR >= 75 ? 'High' : sOTR >= 50 ? 'Medium' : 'Low',
      influence: sOTR >= 75 ? 'Positive' : 'Critical Need',
      explanation: rOTR || `OTR value: ${material.otr} cc/(m²·day·atm) under ${input.respirationRate} respiration.`
    },
    {
      id: 'thermal-factor',
      name: 'Thermal & Glass-Transition Stability',
      score: Math.round(sThermal),
      level: sThermal >= 75 ? 'High' : sThermal >= 50 ? 'Medium' : 'Low',
      influence: sThermal >= 75 ? 'Positive' : 'Constraint',
      explanation: rThermal || `Tg = ${material.thermalTg}°C at storage ${input.storageTemperature}°C.`
    },
    {
      id: 'shelf-life-factor',
      name: 'Shelf Life Barrier Longevity',
      score: Math.round(sShelfLife),
      level: sShelfLife >= 75 ? 'High' : sShelfLife >= 50 ? 'Medium' : 'Low',
      influence: sShelfLife >= 75 ? 'Positive' : 'Constraint',
      explanation: rShelfLife || `Evaluated for ${input.targetShelfLifeDays} days target shelf life.`
    },
    {
      id: 'chemical-factor',
      name: 'Lipid & Acid Chemical Inertness',
      score: Math.round(sChemical),
      level: sChemical >= 75 ? 'High' : sChemical >= 50 ? 'Medium' : 'Low',
      influence: sChemical >= 75 ? 'Positive' : 'Constraint',
      explanation: rChemical || `Evaluated against ${input.oilFat}% fat and pH ${input.pH}.`
    }
  ];

  return {
    material,
    compatibility,
    rank: 0,
    matchClassification: 'Optimal Fit',
    dynamicReasons: dynamicReasons.slice(0, 4),
    warnings: warnings.slice(0, 3),
    factorScores
  };
}

/**
 * Criterion weights dynamically adjusted for commodity type
 */
function computeCriterionWeights(input: CommodityInput): ComputedWeights {
  let wWVTR = 0.25;
  let wOTR = 0.25;
  let wThermal = 0.20;
  let wShelfLife = 0.15;
  let wChemical = 0.15;

  if (input.isFreshProduce) {
    if (input.respirationRate === 'High') {
      wOTR = 0.35; // Crucial to prevent anaerobic fermentation
      wWVTR = 0.30; // Critical to prevent condensation and gray mold
      wThermal = 0.15;
      wShelfLife = 0.10;
      wChemical = 0.10;
    } else {
      wOTR = 0.30;
      wWVTR = 0.28;
      wThermal = 0.18;
      wShelfLife = 0.14;
      wChemical = 0.10;
    }
  } else if (input.oilFat >= 20) {
    // High lipid commodities (chips, nuts, milk powder)
    wOTR = 0.38; // Oxidation is primary spoilage mode
    wChemical = 0.22; // Oil barrier and non-swelling
    wWVTR = 0.22; // Prevent sogginess
    wShelfLife = 0.10;
    wThermal = 0.08;
  } else if (input.moisture <= 15) {
    // Dry hygroscopic staples (rice, flour, spices)
    wWVTR = 0.38; // Moisture gain causes caking / weevils
    wOTR = 0.22;
    wShelfLife = 0.20;
    wThermal = 0.10;
    wChemical = 0.10;
  } else if (input.storageType === 'Frozen' || input.storageTemperature <= 0) {
    // Sub-zero storage
    wThermal = 0.35; // Cold flexibility & Tg non-embrittlement
    wWVTR = 0.25; // Prevent freezer burn
    wOTR = 0.18;
    wShelfLife = 0.12;
    wChemical = 0.10;
  }

  // Normalize weights so they sum to 1.0
  const sum = wWVTR + wOTR + wThermal + wShelfLife + wChemical;
  return {
    wWVTR: wWVTR / sum,
    wOTR: wOTR / sum,
    wThermal: wThermal / sum,
    wShelfLife: wShelfLife / sum,
    wChemical: wChemical / sum
  };
}

/**
 * 1. WVTR Scoring Function
 * Matches water vapor transmission rate against moisture content and RH
 */
function computeWVTRScore(
  mat: PackagingMaterial,
  input: CommodityInput
): { score: number; reason?: string; warning?: string } {
  let optimalWVTR: number;
  let sigma: number = 1.3;

  if (input.isFreshProduce) {
    if (input.respirationRate === 'High') {
      // Actively respiring produce produces H2O vapor; needs breathability or anti-fog
      optimalWVTR = 40.0;
      sigma = 1.1;
      if (mat.wvtr < 2.0) {
        return {
          score: 18,
          warning: `Impermeable moisture barrier (WVTR ${mat.wvtr}) creates 100% saturation and water droplets, triggering rapid Botrytis fungal decay.`
        };
      }
    } else {
      optimalWVTR = 18.0;
    }
  } else if (input.moisture <= 15) {
    // Dry hygroscopic goods need ultra-low WVTR
    optimalWVTR = 0.1;
    sigma = 1.0;
    if (mat.wvtr > 15.0) {
      return {
        score: 22,
        warning: `High WVTR (${mat.wvtr} g/m²/day) allows ambient moisture ingress, causing caking and textural sogginess.`
      };
    }
  } else {
    // Wet meats, dairy, processed foods (prevent dehydration)
    optimalWVTR = 5.0;
    sigma = 1.4;
  }

  // Log-space continuous Gaussian distance
  const logMat = Math.log10(Math.max(0.01, mat.wvtr));
  const logOpt = Math.log10(Math.max(0.01, optimalWVTR));
  const dist = Math.abs(logMat - logOpt);
  const score = 100 * Math.exp(-Math.pow(dist / sigma, 2));

  let reason: string | undefined;
  if (input.isFreshProduce && mat.wvtr >= 20) {
    reason = `WVTR of ${mat.wvtr} g/(m²·day) prevents surface condensation while conserving tissue turgor.`;
  } else if (input.moisture <= 15 && mat.wvtr <= 5) {
    reason = `Ultra-low WVTR (${mat.wvtr} g/m²/day) maintains crispness and halts moisture absorption.`;
  } else if (score >= 80) {
    reason = `Balanced water vapor transmission aligns with ${input.moisture}% commodity moisture.`;
  }

  return { score, reason };
}

/**
 * 2. OTR Scoring Function
 * Matches oxygen barrier vs lipid oxidation risk and aerobic respiration needs
 */
function computeOTRScore(
  mat: PackagingMaterial,
  input: CommodityInput
): { score: number; reason?: string; warning?: string } {
  if (input.isFreshProduce) {
    if (input.respirationRate === 'High') {
      // High respiration: airtight materials are destructive
      if (mat.otr < 50) {
        return {
          score: 8,
          warning: `Hermetic gas barrier (OTR ${mat.otr} cc/m²·day·atm) forces tissues into anaerobic fermentation, producing ethanol off-flavors and cellular breakdown.`
        };
      }
      // Micro-perforated or high OTR films thrive here
      const optimalOTR = 3800.0;
      const logMat = Math.log10(mat.otr);
      const logOpt = Math.log10(optimalOTR);
      const score = 100 * Math.exp(-Math.pow(Math.abs(logMat - logOpt) / 0.9, 2));
      return {
        score,
        reason: `Engineered gas permeability (OTR ${mat.otr} cc/m²·day·atm) sustains steady aerobic metabolism and curbs anaerobic decay.`
      };
    } else {
      // Medium / Low respiration
      const optimalOTR = 1200.0;
      const logMat = Math.log10(Math.max(1, mat.otr));
      const logOpt = Math.log10(optimalOTR);
      const score = 100 * Math.exp(-Math.pow(Math.abs(logMat - logOpt) / 1.2, 2));
      return {
        score,
        reason: `Equilibrium OTR matches moderate post-harvest respiration kinetics.`
      };
    }
  }

  // Non-fresh produce
  if (input.oilFat >= 20) {
    // High fat: severe auto-oxidation risk
    if (mat.otr > 500) {
      return {
        score: 15,
        warning: `High oxygen transmission (${mat.otr} cc/m²·day·atm) triggers rapid peroxide formation and rancid lipid oxidation.`
      };
    }
    // High barrier rewarded
    const optimalOTR = 0.5;
    const logMat = Math.log10(Math.max(0.01, mat.otr));
    const logOpt = Math.log10(optimalOTR);
    const score = 100 * Math.exp(-Math.pow(Math.abs(logMat - logOpt) / 1.5, 2));
    return {
      score,
      reason: `Tight oxygen barrier (OTR ${mat.otr} cc/m²·day·atm) blocks free radical lipid auto-oxidation.`
    };
  }

  // Standard perishables or staples
  const optimalOTR = 30.0;
  const logMat = Math.log10(Math.max(0.01, mat.otr));
  const logOpt = Math.log10(optimalOTR);
  const score = 100 * Math.exp(-Math.pow(Math.abs(logMat - logOpt) / 1.6, 2));
  return {
    score,
    reason: `Oxygen barrier performance fulfills ${input.targetShelfLifeDays}-day quality retention needs.`
  };
}

/**
 * 3. Thermal & Glass-Transition Scoring Function
 */
function computeThermalScore(
  mat: PackagingMaterial,
  input: CommodityInput
): { score: number; reason?: string; warning?: string } {
  const temp = input.storageTemperature;

  if (input.storageType === 'Frozen' || temp <= 0) {
    // Sub-zero: Tg embrittlement check
    // If Tg is above storage temperature, material enters glassy state and is brittle
    if (mat.thermalTg > 20 && mat.coldFlexibility < 60) {
      return {
        score: 28,
        warning: `Material Tg (${mat.thermalTg}°C) is well above storage temp (${temp}°C), making film brittle and prone to flex-crack pinholing under frozen transport.`
      };
    }
    const score = mat.coldFlexibility * 0.7 + (mat.frozenSuitability * 0.3);
    return {
      score,
      reason: `Tg (${mat.thermalTg}°C) guarantees flexible ductile seal behavior at ${temp}°C without micro-fracturing.`
    };
  }

  if (input.storageType === 'Chilled' || (temp > 0 && temp <= 10)) {
    const score = mat.chilledSuitability;
    return {
      score,
      reason: `Optimized mechanical and barrier performance under chilled cold-chain handling (${temp}°C).`
    };
  }

  // Ambient
  const score = 85 + (mat.heatResistance * 0.15);
  return {
    score,
    reason: `Excellent dimensional and seal stability at ambient storage conditions (${temp}°C).`
  };
}

/**
 * 4. Target Shelf Life Longevity Scoring Function
 */
function computeShelfLifeScore(
  mat: PackagingMaterial,
  input: CommodityInput
): { score: number; reason?: string } {
  const days = input.targetShelfLifeDays;

  if (input.isFreshProduce) {
    // Fresh produce has physiological limits regardless of material
    if (days <= 7) {
      return { score: 92, reason: `Ideal structural protection for short-duration ${days}-day harvest shelf life.` };
    } else if (days <= 21) {
      const score = mat.freshProduceSuitability;
      return { score, reason: `Provides balanced barrier integrity for extended ${days}-day produce marketing window.` };
    } else {
      // Produce > 3 weeks requires specialized MAP or CA
      const score = Math.max(40, mat.freshProduceSuitability - 15);
      return { score, reason: `Extended ${days}-day target demands active atmosphere management and strict chilling.` };
    }
  }

  // Dry or processed items
  if (days >= 45) {
    if (mat.category === 'Foil / Laminate' || mat.category === 'Engineered Barrier') {
      return { score: 96, reason: `Multi-layer high barrier architecture guarantees hermetic stability across ${days} days.` };
    } else if (mat.moistureBarrier === 'High' || mat.oxygenBarrier === 'High') {
      return { score: 85, reason: `Sufficient barrier retention for ${days}-day target shelf life.` };
    } else {
      return { score: 55, reason: `Permeability may lead to sensory or moisture drift over ${days} days.` };
    }
  }

  return { score: 88, reason: `Material durability easily supports target window of ${days} days.` };
}

/**
 * 5. Chemical / Lipid / pH Scoring Function
 */
function computeChemicalScore(
  mat: PackagingMaterial,
  input: CommodityInput
): { score: number; reason?: string; warning?: string } {
  // High Fat / Oil
  if (input.oilFat >= 20) {
    if (mat.oilFatResistance === 'Low') {
      return {
        score: 30,
        warning: `Contact with ${input.oilFat}% free lipids causes polymer swelling, delamination, and seal degradation.`
      };
    }
    const score = mat.oilFatResistance === 'Total' ? 98 : mat.oilFatResistance === 'Superior' ? 94 : 80;
    return {
      score,
      reason: `Resistant contact surface prevents grease migration and structural swelling from ${input.oilFat}% fat content.`
    };
  }

  // High Acidity (pH < 4.0)
  if (input.pH < 4.0) {
    if (mat.id === 'alu-foil-laminate') {
      return {
        score: 86,
        reason: 'Internal co-extruded polyolefin sealant layer shields aluminum core from acidic contact (pH ' + input.pH + ').'
      };
    }
  }

  return { score: 90, reason: `Chemically inert food-contact polymer compliant with pH ${input.pH}.` };
}

/**
 * Overall Decision Factors for the user input
 */
function computeOverallDecisionFactors(input: CommodityInput, primaryMaterial: PackagingMaterial): DecisionFactorScore[] {
  // 1. Moisture Management
  let moistureScore = 80;
  let moistureExplanation = `Moisture content of ${input.moisture}% requires controlled humidity control.`;
  if (input.isFreshProduce) {
    moistureScore = input.moisture >= 85 ? 92 : 82;
    moistureExplanation = `High internal moisture (${input.moisture}%) necessitates anti-fog and breathable transmission to prevent condensation droplets.`;
  } else if (input.moisture <= 10) {
    moistureScore = 95;
    moistureExplanation = `Ultra-dry food (${input.moisture}%) demands high WVTR resistance to stop hygroscopic moisture uptake.`;
  }

  // 2. Oxygen & Oxidation Barrier
  let oxygenScore = 70;
  let oxygenExplanation = 'Oxygen barrier matched to product degradation kinetics.';
  if (input.isFreshProduce) {
    oxygenScore = input.respirationRate === 'High' ? 95 : 82;
    oxygenExplanation = `${input.respirationRate} respiration rate demands sufficient oxygen inflow to avoid anaerobic alcohol fermentation.`;
  } else if (input.oilFat >= 15) {
    oxygenScore = 94;
    oxygenExplanation = `Elevated fat content (${input.oilFat}%) makes lipid auto-oxidation the primary shelf-life limiter, requiring low OTR.`;
  }

  // 3. Respiration Management
  let respirationScore = 40;
  let respirationExplanation = 'Non-respiring commodity with inert shelf-life kinetics.';
  if (input.isFreshProduce) {
    respirationScore = input.respirationRate === 'High' ? 96 : input.respirationRate === 'Medium' ? 84 : 70;
    respirationExplanation = `Actively respiring tissue continues metabolic gas exchange; packaging equilibrium must balance O₂ and CO₂.`;
  }

  // 4. Thermal & Cold Chain Stability
  let thermalScore = 75;
  let thermalExplanation = `Storage temperature set to ${input.storageTemperature}°C (${input.storageType}).`;
  if (input.storageType === 'Frozen' || input.storageTemperature <= 0) {
    thermalScore = 92;
    thermalExplanation = `Sub-zero storage requires low Tg polymer chains to prevent cold embrittlement and pinholing during handling.`;
  } else if (input.storageType === 'Chilled') {
    thermalScore = 86;
    thermalExplanation = `Refrigerated storage (${input.storageTemperature}°C) slows enzymatic spoilage and requires flexible moisture sealing.`;
  }

  // 5. Target Shelf Life Longevity
  let shelfLifeScore = input.targetShelfLifeDays >= 30 ? 90 : 78;
  let shelfLifeExplanation = `Target shelf life of ${input.targetShelfLifeDays} days requires sustained hermetic integrity.`;

  return [
    {
      id: 'df-moisture',
      name: 'Moisture Management (WVTR)',
      score: moistureScore,
      level: moistureScore >= 85 ? 'High' : moistureScore >= 60 ? 'Medium' : 'Low',
      influence: moistureScore >= 85 ? 'Critical Need' : 'Positive',
      explanation: moistureExplanation
    },
    {
      id: 'df-oxygen',
      name: 'Oxygen & Gas Permeation (OTR)',
      score: oxygenScore,
      level: oxygenScore >= 85 ? 'High' : oxygenScore >= 60 ? 'Medium' : 'Low',
      influence: oxygenScore >= 85 ? 'Critical Need' : 'Positive',
      explanation: oxygenExplanation
    },
    {
      id: 'df-respiration',
      name: 'Respiration & Gas Exchange',
      score: respirationScore,
      level: respirationScore >= 85 ? 'High' : respirationScore >= 60 ? 'Medium' : 'Low',
      influence: input.isFreshProduce ? 'Critical Need' : 'Positive',
      explanation: respirationExplanation
    },
    {
      id: 'df-thermal',
      name: 'Thermal & Logistics Stability',
      score: thermalScore,
      level: thermalScore >= 85 ? 'High' : thermalScore >= 60 ? 'Medium' : 'Low',
      influence: input.storageType === 'Frozen' ? 'Critical Need' : 'Positive',
      explanation: thermalExplanation
    },
    {
      id: 'df-shelflife',
      name: 'Shelf Life Barrier Longevity',
      score: shelfLifeScore,
      level: shelfLifeScore >= 85 ? 'High' : 'Medium',
      influence: 'Positive',
      explanation: shelfLifeExplanation
    }
  ];
}
