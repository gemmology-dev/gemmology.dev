/**
 * ToolsHub - landing page listing all gemmological tool categories.
 */

import { Container } from '../ui/Container';
import { Card, CardTitle, CardDescription } from '../ui/Card';
import { IconBox } from '../ui/IconBox';

const tools = [
  {
    title: 'Measurement & Calculation',
    description: 'SG, RI, birefringence, critical angle, dispersion, carat estimation, and density calculations.',
    href: '/tools/measurement',
    icon: 'calculator',
    variant: 'emerald' as const,
  },
  {
    title: 'Unit Conversions',
    description: 'Convert between carats, grams, millimeters, inches, Celsius, and Fahrenheit.',
    href: '/tools/conversions',
    icon: 'arrows',
    variant: 'sapphire' as const,
  },
  {
    title: 'Optical Properties',
    description: 'Dichroscope results, polariscope interpretation, refractometer simulator, and pleochroism reasoner.',
    href: '/tools/optical',
    icon: 'eye',
    variant: 'amethyst' as const,
  },
  {
    title: 'Lab Equipment',
    description: 'Chelsea filter simulator, spectroscope line calculator, and heavy liquid SG reference.',
    href: '/tools/lab',
    icon: 'beaker',
    variant: 'ruby' as const,
  },
  {
    title: 'Gem Identification',
    description: 'Identify gems by optical and physical properties, hardness reference, and fracture/cleavage guide.',
    href: '/tools/identification',
    icon: 'search',
    variant: 'topaz' as const,
  },
  {
    title: 'Advanced Analysis',
    description: 'Treatment detection checklist and proportion analyser (origin guidance lives in the Learn section).',
    href: '/tools/advanced',
    icon: 'chart',
    variant: 'crystal' as const,
  },
];

const iconPaths: Record<string, string> = {
  calculator: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  arrows: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  beaker: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
};

export function ToolsHub() {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white dark:from-coffee-page dark:to-coffee-page min-h-screen py-12">
      <Container size="xl" padding="md">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <CardTitle className="text-lg group-hover:text-crystal-700 transition-colors">
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
      </Container>
    </div>
  );
}
