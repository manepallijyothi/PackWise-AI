import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import { optimizeWarehousePacking, STANDARD_WAREHOUSE_BOXES } from './src/engine/wmsPackingEngine';
import { calculateAnalysisResult } from './src/engine/recommendationEngine';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const RESTAURANT_UPLOADS_DIR = path.join(DATA_DIR, 'restaurant_uploads');
const RESTAURANT_INDEX_FILE = path.join(DATA_DIR, 'restaurant_uploads.json');

// Initialize data persistence directories and files
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(RESTAURANT_UPLOADS_DIR)) {
  fs.mkdirSync(RESTAURANT_UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8');
}
if (!fs.existsSync(RESTAURANT_INDEX_FILE)) {
  fs.writeFileSync(RESTAURANT_INDEX_FILE, JSON.stringify([], null, 2), 'utf-8');
}

function normalizeServerItemAnalysis(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const isLiquid = Boolean(raw.isLiquidOrGravy || raw.stateCategory === 'Liquid' || raw.stateCategory === 'Semi-liquid');
  const isCrispy = raw.leakProofRequirement === 'Vented / Crispy' || raw.stateCategory === 'Crispy';
  const packingTemp = raw.packingTemperatureC || 75;

  const containerType =
    (typeof raw.primaryRecommendation?.containerType === 'string' && raw.primaryRecommendation.containerType) ||
    raw.recommendedPackageType ||
    (isLiquid
      ? 'Microwaveable Polypropylene (PP) Tamper-Evident Leak-Proof Bowl'
      : isCrispy
      ? 'Vented Kraft Bio-Board Clamshell Box with Micro-Steam Ports'
      : 'Heavy-Duty Sugarcane Bagasse Biodegradable Clamshell Container');

  const rawMaterial = raw.primaryRecommendation?.material;
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
    raw.primaryRecommendation?.lidType ||
    (isLiquid
      ? 'Ultra-Tight Snap PP Anti-Fog Dome Lid with Double-Seal Rim'
      : isCrispy
      ? 'Self-Locking Paperboard Flap with Top Corner Steam Vents'
      : 'Interlocking Molded Bagasse Tab-Lock Lid');

  const spillResistance =
    raw.primaryRecommendation?.spillResistance ||
    (isLiquid
      ? '99.5% Hermetic Liquid-Tight (Resists 360° tilt during bike courier)'
      : isCrispy
      ? 'Grease-Resistant (Resists hot oil soak for >90 mins)'
      : '95% Spill-Resistant with dry and semi-solid food');

  const thermalRetention =
    raw.primaryRecommendation?.thermalRetention ||
    (isLiquid
      ? 'Retains food above 65°C for 45 minutes of transit'
      : isCrispy
      ? 'Controlled heat retention with steam release to preserve crispiness'
      : 'Maintains optimal eating temperature for 35 minutes');

  const ecoStatus =
    raw.primaryRecommendation?.ecoStatus ||
    (isLiquid
      ? '100% Curbside Recyclable (#5 PP) & Dishwasher Top-Rack Safe'
      : isCrispy
      ? 'Home Compostable & Plastic-Free Aqueous Barrier'
      : '100% Home & Industrial Compostable (EN 13432 Certified)');

  const selectionReason =
    raw.primaryRecommendation?.selectionReason ||
    raw.rationale ||
    (isLiquid
      ? `For high-moisture liquid/gravy dishes packed hot, hermetic polypropylene prevents transit leaks and enables customer microwave reheating.`
      : isCrispy
      ? `Crispy fried items require micro-venting to prevent trapped steam from softening the crust.`
      : `Sugarcane bagasse offers an eco-friendly, sturdy barrier for warm solid meals, preventing oil seepage.`);

  const mockupImageUrl =
    raw.mockupImageUrl ||
    (isLiquid
      ? '/src/assets/images/soup_curry_container_1790754360693.jpg'
      : '/src/assets/images/takeaway_food_box_1790754347819.jpg');

  return {
    ...raw,
    primaryRecommendation: {
      containerType,
      material: materialName,
      capacity: raw.primaryRecommendation?.capacity || '750 ml (Standard Takeaway Portion)',
      lidType,
      spillResistance,
      thermalRetention,
      ecoStatus,
      selectionReason
    },
    mockupImageUrl
  };
}

// Helpers for restaurant uploads
function readRestaurantUploads(): any[] {
  try {
    if (!fs.existsSync(RESTAURANT_INDEX_FILE)) return [];
    const raw = fs.readFileSync(RESTAURANT_INDEX_FILE, 'utf-8');
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      if (item && item.extractedAnalysis) {
        return {
          ...item,
          extractedAnalysis: normalizeServerItemAnalysis(item.extractedAnalysis)
        };
      }
      return item;
    });
  } catch (err) {
    console.error('Error reading restaurant uploads index:', err);
    return [];
  }
}

function writeRestaurantUploads(data: any[]): boolean {
  try {
    fs.writeFileSync(RESTAURANT_INDEX_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing restaurant uploads index:', err);
    return false;
  }
}

// Helper to read history safely
function readHistoryFromFile(): any[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading history file:', err);
    return [];
  }
}

// Helper to write history safely
function writeHistoryToFile(data: any[]): boolean {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing history file:', err);
    return false;
  }
}

// ----------------------------------------------------
// 1. History Persistence Endpoints
// ----------------------------------------------------

app.get('/api/history', (_req: Request, res: Response) => {
  const history = readHistoryFromFile();
  res.json({ success: true, data: history });
});

app.post('/api/history', (req: Request, res: Response) => {
  try {
    const item = req.body;
    if (!item || !item.id) {
      return res.status(400).json({ success: false, error: 'Invalid history payload' });
    }
    const history = readHistoryFromFile();
    // Prepend new item and keep up to 100 entries
    const updated = [item, ...history.filter((h) => h.id !== item.id)].slice(0, 100);
    writeHistoryToFile(updated);
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/history/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const history = readHistoryFromFile();
    const updated = history.filter((h) => h.id !== id);
    writeHistoryToFile(updated);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/history', (_req: Request, res: Response) => {
  try {
    writeHistoryToFile([]);
    res.json({ success: true, message: 'History cleared' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 2. WMS & Enterprise Warehouse Box Packing Engine
// ----------------------------------------------------

app.get('/api/wms/boxes', (_req: Request, res: Response) => {
  res.json({ success: true, data: STANDARD_WAREHOUSE_BOXES });
});

app.post('/api/wms/pack', (req: Request, res: Response) => {
  try {
    const { items, customBoxes } = req.body;
    const result = optimizeWarehousePacking(items || [], customBoxes);
    // Strict JSON output as specified
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: 'WMS Packing Optimization Error',
      message: err.message
    });
  }
});

// ----------------------------------------------------
// 2.5 Restaurant File / Photo Upload & Packaging Inspection
// ----------------------------------------------------

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'
];
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

app.get('/api/restaurant/uploads', (_req: Request, res: Response) => {
  try {
    const uploads = readRestaurantUploads();
    res.json({ success: true, data: uploads });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/restaurant/upload', (req: Request, res: Response) => {
  try {
    const { fileName, fileType, fileSize, category, base64Data, userId, notes } = req.body;

    if (!fileName || !base64Data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required file data or filename.'
      });
    }

    // Validate extension
    const ext = path.extname(fileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported file type "${ext}". Supported: JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, CSV.`
      });
    }

    // Validate size
    const rawBuffer = Buffer.from(
      base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data,
      'base64'
    );

    if (rawBuffer.length > MAX_UPLOAD_BYTES) {
      return res.status(400).json({
        success: false,
        error: `File size exceeds the 15MB limit (${formatBytes(rawBuffer.length)}).`
      });
    }

    const fileId = `f-rest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const diskPath = path.join(RESTAURANT_UPLOADS_DIR, `${fileId}_${safeName}`);

    fs.writeFileSync(diskPath, rawBuffer);

    const isImage = fileType?.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);

    // Keep thumbnail/preview for images (if reasonably sized)
    let dataUrl: string | undefined = undefined;
    if (isImage) {
      dataUrl = base64Data.includes('base64,')
        ? base64Data
        : `data:${fileType || 'image/jpeg'};base64,${base64Data}`;
    }

    const newRecord = {
      id: fileId,
      userId: userId || 'restaurant-user',
      fileName: fileName,
      fileType: fileType || `application/${ext.replace('.', '')}`,
      fileSize: rawBuffer.length,
      fileSizeFormatted: formatBytes(rawBuffer.length),
      category: category || 'Food Dish / Menu Item',
      storageUrl: `/api/restaurant/file/${fileId}`,
      dataUrl: dataUrl,
      diskPath: diskPath,
      uploadedAt: new Date().toISOString(),
      notes: notes || ''
    };

    const existing = readRestaurantUploads();
    const updated = [newRecord, ...existing.filter((item) => item.id !== fileId)].slice(0, 50);
    writeRestaurantUploads(updated);

    res.json({ success: true, item: newRecord });
  } catch (err: any) {
    console.error('Restaurant upload error:', err);
    res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing the upload. Please try again.'
    });
  }
});

app.get('/api/restaurant/file/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const items = readRestaurantUploads();
    const item = items.find((f) => f.id === id);

    if (!item || !item.diskPath || !fs.existsSync(item.diskPath)) {
      return res.status(404).send('File not found');
    }

    res.setHeader('Content-Type', item.fileType || 'application/octet-stream');
    res.sendFile(item.diskPath);
  } catch (err: any) {
    res.status(500).send('Error retrieving file');
  }
});

app.delete('/api/restaurant/uploads/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const items = readRestaurantUploads();
    const target = items.find((f) => f.id === id);

    if (target && target.diskPath && fs.existsSync(target.diskPath)) {
      try {
        fs.unlinkSync(target.diskPath);
      } catch (e) {
        console.warn('Could not remove file from disk:', e);
      }
    }

    const updated = items.filter((f) => f.id !== id);
    writeRestaurantUploads(updated);

    res.json({ success: true, message: 'File removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Analyze uploaded restaurant dish photo / menu with Gemini Multimodal Vision
app.post('/api/restaurant/analyze-upload', async (req: Request, res: Response) => {
  try {
    const { uploadId, dishName, notes, packingTemp } = req.body;
    const items = readRestaurantUploads();
    const item = items.find((f) => f.id === uploadId);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Upload item not found' });
    }

    const ai = getGeminiClient();
    const effectiveName = dishName || item.fileName.split('.')[0].replace(/[-_]/g, ' ');

    let estimatedMoisture = 65;
    let estimatedOilFat = 14;
    let estimatedPh = 5.2;
    let isLiquid = false;
    let packingTemperature = packingTemp || 72; // default hot food 72°C
    let leakProof: 'Hermetic / Liquid-tight' | 'Moderate / Grease-resistant' | 'Vented / Crispy' = 'Moderate / Grease-resistant';
    let rationale = `Analysis performed for restaurant dish "${effectiveName}".`;

    if (ai && item.dataUrl && item.fileType?.startsWith('image/')) {
      try {
        const base64Data = item.dataUrl.split('base64,')[1];
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: item.fileType
              }
            },
            {
              text: `You are an expert Food Science & Restaurant Takeaway Packaging Specialist for the Ministry of Food Processing Industries (MoFPI).
Analyze this restaurant food image or packaging defect photo for dish: "${effectiveName}".
Identify realistic food parameters for packaging selection:
1. Moisture content percentage (0 - 100)
2. Oil / fat percentage (0 - 100)
3. Acidity / pH (1.0 to 14.0)
4. Is liquid, soup, or heavy gravy? (boolean)
5. Typical packing temperature in Celsius (e.g. 75 for hot biryani/curry, 85 for soup, 4 for chilled dessert, 25 for bakery)
6. Leak proof level needed: "Hermetic / Liquid-tight", "Moderate / Grease-resistant", or "Vented / Crispy" (for fried items like fries/samosas needing steam escape)
7. Short 1-2 sentence packaging rationale.

Return clean JSON matching the schema.`
            }
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                moisture: { type: Type.NUMBER },
                oilFat: { type: Type.NUMBER },
                pH: { type: Type.NUMBER },
                isLiquid: { type: Type.BOOLEAN },
                packingTemp: { type: Type.NUMBER },
                leakProof: { type: Type.STRING },
                rationale: { type: Type.STRING }
              },
              required: ['moisture', 'oilFat', 'pH', 'isLiquid', 'packingTemp', 'leakProof', 'rationale']
            }
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        estimatedMoisture = Math.min(100, Math.max(0, Number(parsed.moisture) || 65));
        estimatedOilFat = Math.min(100, Math.max(0, Number(parsed.oilFat) || 12));
        estimatedPh = Math.min(14, Math.max(1, Number(parsed.pH) || 5.2));
        isLiquid = Boolean(parsed.isLiquid);
        packingTemperature = Number(parsed.packingTemp) || (packingTemp || 70);
        leakProof = ['Hermetic / Liquid-tight', 'Moderate / Grease-resistant', 'Vented / Crispy'].includes(parsed.leakProof)
          ? parsed.leakProof
          : (isLiquid ? 'Hermetic / Liquid-tight' : 'Moderate / Grease-resistant');
        rationale = parsed.rationale || rationale;
      } catch (geminiErr: any) {
        console.warn('Gemini vision analysis failed, using heuristic:', geminiErr.message);
      }
    } else {
      // Heuristic based on dish name
      const lower = effectiveName.toLowerCase();
      if (lower.includes('curry') || lower.includes('gravy') || lower.includes('soup') || lower.includes('dal') || lower.includes('sambar')) {
        estimatedMoisture = 82;
        estimatedOilFat = 16;
        estimatedPh = 4.8;
        isLiquid = true;
        packingTemperature = 80;
        leakProof = 'Hermetic / Liquid-tight';
        rationale = 'High-temperature gravy with free liquid fat requires hermetic seal and hot-fill polypropylene.';
      } else if (lower.includes('fry') || lower.includes('crispy') || lower.includes('samosa') || lower.includes('burger')) {
        estimatedMoisture = 40;
        estimatedOilFat = 22;
        estimatedPh = 5.8;
        isLiquid = false;
        packingTemperature = 70;
        leakProof = 'Vented / Crispy';
        rationale = 'Fried crispy foods require top steam micro-venting to prevent trapped condensation from causing sogginess.';
      } else if (lower.includes('salad') || lower.includes('dessert') || lower.includes('ice') || lower.includes('shake')) {
        estimatedMoisture = 85;
        estimatedOilFat = 6;
        estimatedPh = 5.0;
        isLiquid = false;
        packingTemperature = 4;
        leakProof = 'Moderate / Grease-resistant';
        rationale = 'Cold prepared meal requiring anti-fog clarity and food-contact inertness.';
      }
    }

    // Run FOODPACK Recommendation Engine
    const commodityInput = {
      commodityType: effectiveName,
      customName: effectiveName,
      moisture: estimatedMoisture,
      oilFat: estimatedOilFat,
      pH: estimatedPh,
      respirationRate: 'Low' as const,
      targetShelfLifeDays: 2,
      storageTemperature: packingTemperature > 30 ? 25 : 4,
      relativeHumidity: 65,
      storageType: packingTemperature > 30 ? ('Ambient' as const) : ('Chilled' as const),
      transportationCondition: 'Normal' as const,
      transportationDurationDays: 1,
      isFreshProduce: false
    };

    const recommendation = calculateAnalysisResult(commodityInput);

    const isCrispy = leakProof === 'Vented / Crispy';
    const isChilled = packingTemperature < 20;

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
      ? `For high-moisture (${estimatedMoisture}%) hot liquid/gravy dishes packed at ${packingTemperature}°C, a hermetically sealing polypropylene container prevents transit leaks, withstands grease, and is safe for consumer reheating.`
      : isCrispy
      ? `Crispy and fried menu items require steam micro-venting to prevent trapped condensation from softening the crust, combined with high grease resistance.`
      : `Sugarcane bagasse offers an eco-friendly, sturdy barrier for warm solid food, preventing oil seepage while minimizing environmental impact.`;

    const packingGuide = [
      {
        stepNumber: 1,
        title: isCrispy ? 'Steam Venting Before Closure' : 'Portion & Temperature Check',
        instruction: isCrispy
          ? 'Allow freshly fried food to rest for 20-30 seconds on absorbent paper before boxing to dissipate flash steam.'
          : `Fill container up to 85% volume capacity (${isLiquid ? 'leave 1.5cm headroom' : 'do not overpack above rim'}).`,
        tip: 'Prevents lid bulging and liquid expansion during transit.'
      },
      {
        stepNumber: 2,
        title: 'Rim Inspection & Seal Closure',
        instruction: isLiquid
          ? 'Wipe container rim free of sauce droplets, align the anti-fog lid, and press firmly around circumference until an audible click seals all sides.'
          : 'Fold closure tabs into lock slots firmly to prevent accidental opening during courier handling.',
        tip: 'Listen for double-click seal confirmation.'
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
        tip: 'Maintain vertical orientation during handover to courier.'
      },
      {
        stepNumber: 5,
        title: 'Tamper-Evident Safety Seal',
        instruction: 'Affix tamper-evident food safety tape across the container lid seam or fold the delivery bag lip with a verification seal.',
        tip: 'Assures food safety and customer trust upon delivery.'
      }
    ];

    const consumablesList = [
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

    // Build restaurant analysis summary
    const analysisPayload = {
      itemName: effectiveName,
      dishDescription: notes || item.notes || `Uploaded ${item.fileName}`,
      foodType: isLiquid ? 'Curry / Gravy / Soup' : isCrispy ? 'Crispy / Fried Snack' : 'Prepared Meal / Main Dish',
      visibleIngredients: effectiveName,
      temperatureCategory: (packingTemperature >= 65 ? 'Hot' : packingTemperature >= 40 ? 'Warm' : packingTemperature <= 10 ? 'Chilled' : 'Cold') as 'Hot' | 'Warm' | 'Cold' | 'Chilled',
      stateCategory: (isLiquid ? 'Liquid' : isCrispy ? 'Crispy' : estimatedMoisture > 70 ? 'Semi-liquid' : 'Solid') as 'Liquid' | 'Semi-liquid' | 'Solid' | 'Crispy',
      oilGreaseLevel: (estimatedOilFat >= 18 ? 'High' : estimatedOilFat >= 8 ? 'Moderate' : 'Low') as 'High' | 'Moderate' | 'Low',
      steamSensitivity: (isCrispy ? 'High (Needs Venting)' : isLiquid ? 'Sealed (Anti-Leak)' : 'Moderate') as 'High (Needs Venting)' | 'Moderate' | 'Sealed (Anti-Leak)',
      deliveryDurationMinutes: 35,
      distanceSensitivity: 'Bike courier transit within 8 km delivery radius',
      estimatedMoisture,
      estimatedOilFat,
      estimatedPh,
      packingTemperatureC: packingTemperature,
      isLiquidOrGravy: isLiquid,
      leakProofRequirement: leakProof,
      microwaveSafeRequired: packingTemperature >= 60,
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
      consumablesList,

      engineCommodityInput: commodityInput,
      engineResult: recommendation
    };

    // Update item
    item.extractedAnalysis = analysisPayload;
    writeRestaurantUploads(items);

    res.json({
      success: true,
      analysis: analysisPayload,
      item
    });
  } catch (err: any) {
    console.error('Analyze upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 3. Gemini AI Endpoints
// ----------------------------------------------------

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Dynamic Custom Commodity AI Profiler
app.post('/api/gemini/profile-commodity', async (req: Request, res: Response) => {
  const { commodityName } = req.body;
  if (!commodityName || typeof commodityName !== 'string') {
    return res.status(400).json({ error: 'Commodity name is required' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Graceful offline fallback estimation based on food science heuristics
    const fallbackProfile = generateOfflineCommodityProfile(commodityName);
    return res.json({ profile: fallbackProfile, source: 'fallback-heuristic' });
  }

  try {
    const prompt = `As a Food Science and Postharvest Technology expert for the Ministry of Food Processing Industries (MoFPI), estimate the realistic food composition and storage characteristics of the commodity: "${commodityName}".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a senior Food Packaging Scientist. Provide realistic food properties for packaging analysis. Return clean structured JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Normalized commodity name' },
            moisture: { type: Type.NUMBER, description: 'Moisture content percentage (0 to 100)' },
            oilFat: { type: Type.NUMBER, description: 'Oil/fat content percentage (0 to 100)' },
            pH: { type: Type.NUMBER, description: 'pH level (1.0 to 14.0)' },
            respirationRate: {
              type: Type.STRING,
              description: 'Respiration rate category: Low, Medium, or High'
            },
            defaultShelfLifeDays: {
              type: Type.INTEGER,
              description: 'Typical target marketing shelf life in days'
            },
            isFreshProduce: {
              type: Type.BOOLEAN,
              description: 'True if living respiring horticultural crop; False if processed, dry, meat or dairy'
            },
            recommendedStorageType: {
              type: Type.STRING,
              description: 'Ambient, Chilled, or Frozen'
            },
            recommendedTemperature: {
              type: Type.NUMBER,
              description: 'Recommended storage temperature in Celsius'
            },
            recommendedHumidity: {
              type: Type.NUMBER,
              description: 'Recommended relative humidity percentage (0 to 100)'
            },
            rationale: {
              type: Type.STRING,
              description: 'Brief 1-2 sentence food science rationale for these properties'
            }
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

    const parsed = JSON.parse(response.text || '{}');
    // Ensure bounds and types
    const sanitized = {
      name: parsed.name || commodityName,
      moisture: Math.min(100, Math.max(0, Number(parsed.moisture) || 50)),
      oilFat: Math.min(100, Math.max(0, Number(parsed.oilFat) || 1)),
      pH: Math.min(14, Math.max(1, Number(parsed.pH) || 6.0)),
      respirationRate: ['Low', 'Medium', 'High'].includes(parsed.respirationRate)
        ? parsed.respirationRate
        : 'Medium',
      defaultShelfLifeDays: Math.max(1, Number(parsed.defaultShelfLifeDays) || 14),
      isFreshProduce: Boolean(parsed.isFreshProduce),
      recommendedStorageType: ['Ambient', 'Chilled', 'Frozen'].includes(parsed.recommendedStorageType)
        ? parsed.recommendedStorageType
        : 'Chilled',
      recommendedTemperature: Number(parsed.recommendedTemperature) || 4,
      recommendedHumidity: Math.min(100, Math.max(0, Number(parsed.recommendedHumidity) || 85)),
      rationale: parsed.rationale || 'Estimated based on typical biochemical commodity profiles.'
    };

    return res.json({ profile: sanitized, source: 'gemini-2.5-flash' });
  } catch (err: any) {
    console.error('Gemini commodity profiling error, using fallback:', err.message);
    const fallbackProfile = generateOfflineCommodityProfile(commodityName);
    return res.json({ profile: fallbackProfile, source: 'fallback-error', error: err.message });
  }
});

// PackWise AI Assistant Endpoint
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  const { question, context } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    const offlineReply = generateOfflineAssistantReply(question, context);
    return res.json({ answer: offlineReply, source: 'offline-logic' });
  }

  try {
    const commodity = context?.commodity;
    const recommendation = context?.primaryRecommendation;
    const factors = context?.decisionFactors;

    const systemInstruction = `You are "PackWise Assistant", an expert Food Packaging AI built for the Smart India Hackathon (SIH26236) under the Ministry of Food Processing Industries (MoFPI).
You are analyzing packaging for food commodities with scientific rigor.
CURRENT COMMODITY CONTEXT:
- Commodity: ${commodity?.commodityType || 'Food item'} ${commodity?.customName ? `(${commodity.customName})` : ''}
- Moisture Content: ${commodity?.moisture}%
- Oil/Fat Content: ${commodity?.oilFat}%
- pH Level: ${commodity?.pH}
- Respiration Rate: ${commodity?.respirationRate}
- Target Shelf Life: ${commodity?.targetShelfLifeDays} days
- Storage: ${commodity?.storageTemperature}°C (${commodity?.storageType}), Relative Humidity: ${commodity?.relativeHumidity}%
- Transportation: ${commodity?.transportationCondition}
- Is Fresh Produce: ${commodity?.isFreshProduce ? 'Yes (actively respiring living tissue)' : 'No (processed/stable)'}

CURRENT TOP RECOMMENDATION:
- Material: ${recommendation?.material?.name} (${recommendation?.material?.shortName})
- Compatibility Score: ${recommendation?.compatibility}%
- Key Advantages: ${recommendation?.material?.advantages?.join('; ')}
- Limitations: ${recommendation?.material?.limitations?.join('; ')}
- Recommended Approach: ${recommendation?.material?.recommendedApproach}

DECISION FACTORS:
${factors?.map((f: any) => `- ${f.name}: ${f.score}% (${f.level}) - ${f.explanation}`).join('\n')}

GUIDELINES:
1. Always base your response directly on the provided commodity parameters and physical packaging metrics (WVTR, OTR, glass transition Tg, microbial spoilage risk, lipid auto-oxidation).
2. For fresh produce, emphasize that living produce respires; airtight packaging induces anaerobic fermentation and ethanol off-flavor, requiring controlled breathability/micro-perforation.
3. Be concise, professional, structured with bullet points where helpful. Keep responses under 150 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: question,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    });

    const answer = response.text || 'I analyzed the packaging parameters for your commodity.';
    res.json({ answer, source: 'gemini-2.5-flash' });
  } catch (err: any) {
    console.error('Gemini assistant error, using fallback:', err.message);
    const offlineReply = generateOfflineAssistantReply(question, context);
    res.json({ answer: offlineReply, source: 'offline-error-fallback', error: err.message });
  }
});

// ----------------------------------------------------
// 4. Level 1 Farmer Voice & Post-Harvest Endpoints
// ----------------------------------------------------

// Verified Shopping Directory (MoFPI & GeM Certified)
const SERVER_SHOPPING_DIRECTORY: Record<string, any> = {
  'PKG-HDPE-CRATE-01': {
    packageId: 'PKG-HDPE-CRATE-01',
    title: 'Supreme / AgriPlast 20kg Heavy-Duty Ventilated Produce Crate',
    supplier: 'Government e-Marketplace (GeM) & Authorized Agritech Dealers',
    url: 'https://mkp.gem.gov.in',
    source: 'GeM MoFPI Verified Supplier Registry',
    availability: 'In Stock',
    priceEstimate: '₹280 - ₹340 per crate',
    minOrderQuantity: '10 Units (FPO bulk discounts available)'
  },
  'PKG-MAP-POUCH-02': {
    packageId: 'PKG-MAP-POUCH-02',
    title: 'FreshPack Laser Micro-Perforated MAP Produce Pouches (1kg-3kg)',
    supplier: 'Polyplex AgriBarrier Solutions / IndiaMART Certified Seller',
    url: 'https://www.indiamart.com/proddetail/map-produce-packaging-pouch.html',
    source: 'IndiaMART Verified Packaging Supplier',
    availability: 'In Stock',
    priceEstimate: '₹1.80 - ₹2.50 per pouch',
    minOrderQuantity: '1,000 Pouches'
  },
  'PKG-CORR-VENT-03': {
    packageId: 'PKG-CORR-VENT-03',
    title: 'ITC HortiBox 5-Ply Ventilated Corrugated Fruit & Vegetable Carton',
    supplier: 'ITC Packaging & Board Division / Local Corrugated Converters',
    url: 'https://www.itcportal.com/businesses/packaging-and-printing.aspx',
    source: 'APEDA Approved Packaging Converter Directory',
    availability: 'In Stock',
    priceEstimate: '₹32 - ₹45 per box',
    minOrderQuantity: '100 Boxes'
  },
  'PKG-LDPE-LINER-04': {
    packageId: 'PKG-LDPE-LINER-04',
    title: 'AgriLiner Food-Grade Perforated Produce Liner Bags (50 Micron)',
    supplier: 'Shree Rama Multi-Tech Ltd / Mandi Distributor Network',
    url: 'https://www.indiamart.com/proddetail/perforated-ldpe-liner-bag.html',
    source: 'BIS Certified Plastic Manufacturer',
    availability: 'In Stock',
    priceEstimate: '₹4.20 per bag',
    minOrderQuantity: '250 Bags'
  }
};

app.get('/api/packaging/shopping/:packageId', (req: Request, res: Response) => {
  const { packageId } = req.params;
  const offer = SERVER_SHOPPING_DIRECTORY[packageId];
  if (offer) {
    return res.json({ success: true, offer });
  }
  return res.json({
    success: false,
    offer: {
      packageId,
      title: 'Verified Packaging Item',
      supplier: 'Local APMC / Mandi Packaging Depots',
      url: '',
      source: 'Internal Registry',
      availability: 'Supplier link unavailable'
    }
  });
});

// Farmer Live Voice Turn
app.post('/api/gemini/farmer-voice-turn', async (req: Request, res: Response) => {
  const { utterance, currentContext = {}, language = 'en' } = req.body;
  if (!utterance) {
    return res.status(400).json({ error: 'Utterance is required' });
  }

  const ai = getGeminiClient();

  // If Gemini API client is not configured, run robust heuristic
  if (!ai) {
    const offlineResult = runServerFarmerHeuristic(utterance, currentContext, language);
    return res.json(offlineResult);
  }

  try {
    const isTelugu = language === 'te';
    const systemInstruction = `You are the PackWise Live Farmer Voice Assistant for the Smart India Hackathon (SIH26236) under the Ministry of Food Processing Industries (MoFPI).
You assist Indian agricultural farmers, FPOs, and smallholders with post-harvest produce packaging.
Target language for your spoken response: ${isTelugu ? 'Telugu (తెలుగు)' : 'Indian English'}.

CRITICAL RULES:
1. Extract or update farmer facts:
   - crop (e.g. Tomato, Mango, Potato, Banana, Chili, etc.)
   - quantity (number in kilograms)
   - freshness ('fresh' | 'stored')
   - transportDuration (number of hours to market/mandi)
   - refrigerationAvailable (boolean: true if cold van/reefer, false if open truck/ambient/uncooled)
   - storageType ('Ambient' | 'Chilled')
   - targetBuyer (Mandi, Supermarket, Processor)
2. DO NOT ask technical questions like OTR, WVTR, or equilibrium partial pressures!
3. If the farmer corrects previous info (e.g. "Actually transport is 12 hours" or "నాకు 100 కేజీలు ఉన్నాయి"), replace the old value immediately.
4. Dynamically identify missing information. Ask ONLY the single most relevant next question in simple, natural conversational language (${isTelugu ? 'Telugu' : 'English'}).
5. Return clean JSON matching the required schema.`;

    const prompt = `Current Farmer Context so far:
${JSON.stringify(currentContext, null, 2)}

Farmer just said:
"${utterance}"

Extract the updated information, identify remaining missing fields (from: crop, quantity, transportDuration, refrigerationAvailable), and formulate your warm, brief spoken response in ${isTelugu ? 'Telugu (తెలుగు)' : 'English'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            crop: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            freshness: { type: Type.STRING },
            transportDuration: { type: Type.NUMBER },
            refrigerationAvailable: { type: Type.BOOLEAN },
            storageType: { type: Type.STRING },
            confirmedFields: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            missingFields: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            spokenReply: { type: Type.STRING }
          },
          required: ['confirmedFields', 'missingFields', 'spokenReply']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const updatedContext = {
      ...currentContext,
      crop: parsed.crop || currentContext.crop,
      quantity: parsed.quantity || currentContext.quantity,
      freshness: parsed.freshness || currentContext.freshness || 'fresh',
      transportDuration: parsed.transportDuration !== undefined ? parsed.transportDuration : currentContext.transportDuration,
      refrigerationAvailable: parsed.refrigerationAvailable !== undefined ? parsed.refrigerationAvailable : currentContext.refrigerationAvailable,
      storageType: parsed.storageType || currentContext.storageType || (parsed.refrigerationAvailable ? 'Chilled' : 'Ambient'),
      confirmedFields: Array.from(new Set([...(currentContext.confirmedFields || []), ...(parsed.confirmedFields || [])])),
      unknownFields: parsed.missingFields || []
    };

    return res.json({
      spokenReply: parsed.spokenReply,
      updatedContext,
      missingFields: parsed.missingFields || []
    });
  } catch (err: any) {
    console.error('Farmer voice turn error, fallback applied:', err.message);
    const offlineResult = runServerFarmerHeuristic(utterance, currentContext, language);
    return res.json(offlineResult);
  }
});

// Gemini TTS Endpoint using gemini-3.8-flash-lite-tts
app.post('/api/gemini/tts', async (req: Request, res: Response) => {
  const { text, language = 'en' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required for TTS' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'Gemini client unavailable' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: language === 'te' ? 'Warm, clear Telugu agricultural advisory' : 'Warm, clear Indian English advisory'
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioBase64) {
      return res.json({ success: true, audioBase64 });
    }
    return res.status(500).json({ error: 'No audio returned' });
  } catch (err: any) {
    console.error('Gemini TTS error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Explain Specific Packing Step Endpoint
app.post('/api/gemini/explain-step', async (req: Request, res: Response) => {
  const { stepNumber, title, instruction, scientificRationale, crop, packageName, language = 'en' } = req.body;

  const ai = getGeminiClient();
  const isTelugu = language === 'te';

  if (!ai) {
    const fallback = isTelugu
      ? `${crop} కోసం ఈ దశ (${title}) చాలా అవసరం. కారణం: ${scientificRationale}`
      : `For ${crop} packed in ${packageName}, Step ${stepNumber} (${title}) is vital because: ${scientificRationale}`;
    return res.json({ explanation: fallback });
  }

  try {
    const prompt = `As a Post-Harvest Food Technology expert for Indian farmers (MoFPI):
Explain clearly to a farmer why Step ${stepNumber} ("${title}: ${instruction}") is essential for ${crop} packed in ${packageName}.
Underlying scientific rationale: "${scientificRationale}".
Keep the explanation simple, practical, actionable, and under 80 words in ${isTelugu ? 'Telugu (తెలుగు)' : 'English'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.3
      }
    });

    return res.json({ explanation: response.text });
  } catch (err: any) {
    console.error('Explain step error:', err.message);
    const fallback = isTelugu
      ? `${crop} కోసం ఈ దశ (${title}) చాలా అవసరం. కారణం: ${scientificRationale}`
      : `For ${crop} packed in ${packageName}, Step ${stepNumber} (${title}) is vital because: ${scientificRationale}`;
    return res.json({ explanation: fallback });
  }
});

function runServerFarmerHeuristic(utterance: string, prev: any, lang: string) {
  const text = (utterance || '').toLowerCase();
  const next = { ...prev };
  const confirmed = new Set(prev?.confirmedFields || []);

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
  }

  const qtyMatch = text.match(/(\d+)\s*(kg|kilos|kilo|kgs|కేజీలు|కిలోలు|qu|quintal)/i);
  if (qtyMatch) {
    next.quantity = parseInt(qtyMatch[1], 10);
    confirmed.add('quantity');
  }

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

  if (text.includes('fresh') || text.includes('తాజా') || text.includes('today')) {
    next.freshness = 'fresh';
    confirmed.add('freshness');
  }

  if (text.includes('without refrigeration') || text.includes('no refrigeration') || text.includes('శీతలీకరణ లేదు')) {
    next.refrigerationAvailable = false;
    next.storageType = 'Ambient';
    confirmed.add('refrigerationAvailable');
  } else if (text.includes('refrigerated') || text.includes('cold van') || text.includes('శీతలీకరణ ఉంది')) {
    next.refrigerationAvailable = true;
    next.storageType = 'Chilled';
    confirmed.add('refrigerationAvailable');
  }

  next.confirmedFields = Array.from(confirmed);
  const missing: string[] = [];
  if (!next.crop) missing.push('crop');
  if (!next.quantity) missing.push('quantity');
  if (!next.transportDuration) missing.push('transportDuration');
  if (next.refrigerationAvailable === undefined) missing.push('refrigerationAvailable');
  next.unknownFields = missing;

  let spokenReply = '';
  if (lang === 'te') {
    if (missing.includes('transportDuration')) {
      spokenReply = `సరేనండి, ${next.quantity || ''} కేజీల ${next.crop || 'పంట'}. మార్కెట్‌కు రవాణా చేయడానికి ఎన్ని గంటలు పడుతుంది? శీతలీకరణ (కూలింగ్) సదుపాయం ఉందా?`;
    } else {
      spokenReply = `అర్థమైందండి. ${next.quantity || 70} కేజీల తాజా ${next.crop || 'పంటను'} ${next.transportDuration || 8} గంటలు రవాణా చేయడానికి అనువైన వెంటిలేటెడ్ క్రేట్లు మరియు ప్యాకింగ్ విధానం కింద సిద్ధంగా ఉంది.`;
    }
  } else {
    if (missing.includes('transportDuration')) {
      spokenReply = `Got it, ${next.quantity || ''} kg of ${next.crop || 'produce'}. How many hours will it take to transport to the market, and do you have refrigeration?`;
    } else {
      spokenReply = `Understood. For ${next.quantity || 70} kg of fresh ${next.crop || 'produce'} transported for ${next.transportDuration || 8} hours without cooling, the ideal ventilated packaging and packing plan is updated below.`;
    }
  }

  return {
    spokenReply,
    updatedContext: next,
    missingFields: missing
  };
}

// Offline profiling heuristic fallback
function generateOfflineCommodityProfile(name: string): any {
  const lower = name.toLowerCase();
  let moisture = 60;
  let oilFat = 2;
  let pH = 5.5;
  let respirationRate = 'Medium';
  let defaultShelfLifeDays = 14;
  let isFreshProduce = false;
  let recommendedStorageType = 'Chilled';
  let recommendedTemperature = 4;
  let recommendedHumidity = 85;

  if (
    lower.includes('tomato') ||
    lower.includes('mango') ||
    lower.includes('berry') ||
    lower.includes('apple') ||
    lower.includes('banana') ||
    lower.includes('grape') ||
    lower.includes('guava') ||
    lower.includes('papaya') ||
    lower.includes('spinach') ||
    lower.includes('lettuce') ||
    lower.includes('cauliflower') ||
    lower.includes('cabbage') ||
    lower.includes('carrot') ||
    lower.includes('cucumber') ||
    lower.includes('chili')
  ) {
    isFreshProduce = true;
    moisture = 88;
    oilFat = 0.3;
    pH = lower.includes('chili') ? 5.0 : 4.2;
    respirationRate = 'High';
    defaultShelfLifeDays = 10;
    recommendedStorageType = 'Chilled';
    recommendedTemperature = 4;
    recommendedHumidity = 90;
  } else if (
    lower.includes('rice') ||
    lower.includes('wheat') ||
    lower.includes('flour') ||
    lower.includes('grain') ||
    lower.includes('dal') ||
    lower.includes('pulse')
  ) {
    isFreshProduce = false;
    moisture = 12;
    oilFat = 1.2;
    pH = 6.5;
    respirationRate = 'Low';
    defaultShelfLifeDays = 60;
    recommendedStorageType = 'Ambient';
    recommendedTemperature = 25;
    recommendedHumidity = 60;
  } else if (
    lower.includes('chip') ||
    lower.includes('namkeen') ||
    lower.includes('biscuit') ||
    lower.includes('cookie') ||
    lower.includes('nut') ||
    lower.includes('cashew') ||
    lower.includes('almond')
  ) {
    isFreshProduce = false;
    moisture = 2.5;
    oilFat = 30;
    pH = 6.0;
    respirationRate = 'Low';
    defaultShelfLifeDays = 60;
    recommendedStorageType = 'Ambient';
    recommendedTemperature = 22;
    recommendedHumidity = 50;
  } else if (
    lower.includes('milk') ||
    lower.includes('cheese') ||
    lower.includes('paneer') ||
    lower.includes('butter') ||
    lower.includes('curd')
  ) {
    isFreshProduce = false;
    moisture = 55;
    oilFat = 20;
    pH = 5.8;
    respirationRate = 'Low';
    defaultShelfLifeDays = 15;
    recommendedStorageType = 'Chilled';
    recommendedTemperature = 4;
    recommendedHumidity = 85;
  }

  return {
    name,
    moisture,
    oilFat,
    pH,
    respirationRate,
    defaultShelfLifeDays,
    isFreshProduce,
    recommendedStorageType,
    recommendedTemperature,
    recommendedHumidity,
    rationale: `Profile estimated based on biochemical characteristics for "${name}".`
  };
}

// Offline assistant reply heuristic fallback
function generateOfflineAssistantReply(question: string, context: any): string {
  const q = question.toLowerCase();
  const commodity = context?.commodity;
  const rec = context?.primaryRecommendation?.material;
  const name = commodity?.customName || commodity?.commodityType || 'this commodity';

  if (q.includes('why') || q.includes('recommend') || q.includes('reason')) {
    if (commodity?.isFreshProduce) {
      return `For ${name}, ${rec?.shortName || 'the recommended film'} was selected because ${name} has high moisture (${commodity?.moisture}%) and ${commodity?.respirationRate} respiration. Airtight films would cause anaerobic fermentation and off-odors, whereas this material provides the balanced OTR and WVTR needed to prevent condensation while maintaining produce freshness.`;
    }
    return `For ${name}, ${rec?.shortName || 'the recommended material'} provides an optimal balance: its low WVTR protects the ${commodity?.moisture}% moisture profile, and its oxygen barrier prevents lipid oxidation for its ${commodity?.oilFat}% fat content over ${commodity?.targetShelfLifeDays} days of storage at ${commodity?.storageTemperature}°C.`;
  }

  if (q.includes('shelf life') || q.includes('increase') || q.includes('days')) {
    return `Increasing shelf life from ${commodity?.targetShelfLifeDays || 15} days to 60+ days increases steady-state gas and moisture permeation risk. You would need higher barrier films such as Metallized Film, EVOH barrier, or Aluminium Foil laminate, coupled with modified atmosphere gas flushing (nitrogen) or colder refrigeration.`;
  }

  if (q.includes('alternative') || q.includes('eco') || q.includes('biodegradable')) {
    return `A viable sustainable alternative is Biodegradable PLA/PBAT Film or Kraft Paper-PLA Laminate. For fresh items, compostable bio-films provide natural breathability, while for dry items, kraft-PLA pouches offer renewable barrier protection.`;
  }

  if (q.includes('temperature') || q.includes('chilled') || q.includes('freeze')) {
    return `Temperature directly dictates polymer chain mobility. At ${commodity?.storageTemperature}°C, materials like LDPE and PA/PE retain ductile seal flexibility (Tg well below freezing), preventing brittle micro-cracking and vacuum loss.`;
  }

  return `Based on ${name}'s ${commodity?.moisture}% moisture, ${commodity?.oilFat}% fat, and ${commodity?.storageTemperature}°C storage, ${rec?.name || 'the recommended solution'} delivers optimal food quality preservation and compliance with MoFPI shelf-life standards.`;
}

// ----------------------------------------------------
// 3. Vite Middleware (Dev) & Static Serving (Prod)
// ----------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const server = http.createServer(app);

  // Gemini Live WebSocket Bridge
  const wss = new WebSocketServer({ server, path: '/api/gemini/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Gemini Live] Client connected to live audio socket');
    const ai = getGeminiClient();

    if (!ai) {
      clientWs.send(JSON.stringify({ error: 'Live API requires GEMINI_API_KEY' }));
      return;
    }

    try {
      // Connect to Gemini Live
      // @ts-ignore
      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          // @ts-ignore
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are PackWise Live Farmer Voice Assistant for Indian post-harvest agriculture (MoFPI). Be warm, simple, supportive, and speak in plain English or Telugu as the user prefers.'
        },
        callbacks: {
          onmessage: (message: any) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          }
        }
      });

      clientWs.on('message', (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' }
            });
          }
        } catch (e) {
          console.error('[Gemini Live] Error parsing client message:', e);
        }
      });

      clientWs.on('close', () => {
        try {
          session.close();
        } catch {}
      });
    } catch (err: any) {
      console.warn('[Gemini Live] Connection error:', err.message);
      clientWs.send(JSON.stringify({ error: err.message }));
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`PackWise AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PackWise server:', err);
  process.exit(1);
});
