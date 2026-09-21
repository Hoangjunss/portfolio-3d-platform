'use client';

import { useMemo, useState } from 'react';

export interface RecordTableColumn {
  key: string;
  label: string;
}

export interface RecordTableProps<T extends { id: string }> {
  columns: RecordTableColumn[];
  rows: T[];
  onEdit: (row: T) => void;
  onDelete: (id: string) => void;
}

export function RecordTable<T extends { id: string; [key: string]: unknown }>({ columns, rows, onEdit, onDelete }: RecordTableProps<T>) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((column) => String(row[column.key] ?? '').toLowerCase().includes(needle)),
    );
  }, [rows, search, columns]);

  return (
    <div className="tk-record-table">
      <label>
        Search
        <input value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => <td key={column.key}>{String(row[column.key] ?? '')}</td>)}
              <td>
                <button type="button" onClick={() => onEdit(row)}>Edit</button>
                <button type="button" onClick={() => onDelete(row.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
