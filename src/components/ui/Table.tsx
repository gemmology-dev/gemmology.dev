import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type TableVariant = 'default' | 'card' | 'minimal';

interface TableColumn {
  key: string;
  header: string;
  mono?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface TableProps extends HTMLAttributes<HTMLDivElement> {
  columns: TableColumn[] | string[];
  rows: Record<string, ReactNode>[] | ReactNode[][];
  caption?: string;
  variant?: TableVariant;
  hover?: boolean;
}

const alignStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function normalizeColumns(columns: TableColumn[] | string[]): TableColumn[] {
  return columns.map((col, i) =>
    typeof col === 'string'
      ? { key: String(i), header: col }
      : col
  );
}

function getCell(
  row: Record<string, ReactNode> | ReactNode[],
  col: TableColumn,
  index: number
): ReactNode {
  if (Array.isArray(row)) {
    return row[index];
  }
  return row[col.key];
}

export function Table({
  columns,
  rows,
  caption,
  variant = 'default',
  hover = true,
  className,
  ...props
}: TableProps) {
  const normalizedColumns = normalizeColumns(columns);

  const wrapperStyles = {
    default: 'overflow-x-auto rounded-xl border border-slate-200',
    card: 'overflow-x-auto rounded-xl border border-slate-200 shadow-sm',
    minimal: 'overflow-x-auto',
  };

  const headerBgStyles = {
    default: 'bg-gradient-to-r from-crystal-50 to-slate-50',
    card: 'bg-gradient-to-r from-crystal-50 to-slate-50',
    minimal: 'bg-slate-50',
  };

  return (
    <div className={cn(wrapperStyles[variant], className)} {...props}>
      <table className="w-full text-sm">
        {caption && (
          <caption className="text-sm text-slate-500 mb-2 text-left px-4 py-2">
            {caption}
          </caption>
        )}
        <thead>
          <tr className={headerBgStyles[variant]}>
            {normalizedColumns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-4 py-3 font-semibold text-slate-700 border-b border-slate-200',
                  alignStyles[col.align || 'left']
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                'border-b border-slate-100 last:border-b-0',
                hover && 'hover:bg-slate-50 transition-colors'
              )}
            >
              {normalizedColumns.map((col, colIndex) => {
                const cell = getCell(row, col, colIndex);
                return (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3',
                      alignStyles[col.align || 'left'],
                      colIndex === 0 ? 'font-medium text-slate-900' : 'text-slate-600'
                    )}
                  >
                    {col.mono ? (
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-700">
                        {cell}
                      </code>
                    ) : (
                      cell
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Convenience component for simple data tables with string headers/rows
interface DataTableProps extends Omit<TableProps, 'columns' | 'rows'> {
  headers: string[];
  rows: ReactNode[][];
}

export function DataTable({ headers, rows, ...props }: DataTableProps) {
  return <Table columns={headers} rows={rows} {...props} />;
}

// Convenience component for key-value property lists
interface PropertyTableProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  properties: { label: string; value: ReactNode }[];
}

export function PropertyTable({
  title,
  properties,
  className,
  ...props
}: PropertyTableProps) {
  const validProperties = properties.filter((p) => p.value != null && p.value !== '');

  if (validProperties.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {validProperties.map((property, index) => (
          <div key={index} className="px-6 py-3 flex justify-between items-center">
            <span className="text-slate-600">{property.label}</span>
            <span className="font-medium text-slate-900">{property.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
