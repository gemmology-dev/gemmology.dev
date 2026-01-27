/**
 * Auth Hook - Session management for invite code system
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'gemmology_session';
const API_URL = import.meta.env.PUBLIC_API_URL || 'https://api.gemmology.dev';

interface SessionData {
  token: string;
  exp: number; // Expiration timestamp
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface VerifyResult {
  success: boolean;
  error?: string;
}

interface RequestResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Parse JWT payload without verifying signature (client-side only)
 */
function parseJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if a session is still valid (not expired)
 */
function isSessionValid(session: SessionData | null): boolean {
  if (!session) return false;
  // Add 1 minute buffer for clock skew
  return session.exp * 1000 > Date.now() + 60000;
}

/**
 * Get session from localStorage
 */
function getStoredSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Save session to localStorage
 */
function storeSession(token: string): void {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return;

  const session: SessionData = {
    token,
    exp: payload.exp,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/**
 * Clear session from localStorage
 */
function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Hook for managing authentication state
 */
export function useAuth(): AuthState & {
  verifyCode: (code: string) => Promise<VerifyResult>;
  requestAccess: (email: string, reason: string) => Promise<RequestResult>;
  logout: () => void;
} {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const session = getStoredSession();
    if (isSessionValid(session)) {
      setIsAuthenticated(true);
    } else if (session) {
      // Clear expired session
      clearSession();
    }
    setIsLoading(false);
  }, []);

  // Verify an invite code
  const verifyCode = useCallback(async (code: string): Promise<VerifyResult> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.valid && data.token) {
        storeSession(data.token);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: data.error || 'Invalid code' };
    } catch (error) {
      console.error('Verify code error:', error);
      return { success: false, error: 'Failed to verify code. Please try again.' };
    }
  }, []);

  // Request access
  const requestAccess = useCallback(async (email: string, reason: string): Promise<RequestResult> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason }),
      });

      const data = await response.json();

      if (data.submitted) {
        return { success: true, message: data.message };
      }

      return { success: false, error: data.error || 'Failed to submit request' };
    } catch (error) {
      console.error('Request access error:', error);
      return { success: false, error: 'Failed to submit request. Please try again.' };
    }
  }, []);

  // Logout (clear session)
  const logout = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    verifyCode,
    requestAccess,
    logout,
  };
}
