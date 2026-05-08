import { ReactNode } from 'react';

interface Column {
  key: string;
  label: string;
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable({ columns, data, loading, emptyMessage = 'No data available' }: DataTableProps) {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
          <polyline points="13,2 13,9 20,9" />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.headerClassName}
                style={col.width ? { width: col.width } : {}}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={(row.id as string | number) || rowIndex}>
              {columns.map((col) => (
                <td key={col.key} className={col.cellClassName} data-label={col.label}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

