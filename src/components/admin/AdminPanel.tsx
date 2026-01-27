/**
 * Admin Panel - Manage invite codes and access requests
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { cn } from '../ui/cn';

const API_URL = import.meta.env.PUBLIC_API_URL || 'https://api.gemmology.dev';

interface AccessRequest {
  id: string;
  email: string;
  reason: string;
  submitted: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface InviteCode {
  code: string;
  created: number;
  uses: number;
  maxUses: number | null;
  label: string;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminPanel() {
  // Auth state
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Data state
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate code form
  const [newCodeLabel, setNewCodeLabel] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState<string>('');
  const [generateLoading, setGenerateLoading] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Get stored password
  const getStoredPassword = () => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('admin_password') || '';
  };

  // Store password
  const storePassword = (pwd: string) => {
    sessionStorage.setItem('admin_password', pwd);
  };

  // API helper with auth
  const apiCall = useCallback(async (path: string, options: RequestInit = {}) => {
    const pwd = getStoredPassword();
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pwd}`,
        ...options.headers,
      },
    });
    return response;
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [reqRes, codesRes] = await Promise.all([
        apiCall('/api/admin/requests'),
        apiCall('/api/admin/codes'),
      ]);

      if (!reqRes.ok || !codesRes.ok) {
        throw new Error('Failed to load data');
      }

      const reqData = await reqRes.json();
      const codesData = await codesRes.json();

      setRequests(reqData.requests || []);
      setCodes(codesData.codes || []);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Check auth on mount
  useEffect(() => {
    const storedPwd = getStoredPassword();
    if (storedPwd) {
      setIsAuthenticated(true);
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Handle login
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      // Test password by making an API call
      const response = await fetch(`${API_URL}/api/admin/requests`, {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });

      if (response.ok) {
        storePassword(password);
        setIsAuthenticated(true);
      } else {
        setAuthError('Invalid password');
      }
    } catch {
      setAuthError('Failed to authenticate');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('admin_password');
    setIsAuthenticated(false);
    setPassword('');
  };

  // Approve request
  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await apiCall(`/api/admin/requests/${id}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Show the generated code
        setCopiedCode(data.code);
        navigator.clipboard.writeText(data.code);
        // Reload data
        loadData();
      }
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject request
  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await apiCall(`/api/admin/requests/${id}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Revoke code
  const handleRevoke = async (code: string) => {
    setActionLoading(code);
    try {
      const response = await apiCall(`/api/admin/codes/${code}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Revoke error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Generate new code
  const handleGenerateCode = async (e: FormEvent) => {
    e.preventDefault();
    setGenerateLoading(true);

    try {
      const response = await apiCall('/api/admin/codes', {
        method: 'POST',
        body: JSON.stringify({
          label: newCodeLabel || 'Manual code',
          maxUses: newCodeMaxUses ? parseInt(newCodeMaxUses, 10) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCopiedCode(data.code);
        navigator.clipboard.writeText(data.code);
        setNewCodeLabel('');
        setNewCodeMaxUses('');
        loadData();
      }
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setGenerateLoading(false);
    }
  };

  // Copy code to clipboard
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Render login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border',
                    'focus:outline-none focus:ring-2 focus:ring-crystal-500 focus:border-transparent',
                    authError ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  )}
                  autoFocus
                />
                {authError && (
                  <p className="mt-2 text-sm text-red-600">{authError}</p>
                )}
              </div>
              <Button type="submit" className="w-full" loading={authLoading}>
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render admin panel
  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {copiedCode && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            Code copied to clipboard: <span className="font-mono font-bold">{copiedCode}</span>
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="requests">
            Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="codes">Codes ({codes.length})</TabsTrigger>
          <TabsTrigger value="generate">Generate Code</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading...</div>
              ) : pendingRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No pending requests</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{request.email}</p>
                          <p className="text-sm text-slate-600 mt-1">{request.reason}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            Submitted: {formatDate(request.submitted)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            loading={actionLoading === request.id}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReject(request.id)}
                            disabled={actionLoading === request.id}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="codes">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading...</div>
              ) : codes.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No codes yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                          Code
                        </th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                          Label
                        </th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                          Uses
                        </th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                          Created
                        </th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {codes.map((code) => (
                        <tr key={code.code} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => copyCode(code.code)}
                              className="font-mono text-sm text-slate-900 hover:text-crystal-600"
                              title="Click to copy"
                            >
                              {code.code}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{code.label}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {code.uses}
                            {code.maxUses !== null && ` / ${code.maxUses}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {formatDate(code.created)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRevoke(code.code)}
                              loading={actionLoading === code.code}
                            >
                              Revoke
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Generate New Code</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateCode} className="space-y-4">
                <div>
                  <label htmlFor="code-label" className="block text-sm font-medium text-slate-700 mb-1">
                    Label (optional)
                  </label>
                  <input
                    id="code-label"
                    type="text"
                    value={newCodeLabel}
                    onChange={(e) => setNewCodeLabel(e.target.value)}
                    placeholder="e.g., FGA Student, Beta Tester"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="code-max-uses" className="block text-sm font-medium text-slate-700 mb-1">
                    Max Uses (optional)
                  </label>
                  <input
                    id="code-max-uses"
                    type="number"
                    min="1"
                    value={newCodeMaxUses}
                    onChange={(e) => setNewCodeMaxUses(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-crystal-500 focus:border-transparent"
                  />
                </div>
                <Button type="submit" className="w-full" loading={generateLoading}>
                  Generate Code
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
