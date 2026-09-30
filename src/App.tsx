import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { AnalyzeTab } from './components/AnalyzeTab';
import { RecommendationsTab } from './components/RecommendationsTab';
import { HistoryTab } from './components/HistoryTab';
import { WmsLogisticsTab } from './components/WmsLogisticsTab';
import { FarmerPostHarvestTab } from './components/farmer/FarmerPostHarvestTab';
import { RestaurantUploadTab } from './components/RestaurantUploadTab';
import { AuthTab } from './components/AuthTab';
import { LoginModal } from './components/LoginModal';
import { AboutModal } from './components/AboutModal';
import { useAuth } from './context/AuthContext';
import { CommodityInput, AnalysisResult, HistoryRecord } from './types/packaging';
import { PRESET_COMMODITIES } from './data/presetCommodities';
import { calculateAnalysisResult } from './engine/recommendationEngine';
import {
  fetchHistoryRecords,
  saveHistoryRecord,
  deleteHistoryRecord,
  clearAllHistory
} from './services/historyService';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const { isAuthenticated, openLoginModal } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Default initial commodity input (Tomato preset)
  const defaultTomato = PRESET_COMMODITIES[0].defaultValues;
  const [commodityInput, setCommodityInput] = useState<CommodityInput>({ ...defaultTomato });

  // Current analysis result
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [isCurrentResultSaved, setIsCurrentResultSaved] = useState<boolean>(false);

  // History list
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);

  // Load history records on mount
  useEffect(() => {
    let isMounted = true;
    fetchHistoryRecords().then((records) => {
      if (isMounted) {
        setHistoryRecords(records);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Toast auto-clear
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Run Demo (Tomato: high respiration, chilled, 15 days)
  const handleRunDemo = () => {
    const demoInput: CommodityInput = {
      commodityType: 'Tomato',
      moisture: 94,
      oilFat: 0.2,
      pH: 4.3,
      respirationRate: 'High',
      targetShelfLifeDays: 15,
      storageTemperature: 4,
      relativeHumidity: 90,
      storageType: 'Chilled',
      transportationCondition: 'Refrigerated',
      transportationDurationDays: 3,
      isFreshProduce: true
    };

    setCommodityInput(demoInput);
    const result = calculateAnalysisResult(demoInput);
    setCurrentResult(result);
    setIsCurrentResultSaved(false);
    setCurrentTab('recommendations');
    showToast('Loaded SIH Demo: Fresh Tomato (High Respiration • 4°C Chilled)');
  };

  // Select preset from Home
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_COMMODITIES.find((p) => p.id === presetId);
    if (preset) {
      setCommodityInput({ ...preset.defaultValues });
    }
    setCurrentTab('analyze');
  };

  // Perform Analysis
  const handleAnalyze = (input: CommodityInput) => {
    const result = calculateAnalysisResult(input);
    setCurrentResult(result);
    setIsCurrentResultSaved(false);
    setCurrentTab('recommendations');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Analysis to History
  const handleSaveHistory = async (result: AnalysisResult) => {
    if (!isAuthenticated) {
      openLoginModal(() => {
        handleSaveHistory(result);
      });
      return;
    }
    try {
      const record = await saveHistoryRecord(result);
      setHistoryRecords((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);
      setIsCurrentResultSaved(true);
      showToast('Analysis saved to history!');
    } catch {
      showToast('Failed to save analysis.');
    }
  };

  // Delete single history item
  const handleDeleteHistory = async (id: string) => {
    await deleteHistoryRecord(id);
    setHistoryRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('Record deleted.');
  };

  // Clear all history
  const handleClearHistory = async () => {
    await clearAllHistory();
    setHistoryRecords([]);
    showToast('History cleared.');
  };

  // Open history record in Recommendations
  const handleOpenHistoryItem = (record: HistoryRecord) => {
    setCurrentResult(record.result);
    setCommodityInput(record.result.input);
    setIsCurrentResultSaved(true);
    setCurrentTab('recommendations');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Apply Restaurant Upload Analysis to Engine
  const handleApplyRestaurantDish = (commodity: CommodityInput) => {
    setCommodityInput(commodity);
    const result = calculateAnalysisResult(commodity);
    setCurrentResult(result);
    setIsCurrentResultSaved(false);
    setCurrentTab('recommendations');
    showToast(`Loaded ${commodity.customName || 'Dish'} into FoodPack Engine`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased">
      {/* Top App Header */}
      <Header
        onOpenAbout={() => setIsAboutOpen(true)}
        onRunDemo={handleRunDemo}
        onOpenAuth={() => setCurrentTab('auth')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-3">
        {/* Toast Banner */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Router */}
        {currentTab === 'home' && (
          <HomeTab
            onStartAnalysis={() => setCurrentTab('analyze')}
            onSelectPreset={handleSelectPreset}
            onViewHistoryItem={handleOpenHistoryItem}
            onGoToLogistics={() => setCurrentTab('logistics')}
            onGoToFarmer={() => setCurrentTab('farmer')}
            onGoToRestaurant={() => setCurrentTab('restaurant')}
            recentHistory={historyRecords}
          />
        )}

        {currentTab === 'farmer' && (
          <FarmerPostHarvestTab
            onSaveToHistory={handleSaveHistory}
          />
        )}

        {currentTab === 'restaurant' && (
          <RestaurantUploadTab
            onApplyToEngine={handleApplyRestaurantDish}
            onGoToAnalyze={() => setCurrentTab('analyze')}
          />
        )}

        {currentTab === 'analyze' && (
          <AnalyzeTab
            currentInput={commodityInput}
            onChangeInput={setCommodityInput}
            onAnalyze={handleAnalyze}
            onLoadDemo={handleRunDemo}
          />
        )}

        {currentTab === 'recommendations' && (
          <>
            {currentResult ? (
              <RecommendationsTab
                result={currentResult}
                onReAnalyze={() => setCurrentTab('analyze')}
                onSaveHistory={handleSaveHistory}
                isSaved={isCurrentResultSaved}
              />
            ) : (
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">No Active Analysis</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Please enter food parameters in the Analyze tab or launch the SIH demo.
                </p>
                <button
                  onClick={() => setCurrentTab('analyze')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  Go to Analyzer
                </button>
              </div>
            )}
          </>
        )}

        {currentTab === 'logistics' && (
          <WmsLogisticsTab />
        )}

        {currentTab === 'history' && (
          <HistoryTab
            historyRecords={historyRecords}
            onSelectRecord={handleOpenHistoryItem}
            onDeleteRecord={handleDeleteHistory}
            onClearAll={handleClearHistory}
            onGoToAnalyze={() => setCurrentTab('analyze')}
          />
        )}

        {currentTab === 'auth' && (
          <AuthTab onSuccess={() => setCurrentTab('home')} />
        )}
      </main>

      {/* Auth Login & Register Modal */}
      <LoginModal />

      {/* Mobile-First Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hasResult={Boolean(currentResult)}
        historyCount={historyRecords.length}
      />

      {/* About SIH26236 Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
