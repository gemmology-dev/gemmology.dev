const ACRONYMS = new Set([
  'CVD', 'HPHT', 'FTIR', 'HPLC', 'GIA', 'FGA', 'AGTA',
  'EDXRF', 'XRF', 'EDS', 'SEM', 'UV', 'IR', 'NIR',
  'YAG', 'GGG', 'CZ', 'IGI', 'AGS', 'SSEF', 'GRS',
]);

export function formatLabel(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
