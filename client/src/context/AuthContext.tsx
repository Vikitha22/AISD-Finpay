import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, Wallet, WalletTier } from '../types.js';
import { api } from '../services/api.js';

interface AuthContextType {
  student: Student | null;
  wallet: Wallet | null;
  isLoading: boolean;
  registerUser: (data: {
    full_name: string;
    email: string;
    password: string;
    tier: WalletTier;
    student_id?: string;
    initial_balance_paise?: number;
  }) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  loginAsDemo: (email: string) => Promise<void>;
  refreshWallet: () => Promise<void>;
  updateTier: (tier: WalletTier) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PERSONAS = [
  {
    name: 'Rahul Sharma',
    email: 'rahul@campus.edu',
    srn: 'PES1UG20CS001',
    tier: 'BASIC' as WalletTier,
    color: 'from-blue-600 to-indigo-700',
    badge: '1.0× Rates & Caps'
  },
  {
    name: 'Priya Patel',
    email: 'priya@campus.edu',
    srn: 'PES1UG20CS042',
    tier: 'PRIME' as WalletTier,
    color: 'from-amber-600 to-orange-700',
    badge: '1.5× Rates & Caps'
  },
  {
    name: 'Vikram Malhotra',
    email: 'vikram@campus.edu',
    srn: 'PES1UG20CS099',
    tier: 'PREMIUM' as WalletTier,
    color: 'from-emerald-600 to-teal-800',
    badge: '2.0× Rates & Caps'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWallet = async () => {
    try {
      const updated = await api.getWallet();
      setWallet(updated);
    } catch (err) {
      console.error('Failed to refresh wallet:', err);
    }
  };

  const registerUser = async (data: {
    full_name: string;
    email: string;
    password: string;
    tier: WalletTier;
    student_id?: string;
    initial_balance_paise?: number;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setStudent(res.student);
      setWallet(res.wallet);
    } finally {
      setIsLoading(false);
    }
  };

  const loginUser = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setStudent(res.student);
      setWallet(res.wallet);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (email: string) => {
    setIsLoading(true);
    try {
      await api.seedDemo();
      const res = await api.login(email, 'Password123!');
      setStudent(res.student);
      setWallet(res.wallet);
    } catch (err) {
      console.error('Demo login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTier = async (newTier: WalletTier) => {
    try {
      const updated = await api.upgradeTier(newTier);
      setWallet(updated);
    } catch (err) {
      console.error('Failed to update tier:', err);
      throw err;
    }
  };

  const logout = () => {
    api.logout();
    setStudent(null);
    setWallet(null);
  };

  useEffect(() => {
    async function initSession() {
      setIsLoading(true);
      const token = localStorage.getItem('finpay_token');
      if (token) {
        try {
          const res = await api.getMe();
          setStudent(res.student);
          setWallet(res.wallet);
        } catch {
          api.logout();
          setStudent(null);
          setWallet(null);
        }
      }
      setIsLoading(false);
    }
    initSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        student,
        wallet,
        isLoading,
        registerUser,
        loginUser,
        loginAsDemo,
        refreshWallet,
        updateTier,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
