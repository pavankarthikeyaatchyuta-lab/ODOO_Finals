import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppRole = 'FOUNDER' | 'PLANNER' | 'COORDINATOR' | 'FINANCE' | 'VENDOR' | 'CLIENT' | 'FAMILY';
export type PortalType = 'AGENCY' | 'VENDOR' | 'CLIENT';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  name?: string;
  role: AppRole;
  active: boolean;
  avatarUrl?: string;
  assignedWeddingIds?: string[];
  vendorId?: string; // If role === 'VENDOR'
  vendorCategory?: string;
  clientId?: string; // If role === 'CLIENT' or 'FAMILY'
  isFamilyMember?: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  role: AppRole;
  portal: PortalType;
  activePortal: PortalType;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, presentationPortal?: PortalType) => Promise<boolean>;
  logout: () => void;
  switchPortal: (portal: PortalType) => void;
  switchRole: (role: AppRole) => void;
}

// Pre-seeded demo user profiles for official role testing
export const DEMO_PROFILES: Record<AppRole, AuthUser> = {
  FOUNDER: {
    id: 'usr-founder-001',
    email: 'founder@theroyalknot.com',
    displayName: 'Devendra Kaviraj',
    name: 'Devendra Kaviraj',
    role: 'FOUNDER',
    active: true,
    assignedWeddingIds: ['wed-001', 'wed-002', 'wed-003', 'wed-004', 'wed-005']
  },
  PLANNER: {
    id: 'usr-planner-002',
    email: 'planner@theroyalknot.com',
    displayName: 'Priya Mehra',
    name: 'Priya Mehra',
    role: 'PLANNER',
    active: true,
    assignedWeddingIds: ['wed-001', 'wed-002']
  },
  COORDINATOR: {
    id: 'usr-coord-003',
    email: 'coordinator@theroyalknot.com',
    displayName: 'Siddharth Jain',
    name: 'Siddharth Jain',
    role: 'COORDINATOR',
    active: true,
    assignedWeddingIds: ['wed-001']
  },
  FINANCE: {
    id: 'usr-fin-004',
    email: 'finance@theroyalknot.com',
    displayName: 'Rameshwar Vyas',
    name: 'Rameshwar Vyas',
    role: 'FINANCE',
    active: true,
    assignedWeddingIds: ['wed-001', 'wed-002']
  },
  VENDOR: {
    id: 'usr-vendor-005',
    email: 'catering@spiceheaven.com',
    displayName: 'Chef Vikramaditya',
    name: 'Chef Vikramaditya',
    vendorCategory: 'Catering & Hospitality',
    role: 'VENDOR',
    active: true,
    vendorId: 'vendor-c1',
    assignedWeddingIds: ['wed-001']
  },
  CLIENT: {
    id: 'usr-client-006',
    email: 'rahul.singh@royalwedding.com',
    displayName: 'Rahul Sharma & Ananya Singh',
    name: 'Rahul Sharma & Ananya Singh',
    role: 'CLIENT',
    active: true,
    clientId: 'cli-001',
    assignedWeddingIds: ['wed-001']
  },
  FAMILY: {
    id: 'usr-family-007',
    email: 'vikram.singh@royalwedding.com',
    displayName: 'Mr. Vikram Singh (Father of Bride)',
    name: 'Mr. Vikram Singh (Father of Bride)',
    role: 'FAMILY',
    active: true,
    isFamilyMember: true,
    clientId: 'cli-001',
    assignedWeddingIds: ['wed-001']
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('TRK_AUTH_USER');
      return stored ? JSON.parse(stored) : DEMO_PROFILES.FOUNDER;
    } catch {
      return DEMO_PROFILES.FOUNDER;
    }
  });

  const [portal, setPortal] = useState<PortalType>(() => {
    try {
      const stored = localStorage.getItem('TRK_PORTAL');
      return (stored as PortalType) || 'AGENCY';
    } catch {
      return 'AGENCY';
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('TRK_AUTH_TOKEN') || 'trk-demo-token-active';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync state to local storage for persistence across reloads
  useEffect(() => {
    if (user) {
      localStorage.setItem('TRK_AUTH_USER', JSON.stringify(user));
    } else {
      localStorage.removeItem('TRK_AUTH_USER');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('TRK_PORTAL', portal);
  }, [portal]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('TRK_AUTH_TOKEN', token);
    } else {
      localStorage.removeItem('TRK_AUTH_TOKEN');
    }
  }, [token]);

  const login = async (
    email: string,
    _pass: string,
    presentationPortal?: PortalType
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Find matching demo user by email or fallback to role lookup
      const foundRole = (Object.keys(DEMO_PROFILES) as AppRole[]).find(
        r => DEMO_PROFILES[r].email.toLowerCase() === email.toLowerCase()
      );

      const resolvedProfile = foundRole ? DEMO_PROFILES[foundRole] : DEMO_PROFILES.FOUNDER;

      setUser(resolvedProfile);
      setToken(`trk-token-${Date.now()}`);

      // Auto-set the portal based on the resolved role or parameter
      if (presentationPortal) {
        setPortal(presentationPortal);
      } else if (resolvedProfile.role === 'VENDOR') {
        setPortal('VENDOR');
      } else if (resolvedProfile.role === 'CLIENT' || resolvedProfile.role === 'FAMILY') {
        setPortal('CLIENT');
      } else {
        setPortal('AGENCY');
      }

      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('TRK_AUTH_USER');
    localStorage.removeItem('TRK_AUTH_TOKEN');
  };

  const switchPortal = (newPortal: PortalType) => {
    setPortal(newPortal);
    if (newPortal === 'VENDOR') {
      setUser(DEMO_PROFILES.VENDOR);
    } else if (newPortal === 'CLIENT') {
      setUser(DEMO_PROFILES.CLIENT);
    } else {
      setUser(DEMO_PROFILES.FOUNDER);
    }
  };

  const switchRole = (newRole: AppRole) => {
    const profile = DEMO_PROFILES[newRole];
    if (profile) {
      setUser(profile);
      if (newRole === 'VENDOR') setPortal('VENDOR');
      else if (newRole === 'CLIENT' || newRole === 'FAMILY') setPortal('CLIENT');
      else setPortal('AGENCY');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'FOUNDER',
        portal,
        activePortal: portal,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchPortal,
        switchRole
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
