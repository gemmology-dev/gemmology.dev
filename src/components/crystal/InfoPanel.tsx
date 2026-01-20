import { Badge } from '../ui/Badge';

interface MineralProperty {
  label: string;
  value: string | number | undefined;
}

interface InfoPanelProps {
  name: string;
  system: string;
  properties: MineralProperty[];
  cdl?: string;
  className?: string;
}

export function InfoPanel({ name, system, properties, cdl, className }: InfoPanelProps) {
  const filteredProperties = properties.filter(p => p.value !== undefined && p.value !== '');

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
        <Badge variant="crystal">{system}</Badge>
      </div>

      <div className="space-y-3">
        {filteredProperties.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-baseline">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-medium text-slate-900">{value}</span>
          </div>
        ))}
      </div>

      {cdl && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <span className="text-sm font-medium text-slate-700">CDL</span>
          <pre className="mt-2 bg-slate-100 rounded-lg p-3 text-sm font-mono text-slate-700 overflow-x-auto">
            <code>{cdl}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

// FGA-style info panel with standard gemmological properties
interface FGAInfoPanelProps {
  mineral: {
    name: string;
    system: string;
    chemistry?: string;
    hardness?: string;
    sg?: string;
    ri?: string;
    birefringence?: string;
    pleochroism?: string;
    dispersion?: string;
    lustre?: string;
    cleavage?: string;
    fracture?: string;
    cdl?: string;
  };
  className?: string;
}

export function FGAInfoPanel({ mineral, className }: FGAInfoPanelProps) {
  const properties: MineralProperty[] = [
    { label: 'Chemistry', value: mineral.chemistry },
    { label: 'Hardness', value: mineral.hardness },
    { label: 'Specific Gravity', value: mineral.sg },
    { label: 'Refractive Index', value: mineral.ri },
    { label: 'Birefringence', value: mineral.birefringence },
    { label: 'Pleochroism', value: mineral.pleochroism },
    { label: 'Dispersion', value: mineral.dispersion },
    { label: 'Lustre', value: mineral.lustre },
    { label: 'Cleavage', value: mineral.cleavage },
    { label: 'Fracture', value: mineral.fracture },
  ];

  return (
    <InfoPanel
      name={mineral.name}
      system={mineral.system}
      properties={properties}
      cdl={mineral.cdl}
      className={className}
    />
  );
}
