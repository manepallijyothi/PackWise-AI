import React, { useState } from 'react';
import { HistoryRecord } from '../types/packaging';
import { useAuth, DEMO_PROFILES } from '../context/AuthContext';
import {
  History,
  Trash2,
  ExternalLink,
  Calendar,
  Thermometer,
  Layers,
  Search,
  Sparkles,
  Lock,
  ShieldCheck,
  LogIn
} from 'lucide-react';

interface HistoryTabProps {
  historyRecords: HistoryRecord[];
  onSelectRecord: (record: HistoryRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onGoToAnalyze: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  historyRecords,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
  onGoToAnalyze
}) => {
  const { isAuthenticated, openLoginModal, quickLoginAsDemo, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isAuthenticated) {
    return (
      <div className="pb-24 pt-4 max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
              Authentication Required
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Historical Records are Protected
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Historical packaging records, WVTR/OTR barrier audits, and past recommendations are tied to verified user accounts for compliance and traceability.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <button
              onClick={() => openLoginModal()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Access History</span>
            </button>
            <button
              onClick={() => quickLoginAsDemo(0)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Demo Login (Rajesh - MSME)</span>
            </button>
          </div>

          {/* Quick Demo Selector */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Or Sign In with Demo Roles
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
              {DEMO_PROFILES.map((profile, idx) => (
                <button
                  key={idx}
                  onClick={() => quickLoginAsDemo(idx)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                    {profile.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{profile.role}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredRecords = historyRecords.filter((rec) => {
    const term = searchTerm.toLowerCase();
    return (
      rec.commodityName.toLowerCase().includes(term) ||
      rec.recommendedMaterial.toLowerCase().includes(term) ||
      rec.storageType.toLowerCase().includes(term)
    );
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '29 Sep 2026';
    }
  };

  return (
    <div className="pb-24 pt-1 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Analysis History</h1>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {user?.role.split('/')[0].trim()}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {historyRecords.length} saved packaging recommendations (persisted locally & on backend)
          </p>
        </div>


        {historyRecords.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Clear all saved analysis records?')) {
                onClearAll();
              }
            }}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Search Filter */}
      {historyRecords.length > 3 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by commodity, material, or storage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      )}

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Analysis Records Yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Run a packaging analysis for any food commodity to save recommendations here.
            </p>
          </div>
          <button
            onClick={onGoToAnalyze}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
          >
            Analyze Commodity
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredRecords.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group relative"
            >
              <div
                onClick={() => onSelectRecord(item)}
                className="cursor-pointer space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {item.commodityName}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Top Match:{' '}
                      <span className="font-semibold text-emerald-800">
                        {item.recommendedMaterial}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{item.compatibility}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{item.shelfLifeDays} days target</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-slate-400" />
                    <span>
                      {item.storageType} ({item.temperature}°C)
                    </span>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-50">
                <button
                  onClick={() => onSelectRecord(item)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors"
                >
                  <span>Open Result</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRecord(item.id);
                  }}
                  className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                  title="Delete record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
