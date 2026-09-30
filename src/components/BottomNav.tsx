import React from 'react';
import { Home, SlidersHorizontal, Sparkles, History, Box, Mic, Sprout, Utensils } from 'lucide-react';

export type NavTab = 'home' | 'farmer' | 'restaurant' | 'analyze' | 'recommendations' | 'logistics' | 'history' | 'auth';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hasResult: boolean;
  historyCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  hasResult,
  historyCount
}) => {
  const tabs = [
    {
      id: 'home' as NavTab,
      label: 'Home',
      icon: Home
    },
    {
      id: 'farmer' as NavTab,
      label: 'Farmer',
      icon: Sprout,
      badge: 'L1'
    },
    {
      id: 'restaurant' as NavTab,
      label: 'Restaurant',
      icon: Utensils
    },
    {
      id: 'analyze' as NavTab,
      label: 'Analyze',
      icon: SlidersHorizontal
    },
    {
      id: 'recommendations' as NavTab,
      label: 'Results',
      icon: Sparkles,
      hasDot: hasResult
    },
    {
      id: 'history' as NavTab,
      label: 'History',
      icon: History,
      badge: historyCount > 0 ? historyCount : undefined
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
      <div className="max-w-md mx-auto px-3 flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-150 ${
                isActive ? 'text-emerald-700 font-semibold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-emerald-600 stroke-[2.2]' : ''}`} />
                {tab.hasDot && !isActive && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-3 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 ${isActive ? 'text-emerald-800' : 'text-slate-500'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-8 h-1 rounded-full bg-emerald-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
