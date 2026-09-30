import { FarmerContext, FarmerLanguage, PackingStep } from '../types/farmer';
import { AnalysisResult } from '../types/packaging';

export interface VoiceTurnResponse {
  spokenReply: string;
  teSpokenReply?: string;
  updatedContext: FarmerContext;
  audioBase64?: string; // WAV from gemini-3.8-flash-lite-tts
  missingFields: string[];
}

/**
 * Sends farmer spoken utterance and current context to backend Gemini extraction service.
 * Supports Telugu and English natively.
 */
export async function sendFarmerVoiceTurn(
  utterance: string,
  currentContext: FarmerContext,
  language: FarmerLanguage = 'en'
): Promise<VoiceTurnResponse> {
  try {
    const res = await fetch('/api/gemini/farmer-voice-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        utterance,
        currentContext,
        language
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend farmer voice turn call failed, using client fallback:', err);
  }

  // Resilient heuristic client fallback
  return runClientHeuristicExtraction(utterance, currentContext, language);
}

/**
 * Requests speech audio for given text via Gemini TTS API or browser speech
 */
export async function requestGeminiTTS(
  text: string,
  language: FarmerLanguage = 'en'
): Promise<string | null> {
  try {
    const res = await fetch('/api/gemini/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        return `data:audio/wav;base64,${data.audioBase64}`;
      }
    }
  } catch (e) {
    console.warn('Gemini TTS endpoint unavailable:', e);
  }
  return null;
}

/**
 * Requests explanation of a specific packing step
 */
export async function explainPackingStepAI(
  step: PackingStep,
  crop: string,
  packageName: string,
  language: FarmerLanguage = 'en'
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/explain-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepNumber: step.stepNumber,
        title: step.title,
        instruction: step.instruction,
        scientificRationale: step.scientificRationale,
        crop,
        packageName,
        language
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.explanation) {
        return data.explanation;
      }
    }
  } catch (err) {
    console.warn('Explain step endpoint failed:', err);
  }

  // Fallback to grounded rationale
  if (language === 'te') {
    return `${crop} కోసం ఈ దశ చాలా ముఖ్యం: ${step.teInstruction || step.instruction}. శాస్త్రీయ కారణం: ${step.scientificRationale}`;
  }
  return `For ${crop} packed in ${packageName}, this step is critical: ${step.instruction}. Scientific reason: ${step.scientificRationale}`;
}

/**
 * Client heuristic extraction when offline or backend unavailable
 */
function runClientHeuristicExtraction(
  utterance: string,
  prev: FarmerContext,
  lang: FarmerLanguage
): VoiceTurnResponse {
  const text = utterance.toLowerCase();
  const next: FarmerContext = { ...prev };
  const confirmed = new Set(prev.confirmedFields || []);

  // 1. Crop extraction
  if (text.includes('tomato') || text.includes('టమాటో') || text.includes('టమాట')) {
    next.crop = 'Tomato';
    confirmed.add('crop');
  } else if (text.includes('mango') || text.includes('మామిడి')) {
    next.crop = 'Mango';
    confirmed.add('crop');
  } else if (text.includes('potato') || text.includes('బంగాళాదుంప')) {
    next.crop = 'Potato';
    confirmed.add('crop');
  } else if (text.includes('banana') || text.includes('అరటి')) {
    next.crop = 'Banana';
    confirmed.add('crop');
  } else if (text.includes('chilli') || text.includes('mirchi') || text.includes('మిరప')) {
    next.crop = 'Green Chillies';
    confirmed.add('crop');
  }

  // 2. Quantity extraction (e.g. 70 kilos, 70 kg, 50 quintal)
  const qtyMatch = text.match(/(\d+)\s*(kg|kilos|kilo|kgs|కేజీలు|కిలోలు|qu|quintal)/i);
  if (qtyMatch) {
    next.quantity = parseInt(qtyMatch[1], 10);
    confirmed.add('quantity');
  } else {
    const numOnly = text.match(/\b(\d{2,4})\b/);
    if (numOnly && !next.quantity) {
      next.quantity = parseInt(numOnly[1], 10);
      confirmed.add('quantity');
    }
  }

  // 3. Transport duration & distance extraction
  const durMatch = text.match(/(\d+)\s*(hours|hour|hrs|hr|గంటలు)/i);
  if (durMatch) {
    next.transportDuration = parseInt(durMatch[1], 10);
    confirmed.add('transportDuration');
  }

  const distMatch = text.match(/(\d+)\s*(km|kms|kilometres|kilometers|కిలోమీటర్లు)/i);
  if (distMatch) {
    const km = parseInt(distMatch[1], 10);
    next.transportDistance = km;
    confirmed.add('transportDistance');
    if (!next.transportDuration) {
      next.transportDuration = Math.max(1, Math.round(km / 35));
      confirmed.add('transportDuration');
    }
  }

  const storageDaysMatch = text.match(/(\d+|one|two|three|four|five|six|seven)\s*(days|day|రోజులు)/i);
  if (storageDaysMatch) {
    const wordToNum: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
    const rawVal = storageDaysMatch[1].toLowerCase();
    const days = wordToNum[rawVal] || parseInt(rawVal, 10) || 2;
    next.storageDuration = days;
    confirmed.add('storageDuration');
  }

  // 4. Refrigeration extraction
  if (
    text.includes('without refrigeration') ||
    text.includes('no refrigeration') ||
    text.includes('normal truck') ||
    text.includes('uncooled') ||
    text.includes('శీతలీకరణ లేదు') ||
    text.includes('ఫ్రిజ్ లేదు')
  ) {
    next.refrigerationAvailable = false;
    next.storageType = 'Ambient';
    confirmed.add('refrigerationAvailable');
    confirmed.add('storageType');
  } else if (
    text.includes('refrigerated') ||
    text.includes('cold van') ||
    text.includes('cold chain') ||
    text.includes('శీతలీకరణ ఉంది')
  ) {
    next.refrigerationAvailable = true;
    next.storageType = 'Chilled';
    confirmed.add('refrigerationAvailable');
    confirmed.add('storageType');
  }

  // 5. Freshness
  if (text.includes('fresh') || text.includes('తాజా') || text.includes('harvested today')) {
    next.freshness = 'fresh';
    confirmed.add('freshness');
  }

  next.confirmedFields = Array.from(confirmed);

  // Missing fields determination
  const missing: string[] = [];
  if (!next.crop) missing.push('crop');
  if (!next.quantity) missing.push('quantity');
  if (!next.transportDuration) missing.push('transportDuration');
  if (next.refrigerationAvailable === undefined) missing.push('refrigerationAvailable');

  next.unknownFields = missing;

  // Generate appropriate next question
  let spokenReply = '';
  let teSpokenReply = '';

  if (missing.includes('transportDuration')) {
    spokenReply = `Got it, ${next.quantity || ''} kg of ${next.crop || 'produce'}. How many hours will it take to transport to the market, and do you have refrigeration?`;
    teSpokenReply = `సరేనండి, ${next.quantity || ''} కేజీల ${next.crop || 'పంట'}. మార్కెట్‌కు రవాణా చేయడానికి ఎన్ని గంటలు పడుతుంది? శీతలీకరణ (కూలింగ్) సదుపాయం ఉందా?`;
  } else if (missing.includes('refrigerationAvailable')) {
    spokenReply = `Understood, ${next.transportDuration} hours transit for ${next.crop}. Is this transport in an open truck or refrigerated cold van?`;
    teSpokenReply = `అర్థమైందండి, ${next.transportDuration} గంటల రవాణా. సాధారణ వాహనంలోనా లేక శీతలీకరణ ఉన్న వ్యాన్‌లా?`;
  } else {
    spokenReply = `Understood. For ${next.quantity || 70} kg of fresh ${next.crop || 'produce'} transported for ${next.transportDuration || 8} hours without cooling, I have generated the ideal ventilated packaging and packing plan below.`;
    teSpokenReply = `అర్థమైందండి. ${next.quantity || 70} కేజీల తాజా ${next.crop || 'పంటను'} శీతలీకరణ లేకుండా ${next.transportDuration || 8} గంటలు రవాణా చేయడానికి అనువైన వెంటిలేటెడ్ క్రేట్లు మరియు ప్యాకింగ్ విధానాన్ని కింద చూడవచ్చు.`;
  }

  return {
    spokenReply: lang === 'te' ? teSpokenReply : spokenReply,
    teSpokenReply,
    updatedContext: next,
    missingFields: missing
  };
}
