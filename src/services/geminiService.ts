import { GoogleGenAI, Type } from '@google/genai';
import {
  CommodityInput,
  MaterialScore,
  DecisionFactorScore,
  CustomCommodityAIProfile,
  AnalysisResult
} from '../types/packaging';

/**
 * Enterprise PackWise Gemini AI Service
 * Powered by @google/genai TypeScript SDK
 */
const apiKey = process.env.GEMINI_API_KEY || '';

// Initialize client if API key is present
const aiClient: GoogleGenAI | null =
  apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== ''
    ? new GoogleGenAI({ apiKey })
    : null;

export async function askPackWiseAssistant(
  question: string,
  analysisResultOrContext:
    | AnalysisResult
    | {
        commodity: CommodityInput;
        primaryRecommendation: MaterialScore;
        decisionFactors: DecisionFactorScore[];
      }
): Promise<{ answer: string; source: string }> {
  // Normalize context
  const commodity: CommodityInput =
    'input' in analysisResultOrContext
      ? analysisResultOrContext.input
      : analysisResultOrContext.commodity;

  const primaryRecommendation: MaterialScore = analysisResultOrContext.primaryRecommendation;

  const decisionFactors: DecisionFactorScore[] = analysisResultOrContext.decisionFactors;

  // 1. Try Direct GoogleGenAI SDK if initialized in browser
  if (aiClient) {
    try {
      const systemInstruction = `You are "PackWise Assistant", an expert Food Packaging AI built for the Smart India Hackathon (SIH26236) under the Ministry of Food Processing Industries (MoFPI).
You are evaluating food packaging with scientific precision.
COMMODITY PARAMETERS:
- Name: ${commodity.customName || commodity.commodityType}
- Moisture: ${commodity.moisture}%
- Oil/Fat: ${commodity.oilFat}%
- pH: ${commodity.pH}
- Respiration: ${commodity.respirationRate}
- Target Shelf Life: ${commodity.targetShelfLifeDays} days
- Storage: ${commodity.storageTemperature}°C (${commodity.storageType}), ${commodity.relativeHumidity}% RH
- Transport: ${commodity.transportationCondition}
- Fresh Produce: ${commodity.isFreshProduce ? 'Yes (actively respiring horticultural crop)' : 'No (shelf-stable)'}

TOP RECOMMENDATION:
- Material: ${primaryRecommendation.material.name} (${primaryRecommendation.material.shortName})
- Compatibility: ${primaryRecommendation.compatibility}%
- Advantages: ${primaryRecommendation.material.advantages.join('; ')}
- Limitations: ${primaryRecommendation.material.limitations.join('; ')}
- Approach: ${primaryRecommendation.material.recommendedApproach}

DECISION METRICS:
${decisionFactors.map((f) => `- ${f.name}: ${f.score}% (${f.level}) - ${f.explanation}`).join('\n')}

GUIDELINES:
1. Ground your answer in food science: WVTR, OTR, glass-transition (Tg), lipid auto-oxidation, and postharvest respiration kinetics.
2. If fresh produce, emphasize that living produce continues postharvest respiration; airtight films cause anaerobic ethanol spoilage.
3. Be concise and authoritative (under 140 words).`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: question,
        config: {
          systemInstruction,
          temperature: 0.3
        }
      });

      if (response.text) {
        return { answer: response.text, source: 'gemini-2.5-flash (direct-sdk)' };
      }
    } catch (directErr) {
      console.warn('Direct SDK call failed, routing to server proxy:', directErr);
    }
  }

  // 2. Try Server-Side Proxy Endpoint
  try {
    const res = await fetch('/api/gemini/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        context: {
          commodity,
          primaryRecommendation,
          decisionFactors
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        answer: data.answer || 'Recommendation evaluated successfully.',
        source: data.source || 'gemini-2.5-flash'
      };
    }
  } catch (err) {
    console.warn('Backend proxy unavailable, activating offline food science reasoning:', err);
  }

  // 3. Resilient Deterministic Food Science Fallback
  return {
    answer: getClientFallbackReply(question, commodity, primaryRecommendation),
    source: 'foodtech-heuristic-engine'
  };
}

export async function profileCustomCommodityAI(
  commodityName: string
): Promise<{ profile: CustomCommodityAIProfile; source: string }> {
  // 1. Try Direct GoogleGenAI SDK if initialized
  if (aiClient) {
    try {
      const prompt = `As a Food Science and Postharvest Technology expert for the Ministry of Food Processing Industries (MoFPI), estimate the realistic food composition and storage characteristics of the commodity: "${commodityName}".`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a senior Food Packaging Scientist. Provide realistic food properties for packaging analysis. Return clean structured JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              moisture: { type: Type.NUMBER },
              oilFat: { type: Type.NUMBER },
              pH: { type: Type.NUMBER },
              respirationRate: { type: Type.STRING },
              defaultShelfLifeDays: { type: Type.INTEGER },
              isFreshProduce: { type: Type.BOOLEAN },
              recommendedStorageType: { type: Type.STRING },
              recommendedTemperature: { type: Type.NUMBER },
              recommendedHumidity: { type: Type.NUMBER },
              rationale: { type: Type.STRING }
            },
            required: [
              'name',
              'moisture',
              'oilFat',
              'pH',
              'respirationRate',
              'defaultShelfLifeDays',
              'isFreshProduce',
              'recommendedStorageType',
              'recommendedTemperature',
              'recommendedHumidity',
              'rationale'
            ]
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        const validatedProfile = sanitizeProfile(parsed, commodityName);
        return { profile: validatedProfile, source: 'gemini-2.5-flash (direct-sdk)' };
      }
    } catch (e) {
      console.warn('Direct profiling failed, trying backend proxy:', e);
    }
  }

  // 2. Try Server Proxy
  try {
    const res = await fetch('/api/gemini/profile-commodity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commodityName })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.profile) {
        return {
          profile: data.profile,
          source: data.source || 'gemini-2.5-flash'
        };
      }
    }
  } catch (err) {
    console.warn('Profiling proxy failed, using offline fallback profile:', err);
  }

  // 3. Offline Biochemical Fallback Profile
  return {
    profile: getClientFallbackProfile(commodityName),
    source: 'biochemical-domain-knowledge'
  };
}

function sanitizeProfile(raw: Record<string, unknown>, fallbackName: string): CustomCommodityAIProfile {
  const moistureVal = Number(raw.moisture);
  const oilVal = Number(raw.oilFat);
  const phVal = Number(raw.pH);
  const resp = String(raw.respirationRate);
  const shelf = Number(raw.defaultShelfLifeDays);
  const stType = String(raw.recommendedStorageType);

  return {
    name: typeof raw.name === 'string' ? raw.name : fallbackName,
    moisture: Math.min(100, Math.max(0, isNaN(moistureVal) ? 60 : moistureVal)),
    oilFat: Math.min(100, Math.max(0, isNaN(oilVal) ? 2 : oilVal)),
    pH: Math.min(14, Math.max(1, isNaN(phVal) ? 5.5 : phVal)),
    respirationRate: resp === 'High' || resp === 'Medium' || resp === 'Low' ? resp : 'Medium',
    defaultShelfLifeDays: Math.max(1, isNaN(shelf) ? 14 : shelf),
    isFreshProduce: Boolean(raw.isFreshProduce),
    recommendedStorageType:
      stType === 'Ambient' || stType === 'Chilled' || stType === 'Frozen' ? stType : 'Chilled',
    recommendedTemperature: Number(raw.recommendedTemperature) || 4,
    recommendedHumidity: Math.min(100, Math.max(0, Number(raw.recommendedHumidity) || 85)),
    rationale:
      typeof raw.rationale === 'string'
        ? raw.rationale
        : `Biochemical profile estimated for ${fallbackName}.`
  };
}

function getClientFallbackReply(
  question: string,
  c: CommodityInput,
  rec: MaterialScore
): string {
  const q = question.toLowerCase();
  const m = rec.material;
  const name = c.customName || c.commodityType || 'this item';

  if (q.includes('why') || q.includes('recommend') || q.includes('breathable') || q.includes('film')) {
    if (c.isFreshProduce) {
      return `For ${name}, ${m.shortName} was selected because fresh produce actively respires (${c.respirationRate} rate). Airtight films would deplete oxygen below the 1% extinction threshold and trigger anaerobic fermentation, off-flavors, and tissue decay. ${m.shortName} maintains required O₂/CO₂ gas equilibrium while keeping moisture at ${c.moisture}%.`;
    }
    return `For ${name}, ${m.shortName} was recommended because its barrier properties match your ${c.moisture}% moisture and ${c.oilFat}% fat parameters, preventing moisture loss/gain and oxidative rancidity over ${c.targetShelfLifeDays} days.`;
  }

  if (q.includes('shelf life') || q.includes('increase') || q.includes('days')) {
    return `Increasing the target shelf life from ${c.targetShelfLifeDays} to 60+ days increases oxygen and moisture ingress risks. To reach that extended duration, consider transitioning to high-barrier laminates (e.g. Metallized Film, EVOH barrier, or Aluminium Foil laminate) paired with nitrogen gas flushing.`;
  }

  if (q.includes('alternative') || q.includes('eco') || q.includes('biodegradable')) {
    return `A strong sustainable alternative is Biodegradable PLA/PBAT Film or Kraft Paper-PLA Laminate. For fresh commodities, breathable compostable bio-films allow gas exchange while reducing petroleum plastic waste.`;
  }

  return `At ${c.storageTemperature}°C and ${c.relativeHumidity}% RH, ${m.name} maintains structural integrity and seal strength, ensuring quality preservation for ${name}.`;
}

function getClientFallbackProfile(commodityName: string): CustomCommodityAIProfile {
  const lower = commodityName.toLowerCase();
  const isFruitVeg =
    lower.includes('tomato') ||
    lower.includes('mango') ||
    lower.includes('guava') ||
    lower.includes('apple') ||
    lower.includes('banana') ||
    lower.includes('berry') ||
    lower.includes('spinach') ||
    lower.includes('onion') ||
    lower.includes('pepper') ||
    lower.includes('cucumber') ||
    lower.includes('orange') ||
    lower.includes('grape');

  return {
    name: commodityName,
    moisture: isFruitVeg ? 88 : 14,
    oilFat: isFruitVeg ? 0.3 : 3,
    pH: isFruitVeg ? 4.5 : 6.2,
    respirationRate: isFruitVeg ? 'High' : 'Low',
    defaultShelfLifeDays: isFruitVeg ? 10 : 45,
    isFreshProduce: isFruitVeg,
    recommendedStorageType: isFruitVeg ? 'Chilled' : 'Ambient',
    recommendedTemperature: isFruitVeg ? 4 : 22,
    recommendedHumidity: isFruitVeg ? 90 : 55,
    rationale: `Profile estimated based on biochemical characteristics of ${commodityName}.`
  };
}
