/**
 * LockGate Component - Protects page content with invite code authentication
 */

import { useState, type ReactNode, type FormEvent } from 'react';
import { useAuth } from './useAuth';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { cn } from '../ui/cn';

interface LockGateProps {
  children: ReactNode;
}

export function LockGate({ children }: LockGateProps) {
  const { isAuthenticated, isLoading, verifyCode, requestAccess } = useAuth();

  // Code entry state
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);

  // Request form state
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  // If authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Handle code submission
  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    setCodeLoading(true);

    const result = await verifyCode(code.trim());

    if (!result.success) {
      setCodeError(result.error || 'Invalid code');
    }
    setCodeLoading(false);
  };

  // Handle request submission
  const handleRequestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRequestError(null);
    setRequestLoading(true);

    const result = await requestAccess(email.trim(), reason.trim());

    if (result.success) {
      setRequestSuccess(true);
    } else {
      setRequestError(result.error || 'Failed to submit request');
    }
    setRequestLoading(false);
  };

  // Render lock overlay
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-white">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-crystal-100 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-crystal-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            This feature is still under development. Access is limited to early testers while we work on finishing it.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="code" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="code" className="flex-1">
                I have a code
              </TabsTrigger>
              <TabsTrigger value="request" className="flex-1">
                Request access
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code">
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <label htmlFor="invite-code" className="block text-sm font-medium text-slate-700 mb-1">
                    Invite Code
                  </label>
                  <input
                    id="invite-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="GEMSTONE-XXXX-XXXX"
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border text-center font-mono tracking-wider',
                      'focus:outline-none focus:ring-2 focus:ring-crystal-500 focus:border-transparent',
                      codeError ? 'border-red-300 bg-red-50' : 'border-slate-300'
                    )}
                    autoComplete="off"
                    autoFocus
                  />
                  {codeError && (
                    <p className="mt-2 text-sm text-red-600">{codeError}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  loading={codeLoading}
                  disabled={!code.trim()}
                >
                  Unlock
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="request">
              {requestSuccess ? (
                <div className="text-center py-4">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Request Submitted
                  </h3>
                  <p className="text-sm text-slate-600">
                    We'll review your request and send you an invite code by email.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border',
                        'focus:outline-none focus:ring-2 focus:ring-crystal-500 focus:border-transparent',
                        requestError ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      )}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">
                      Why do you want access?
                    </label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g., FGA student studying crystal morphology..."
                      rows={3}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border resize-none',
                        'focus:outline-none focus:ring-2 focus:ring-crystal-500 focus:border-transparent',
                        'border-slate-300'
                      )}
                      required
                      minLength={10}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Minimum 10 characters
                    </p>
                  </div>

                  {requestError && (
                    <p className="text-sm text-red-600">{requestError}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    loading={requestLoading}
                    disabled={!email.trim() || reason.trim().length < 10}
                  >
                    Submit Request
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
