import React, { useState } from 'react';
import { PackageCheck, Sparkles, Info, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenAbout: () => void;
  onRunDemo: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAbout, onRunDemo, onOpenAuth }) => {
  const { user, isAuthenticated, logout, openLoginModal } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  // Initial for avatar
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 shrink-0">
            <PackageCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900">
                PackWise AI
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 hidden xs:inline-block">
                MoFPI • SIH26236
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-normal leading-none hidden md:block">
              Intelligent Food Packaging Recommendation System
            </p>
          </div>
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Demo Button */}
          <button
            onClick={onRunDemo}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition-colors border border-emerald-200 cursor-pointer"
            title="Load Tomato Demo with active respiration"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">Try</span> Demo
          </button>

          {/* User Auth Profile / Login */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 bg-slate-50/80 cursor-pointer"
                title={`${user.name} (${user.role})`}
              >
                <div
                  className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${
                    user.avatarColor || 'from-emerald-500 to-teal-600'
                  } text-white flex items-center justify-center text-[11px] font-bold`}
                >
                  {initial}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-none pr-1">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-24">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-emerald-700 font-medium">
                    {user.role.split('/')[0].trim()}
                  </span>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 text-xs animate-in fade-in duration-150">
                  <div className="p-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {user.role}
                    </span>
                    {user.organization && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate">
                        {user.organization}
                      </p>
                    )}
                  </div>

                  {onOpenAuth && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenAuth();
                      }}
                      className="w-full mt-1.5 p-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Account & Permissions</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full mt-1 p-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openLoginModal()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* About Dialog Button */}
          <button
            onClick={onOpenAbout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="About SIH26236 & MoFPI"
            aria-label="About system"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
