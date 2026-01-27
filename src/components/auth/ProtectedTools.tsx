/**
 * Protected Tools Hub - Wraps Tools hub with LockGate
 */

import { LockGate } from './LockGate';
import { Container } from '../ui/Container';
import { Card, CardTitle, CardDescription } from '../ui/Card';
import { IconBox } from '../ui/IconBox';

const tools = [
  {
    title: 'Calculators',
    description: 'Specific gravity, birefringence, critical angle, and unit conversions for gemmologists.',
    href: '/tools/calculator',
    icon: 'calculator',
    variant: 'emerald' as const,
  },
];

const iconPaths: Record<string, string> = {
  calculator: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
};

export function ProtectedTools() {
  return (
    <LockGate>
      <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen py-12">
        <Container size="xl" padding="md">
          {/* Header */}
          <div className="max-w-3xl pb-8 border-b border-slate-200">
            <h1 className="text-4xl font-bold text-slate-900">Tools</h1>
            <p className="mt-4 text-lg text-slate-600">
              Professional gemmological tools for calculations, conversions, and reference.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <a key={tool.title} href={tool.href} className="group">
                <Card hover padding="lg" className="h-full">
                  <div className="flex items-start gap-4">
                    <IconBox variant={tool.variant} size="md" className="shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[tool.icon]} />
                      </svg>
                    </IconBox>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg group-hover:text-crystal-600 transition-colors">
                        {tool.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {tool.description}
                      </CardDescription>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>

          {/* Coming Soon */}
          <div className="mt-12 p-6 rounded-xl border border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">More Tools Coming Soon</h2>
            <p className="text-slate-600">
              We're working on additional tools including:
            </p>
            <ul className="mt-3 space-y-1 text-slate-600">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-crystal-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Fluorescence reference charts</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-crystal-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Absorption spectrum viewer</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-crystal-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Inclusions reference database</span>
              </li>
            </ul>
          </div>
        </Container>
      </div>
    </LockGate>
  );
}
