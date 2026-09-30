import React, { useState } from 'react';
import { useAuth, DEMO_PROFILES } from '../context/AuthContext';
import { UserRole } from '../types/packaging';
import {
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  Building,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User,
  FlaskConical,
  Boxes,
  Briefcase
} from 'lucide-react';

interface AuthTabProps {
  onSuccess?: () => void;
}

export const AuthTab: React.FC<AuthTabProps> = ({ onSuccess }) => {
  const { user, isAuthenticated, login, signup, logout, quickLoginAsDemo } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>('rajesh.fpo@kisanorganic.org');
  const [loginPassword, setLoginPassword] = useState<string>('password123');

  // Signup form state
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupRole, setSignupRole] = useState<UserRole>('Food Producer / MSME');
  const [signupOrg, setSignupOrg] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      } else {
        setSuccessMessage('Logged in successfully!');
        if (onSuccess) onSuccess();
      }
    } catch {
      setErrorMessage('Unexpected server error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await signup(signupName, signupEmail, signupPassword, signupRole, signupOrg);
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed.');
      } else {
        setSuccessMessage('Account created and verified successfully!');
        if (onSuccess) onSuccess();
      }
    } catch {
      setErrorMessage('Unexpected server error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already logged in, show user profile & session dashboard
  if (isAuthenticated && user) {
    return (
      <div className="pb-24 pt-1 max-w-xl mx-auto space-y-5 animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          {/* User Header */}
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${
                user.avatarColor || 'from-emerald-500 to-teal-600'
              } text-white flex items-center justify-center text-2xl font-black shadow-md shadow-emerald-600/20`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{user.name}</h1>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active Session
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50/80 px-2.5 py-0.5 rounded-md border border-emerald-200/60 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Organization / Affiliation
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{user.organization || 'Food Processing Enterprise'}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Security & JWT Token
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">HMAC-SHA256 • Persistent</span>
              </p>
            </div>
          </div>

          {/* Role Entitlements */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs space-y-2">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Role Entitlements & Permissions
            </span>
            <ul className="text-emerald-800 space-y-1 pl-1 list-disc list-inside">
              <li>Save & export unlimited packaging analysis evaluations to cloud and local history</li>
              <li>Direct interactive consultations with PackWise Assistant powered by Gemini AI</li>
              <li>WMS item-to-box mathematical bin optimization and volumetric calculations</li>
              <li>Full biochemical parameter estimation for custom food commodities</li>
            </ul>
          </div>

          {/* Logout Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Manage or switch accounts for testing</p>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Quick Switch Profiles */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-800 block">Switch to Another Demo Role</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEMO_PROFILES.map((demo, idx) => (
              <button
                key={idx}
                onClick={() => quickLoginAsDemo(idx)}
                className="p-3 text-left rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer group"
              >
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 truncate">
                  {demo.name}
                </p>
                <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{demo.role}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-1 max-w-xl mx-auto space-y-5 animate-in fade-in duration-150">
      {/* Auth Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">PackWise AI Authentication</h1>
              <p className="text-xs text-emerald-100 font-medium">
                MoFPI SIH26236 • Secure FoodTech Research & Industry Portal
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-black/20 p-1 rounded-xl">
            <button
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Register Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to PackWise AI'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Dr. Priya Sharma"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="priya@cftri.res.in"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  User Role Selection
                </label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as UserRole)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium text-slate-900 cursor-pointer"
                >
                  <option value="Food Producer / MSME">Food Producer / MSME (FPO, Agri-processing)</option>
                  <option value="Packaging Material Supplier">Packaging Material Supplier (Barrier Films, Bio-polymers)</option>
                  <option value="Food Tech Researcher">Food Tech Researcher (CSIR, CFTRI, Academic)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / Institute Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={signupOrg}
                    onChange={(e) => setSignupOrg(e.target.value)}
                    placeholder="e.g. Kisan Agro FPO / Indian Institute of Packaging"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Create Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 5 characters"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Creating Account...' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Login Cards */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-bold text-slate-800">
                Quick Demonstration Accounts (1-Click)
              </span>
            </div>
            <div className="space-y-1.5">
              {DEMO_PROFILES.map((profile, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    quickLoginAsDemo(idx);
                    if (onSuccess) onSuccess();
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${profile.avatarColor} text-white flex items-center justify-center text-xs font-bold`}
                    >
                      {profile.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                        {profile.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {profile.role} • {profile.organization.split('(')[0]}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Use Login
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
