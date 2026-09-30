import React, { useState } from 'react';
import {
  CommodityInput,
  RespirationRate,
  StorageType,
  TransportationCondition
} from '../types/packaging';
import { PRESET_COMMODITIES } from '../data/presetCommodities';
import { profileCustomCommodityAI } from '../services/geminiService';
import {
  Sparkles,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Bot,
  Loader2,
  CheckCircle2,
  Sliders,
  Thermometer,
  Truck,
  Calendar,
  Apple
} from 'lucide-react';

interface AnalyzeTabProps {
  currentInput: CommodityInput;
  onChangeInput: (newInput: CommodityInput) => void;
  onAnalyze: (input: CommodityInput) => void;
  onLoadDemo: () => void;
}

export const AnalyzeTab: React.FC<AnalyzeTabProps> = ({
  currentInput,
  onChangeInput,
  onAnalyze,
  onLoadDemo
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    const found = PRESET_COMMODITIES.find((p) => p.name.toLowerCase().includes(currentInput.commodityType.toLowerCase()));
    return found ? found.id : 'custom';
  });

  const [customNameInput, setCustomNameInput] = useState<string>(currentInput.customName || '');
  const [shelfLifeSelection, setShelfLifeSelection] = useState<string>(() => {
    const d = currentInput.targetShelfLifeDays;
    return [3, 7, 15, 30, 60].includes(d) ? String(d) : 'custom';
  });

  const [isProfilingAI, setIsProfilingAI] = useState<boolean>(false);
  const [aiProfilingNote, setAiProfilingNote] = useState<string | null>(null);

  // Field updates with validation
  const updateField = <K extends keyof CommodityInput>(key: K, value: CommodityInput[K]) => {
    onChangeInput({
      ...currentInput,
      [key]: value
    });
  };

  // Preset selection handler
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    setAiProfilingNote(null);

    if (presetId === 'custom') {
      onChangeInput({
        ...currentInput,
        commodityType: 'Custom Commodity',
        customName: customNameInput || 'Custom Food Item'
      });
    } else {
      const preset = PRESET_COMMODITIES.find((p) => p.id === presetId);
      if (preset) {
        setCustomNameInput('');
        const d = preset.defaultValues.targetShelfLifeDays;
        setShelfLifeSelection([3, 7, 15, 30, 60].includes(d) ? String(d) : 'custom');
        onChangeInput({ ...preset.defaultValues });
      }
    }
  };

  // AI Auto-Profile for custom commodities
  const handleAutoProfileAI = async () => {
    const query = customNameInput.trim() || 'Guava';
    setIsProfilingAI(true);
    setAiProfilingNote(null);

    try {
      const { profile, source } = await profileCustomCommodityAI(query);
      const days = profile.defaultShelfLifeDays;
      setShelfLifeSelection([3, 7, 15, 30, 60].includes(days) ? String(days) : 'custom');

      onChangeInput({
        ...currentInput,
        commodityType: 'Custom Commodity',
        customName: profile.name,
        moisture: profile.moisture,
        oilFat: profile.oilFat,
        pH: profile.pH,
        respirationRate: profile.respirationRate,
        targetShelfLifeDays: profile.defaultShelfLifeDays,
        isFreshProduce: profile.isFreshProduce,
        storageType: profile.recommendedStorageType,
        storageTemperature: profile.recommendedTemperature,
        relativeHumidity: profile.recommendedHumidity
      });

      setAiProfilingNote(
        `Gemini AI estimated: ${profile.moisture}% moisture, ${profile.oilFat}% fat, pH ${profile.pH}, ${profile.respirationRate} respiration (${source}).`
      );
    } catch {
      setAiProfilingNote('Could not auto-profile. Please enter values manually.');
    } finally {
      setIsProfilingAI(false);
    }
  };

  // Validation rules
  const validationErrors: string[] = [];
  if (currentInput.moisture < 0 || currentInput.moisture > 100 || isNaN(currentInput.moisture)) {
    validationErrors.push('Moisture content must be between 0% and 100%.');
  }
  if (currentInput.oilFat < 0 || currentInput.oilFat > 100 || isNaN(currentInput.oilFat)) {
    validationErrors.push('Oil/fat content must be between 0% and 100%.');
  }
  if (currentInput.pH < 0 || currentInput.pH > 14 || isNaN(currentInput.pH)) {
    validationErrors.push('pH level must be between 0.0 and 14.0.');
  }
  if (currentInput.relativeHumidity < 0 || currentInput.relativeHumidity > 100 || isNaN(currentInput.relativeHumidity)) {
    validationErrors.push('Relative humidity must be between 0% and 100%.');
  }
  if (currentInput.storageTemperature < -30 || currentInput.storageTemperature > 50 || isNaN(currentInput.storageTemperature)) {
    validationErrors.push('Storage temperature should be between -30°C and 50°C.');
  }
  if (currentInput.targetShelfLifeDays < 1 || isNaN(currentInput.targetShelfLifeDays)) {
    validationErrors.push('Desired shelf life must be at least 1 day.');
  }

  const isValid = validationErrors.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onAnalyze(currentInput);
  };

  return (
    <div className="pb-24 pt-1 max-w-xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Packaging Analyzer</h1>
          <p className="text-xs text-slate-500">Configure food parameters and environmental logistics</p>
        </div>
        <button
          type="button"
          onClick={onLoadDemo}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Demo Data</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SECTION 1: COMMODITY INFORMATION */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Apple className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Commodity Information
            </h2>
          </div>

          {/* Commodity Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Commodity Type
            </label>
            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              {PRESET_COMMODITIES.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.category})
                </option>
              ))}
              <option value="custom">-- Custom Commodity --</option>
            </select>
          </div>

          {/* Custom Commodity Name & AI Auto-Profile */}
          {selectedPresetId === 'custom' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Custom Food Item Name
                </label>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  AI Biochemical Estimation
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g., Guava, Paneer, Cashews, Roasted Coffee, Jackfruit..."
                value={customNameInput}
                onChange={(e) => {
                  setCustomNameInput(e.target.value);
                  updateField('customName', e.target.value);
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <button
                type="button"
                onClick={handleAutoProfileAI}
                disabled={isProfilingAI || !customNameInput.trim()}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                {isProfilingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Auto-Fetching Biochemical Profile with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Auto-Fetch Biochemical Profile with AI</span>
                  </>
                )}
              </button>

              {aiProfilingNote && (
                <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{aiProfilingNote}</span>
                </div>
              )}
            </div>
          )}

          {/* Fresh Horticultural Produce Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div>
              <span className="text-xs font-bold text-slate-800">Fresh Produce (Living Horticultural Crop)</span>
              <p className="text-[10px] text-slate-500 leading-tight">
                Continues postharvest respiration (absorbs O₂, releases CO₂ + moisture)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentInput.isFreshProduce}
                onChange={(e) => updateField('isFreshProduce', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* FOOD PROPERTIES INPUTS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Moisture Content */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Moisture</label>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {currentInput.moisture}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={currentInput.moisture}
                onChange={(e) => updateField('moisture', parseFloat(e.target.value) || 0)}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={currentInput.moisture}
                onChange={(e) => updateField('moisture', parseFloat(e.target.value) || 0)}
                className="mt-1.5 w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
              />
            </div>

            {/* Oil/Fat Content */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Oil / Fat</label>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  {currentInput.oilFat}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={currentInput.oilFat}
                onChange={(e) => updateField('oilFat', parseFloat(e.target.value) || 0)}
                className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={currentInput.oilFat}
                onChange={(e) => updateField('oilFat', parseFloat(e.target.value) || 0)}
                className="mt-1.5 w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
              />
            </div>

            {/* pH Value */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">pH Level</label>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  {currentInput.pH}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                step="0.1"
                value={currentInput.pH}
                onChange={(e) => updateField('pH', parseFloat(e.target.value) || 7)}
                className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <input
                type="number"
                min="1"
                max="14"
                step="0.1"
                value={currentInput.pH}
                onChange={(e) => updateField('pH', parseFloat(e.target.value) || 7)}
                className="mt-1.5 w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
              />
            </div>
          </div>

          {/* Respiration Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Respiration Rate (Kinetics)
              </label>
              <span className="text-[11px] text-slate-400">Gas exchange rate</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as RespirationRate[]).map((rate) => {
                const isSelected = currentInput.respirationRate === rate;
                return (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => updateField('respirationRate', rate)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {rate}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: TARGET REQUIREMENTS */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Target Shelf Life Requirements
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Desired Shelf Life
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[3, 7, 15, 30, 60].map((days) => {
                const isSelected = shelfLifeSelection === String(days);
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      setShelfLifeSelection(String(days));
                      updateField('targetShelfLifeDays', days);
                    }}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {days} Days
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShelfLifeSelection('custom')}
                className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all ${
                  shelfLifeSelection === 'custom'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Custom
              </button>
            </div>

            {shelfLifeSelection === 'custom' && (
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={currentInput.targetShelfLifeDays}
                  onChange={(e) => updateField('targetShelfLifeDays', parseInt(e.target.value) || 1)}
                  placeholder="Enter days"
                  className="w-32 text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-500">Days (1 – 365)</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: STORAGE CONDITIONS */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
              <Thermometer className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Storage Conditions
            </h2>
          </div>

          {/* Storage Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Storage Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Ambient', 'Chilled', 'Frozen'] as StorageType[]).map((type) => {
                const isSelected = currentInput.storageType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      updateField('storageType', type);
                      if (type === 'Frozen' && currentInput.storageTemperature > 0) {
                        updateField('storageTemperature', -18);
                        updateField('transportationCondition', 'Frozen/Cold Chain');
                      } else if (type === 'Chilled' && (currentInput.storageTemperature <= 0 || currentInput.storageTemperature > 10)) {
                        updateField('storageTemperature', 4);
                        updateField('transportationCondition', 'Refrigerated');
                      } else if (type === 'Ambient' && currentInput.storageTemperature < 15) {
                        updateField('storageTemperature', 22);
                        updateField('transportationCondition', 'Normal');
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperature & Humidity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Storage Temperature</label>
                <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {currentInput.storageTemperature}°C
                </span>
              </div>
              <input
                type="range"
                min="-25"
                max="45"
                step="1"
                value={currentInput.storageTemperature}
                onChange={(e) => updateField('storageTemperature', parseInt(e.target.value) || 0)}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {currentInput.storageTemperature <= 0 ? 'Sub-Zero (Frozen)' : currentInput.storageTemperature <= 8 ? 'Refrigerated Cold-Chain' : 'Ambient Temperature'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Relative Humidity</label>
                <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {currentInput.relativeHumidity}% RH
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={currentInput.relativeHumidity}
                onChange={(e) => updateField('relativeHumidity', parseInt(e.target.value) || 50)}
                className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {currentInput.relativeHumidity >= 85 ? 'High Humidity (Condensation risk)' : 'Standard Storage Humidity'}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4: TRANSPORTATION */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              4. Transportation Logistics
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['Normal', 'Refrigerated', 'Frozen/Cold Chain'] as TransportationCondition[]).map((cond) => {
              const isSelected = currentInput.transportationCondition === cond;
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() => updateField('transportationCondition', cond)}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cond}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="text-xs font-medium text-slate-600">
              Transportation Transit Duration (Optional)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="30"
                value={currentInput.transportationDurationDays || 2}
                onChange={(e) => updateField('transportationDurationDays', parseInt(e.target.value) || 0)}
                className="w-16 text-xs text-center font-bold bg-slate-50 border border-slate-300 rounded-lg py-1 text-slate-800"
              />
              <span className="text-xs text-slate-400">Days</span>
            </div>
          </div>
        </div>

        {/* REAL-TIME VALIDATION ALERTS */}
        {validationErrors.length > 0 && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Please resolve the following input issues:</span>
            </div>
            <ul className="text-xs list-disc list-inside space-y-0.5 pl-1">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ANALYZE SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isValid}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
          >
            <Sparkles className="w-5 h-5 text-emerald-200" />
            <span>Analyze Packaging</span>
          </button>
        </div>
      </form>
    </div>
  );
};
