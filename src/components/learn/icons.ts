/**
 * Icon mappings for property names in learn pages
 * SVG paths for common property types
 */

export type IconName =
  | 'axes'
  | 'angles'
  | 'symmetry'
  | 'pointGroups'
  | 'gems'
  | 'crystal'
  | 'default';

// SVG path data for icons (24x24 viewBox)
export const iconPaths: Record<IconName, string> = {
  // Coordinate axes icon
  axes: 'M12 2v20M2 12h20M7 7l5-5 5 5M7 17l5 5 5-5',

  // Angle/protractor icon
  angles: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10M12 12l7-7M12 12H5',

  // Symmetry/rotation icon
  symmetry: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',

  // Point groups/cluster icon
  pointGroups: 'M12 2l3 6h6l-4.5 4.5L18 19l-6-3-6 3 1.5-6.5L3 8h6l3-6z',

  // Gemstone icon
  gems: 'M12 2L2 8l10 14L22 8l-10-6zM2 8l10 4 10-4M12 12v10',

  // Crystal structure icon
  crystal: 'M12 2L4 6v12l8 4 8-4V6l-8-4zM4 6l8 4 8-4M12 10v12',

  // Default fallback icon
  default: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

// Map property names to icon types
export function getIconForProperty(propertyName: string): IconName {
  const name = propertyName.toLowerCase();

  if (name.includes('axes') || name.includes('axis')) return 'axes';
  if (name.includes('angle')) return 'angles';
  if (name.includes('symmetry')) return 'symmetry';
  if (name.includes('point group')) return 'pointGroups';
  if (name.includes('gem') || name.includes('example')) return 'gems';
  if (name.includes('crystal')) return 'crystal';

  return 'default';
}

// Crystal system type
export type CrystalSystem =
  | 'cubic'
  | 'hexagonal'
  | 'trigonal'
  | 'tetragonal'
  | 'orthorhombic'
  | 'monoclinic'
  | 'triclinic';

// Color configurations for each crystal system
export const crystalSystemColors: Record<CrystalSystem, {
  bg: string;
  bgLight: string;
  border: string;
  text: string;
  accent: string;
}> = {
  cubic: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    accent: 'bg-amber-100',
  },
  hexagonal: {
    bg: 'bg-cyan-500',
    bgLight: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-800',
    accent: 'bg-cyan-100',
  },
  trigonal: {
    bg: 'bg-violet-500',
    bgLight: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-800',
    accent: 'bg-violet-100',
  },
  tetragonal: {
    bg: 'bg-lime-500',
    bgLight: 'bg-lime-50',
    border: 'border-lime-200',
    text: 'text-lime-800',
    accent: 'bg-lime-100',
  },
  orthorhombic: {
    bg: 'bg-orange-500',
    bgLight: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    accent: 'bg-orange-100',
  },
  monoclinic: {
    bg: 'bg-rose-500',
    bgLight: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    accent: 'bg-rose-100',
  },
  triclinic: {
    bg: 'bg-teal-500',
    bgLight: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-800',
    accent: 'bg-teal-100',
  },
};

// Parse subsection title to determine crystal system
export function detectCrystalSystem(title: string): CrystalSystem | null {
  const lower = title.toLowerCase();

  if (lower.includes('cubic') || lower.includes('isometric')) return 'cubic';
  if (lower.includes('hexagonal')) return 'hexagonal';
  if (lower.includes('trigonal') || lower.includes('rhombohedral')) return 'trigonal';
  if (lower.includes('tetragonal')) return 'tetragonal';
  if (lower.includes('orthorhombic')) return 'orthorhombic';
  if (lower.includes('monoclinic')) return 'monoclinic';
  if (lower.includes('triclinic')) return 'triclinic';

  return null;
}

// Default CDL expressions for each crystal system
export const defaultCrystalCDL: Record<CrystalSystem, string> = {
  cubic: 'cubic[m3m]:{111}',
  hexagonal: 'hexagonal[6/mmm]:{10-10}@1.0+{0001}@0.5',
  trigonal: 'trigonal[-3m]:{10-10}@1.0+{10-11}@0.8',
  tetragonal: 'tetragonal[4/mmm]:{110}@1.0+{001}@0.7',
  orthorhombic: 'orthorhombic[mmm]:{110}@1.0+{010}@1.2+{001}@0.8',
  monoclinic: 'monoclinic[2/m]:{110}@1.0+{001}@0.6',
  triclinic: 'triclinic[-1]:{100}@1.0+{010}@1.1+{001}@0.9',
};
