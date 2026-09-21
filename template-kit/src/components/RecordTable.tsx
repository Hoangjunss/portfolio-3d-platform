'use client';

import { useMemo, useState } from 'react';

export interface RecordTableColumn {
  key: string;
  label: string;
}

export interface RecordTableProps<T extends { id: string }> {
  columns: RecordTableColumn[];
  rows: T[];
  // Optional so the table can be reused read-only. A public page -- a gym's class schedule, a
  // published timetable -- must not show Edit and Delete to every visitor, and hiding them in CSS
  // would leave them in the accessibility tree and on the tab order.
  onEdit?: (row: T) => void;
  onDelete?: (id: string) => void;
}

export function RecordTable<T extends { id: string; [key: string]: unknown }>({ columns, rows, onEdit, onDelete }: RecordTableProps<T>) {
  const showActions = Boolean(onEdit || onDelete);
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
            {showActions ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => <td key={column.key}>{String(row[column.key] ?? '')}</td>)}
              {showActions ? (
                <td>
                  {onEdit ? <button type="button" onClick={() => onEdit(row)}>Edit</button> : null}
                  {onDelete ? <button type="button" onClick={() => onDelete(row.id)}>Delete</button> : null}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
