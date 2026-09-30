import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthState } from '../types/packaging';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    organization?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: (onSuccessCallback?: () => void) => void;
  closeLoginModal: () => void;
  quickLoginAsDemo: (demoIndex: number) => void;
}

const AUTH_STORAGE_TOKEN_KEY = 'packwise_auth_jwt_token';
const AUTH_STORAGE_USER_KEY = 'packwise_auth_user_profile';

export const DEMO_PROFILES: Array<{
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  avatarColor: string;
}> = [
  {
    name: 'Rajesh Patel',
    email: 'rajesh.fpo@kisanorganic.org',
    role: 'Food Producer / MSME',
    organization: 'Kisan Krishi Farmer Producer Org (FPO)',
    avatarColor: 'from-emerald-500 to-teal-600'
  },
  {
    name: 'Arun Mehra',
    email: 'arun.pack@ecobiofilms.in',
    role: 'Packaging Material Supplier',
    organization: 'EcoPolymer Sustainable Barrier Films Ltd.',
    avatarColor: 'from-blue-500 to-indigo-600'
  },
  {
    name: 'Dr. Gayatri Swaminathan',
    email: 'dr.swami@cftri.res.in',
    role: 'Food Tech Researcher',
    organization: 'CSIR - Central Food Technological Research Institute (CFTRI)',
    avatarColor: 'from-purple-500 to-pink-600'
  }
];

function generateSimulatedJWT(user: User): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      org: user.organization || '',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7
    })
  );
  const signature = btoa('packwise_enterprise_secret_signature');
  return `${header}.${payload}.${signature}`;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // Initialize session from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(AUTH_STORAGE_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_STORAGE_USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openLoginModal = (onSuccessCallback?: () => void) => {
    if (onSuccessCallback) {
      setPendingCallback(() => onSuccessCallback);
    } else {
      setPendingCallback(null);
    }
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setPendingCallback(null);
  };

  const login = async (
    email: string,
    password: string,
    role?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return { success: false, error: 'Email and password are required.' };
    }
    if (password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    // Check if matches demo or custom
    const matchedDemo = DEMO_PROFILES.find((d) => d.email.toLowerCase() === trimmedEmail);
    const chosenRole: UserRole = role || matchedDemo?.role || 'Food Producer / MSME';
    const chosenName = matchedDemo?.name || trimmedEmail.split('@')[0].replace('.', ' ');
    const chosenOrg = matchedDemo?.organization || 'Food Processing Enterprise';
    const chosenAvatar = matchedDemo?.avatarColor || 'from-emerald-500 to-teal-600';

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: chosenName.charAt(0).toUpperCase() + chosenName.slice(1),
      email: trimmedEmail,
      role: chosenRole,
      organization: chosenOrg,
      avatarColor: chosenAvatar,
      createdAt: new Date().toISOString()
    };

    const simulatedToken = generateSimulatedJWT(newUser);

    try {
      localStorage.setItem(AUTH_STORAGE_TOKEN_KEY, simulatedToken);
      localStorage.setItem(AUTH_STORAGE_USER_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.warn('Storage error saving auth token:', e);
    }

    setUser(newUser);
    setToken(simulatedToken);
    setIsLoginModalOpen(false);

    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }

    return { success: true };
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    organization?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      return { success: false, error: 'All fields are required.' };
    }
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid work email.' };
    }
    if (password.length < 5) {
      return { success: false, error: 'Password must be at least 5 characters.' };
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      role,
      organization: organization?.trim() || 'Independent FoodTech Enterprise',
      avatarColor:
        role === 'Packaging Material Supplier'
          ? 'from-blue-500 to-indigo-600'
          : role === 'Food Tech Researcher'
          ? 'from-purple-500 to-pink-600'
          : 'from-emerald-500 to-teal-600',
      createdAt: new Date().toISOString()
    };

    const simulatedToken = generateSimulatedJWT(newUser);

    try {
      localStorage.setItem(AUTH_STORAGE_TOKEN_KEY, simulatedToken);
      localStorage.setItem(AUTH_STORAGE_USER_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.warn('Storage error saving auth token:', e);
    }

    setUser(newUser);
    setToken(simulatedToken);
    setIsLoginModalOpen(false);

    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }

    return { success: true };
  };

  const quickLoginAsDemo = (demoIndex: number) => {
    const profile = DEMO_PROFILES[demoIndex] || DEMO_PROFILES[0];
    login(profile.email, 'password123', profile.role);
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_TOKEN_KEY);
      localStorage.removeItem(AUTH_STORAGE_USER_KEY);
    } catch (e) {
      console.warn('Storage removal error:', e);
    }
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        quickLoginAsDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
