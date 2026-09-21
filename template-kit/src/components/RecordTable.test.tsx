import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordTable } from './RecordTable';

interface Contact { id: string; name: string; email: string; }

describe('RecordTable', () => {
  const columns = [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }];

  it('renders without throwing for an empty rows array', () => {
    render(<RecordTable columns={columns} rows={[]} onEdit={() => {}} onDelete={() => {}} />);
  });

  it('filters rows by the search input across all column values', () => {
    render(
      <RecordTable
        columns={columns}
        rows={[{ id: '1', name: 'Alice', email: 'alice@x.com' }, { id: '2', name: 'Bob', email: 'bob@x.com' }] as Contact[]}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText(/search/i), { target: { value: 'alice' } });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('calls onDelete with the row id', () => {
    const onDelete = vi.fn();
    render(
      <RecordTable
        columns={columns}
        rows={[{ id: '1', name: 'Alice', email: 'alice@x.com' }] as Contact[]}
        onEdit={() => {}}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('renders no Actions column and no row buttons when neither handler is given', () => {
    render(<RecordTable columns={columns} rows={[{ id: '1', name: 'Mai', email: 'mai@example.com' }]} />);
    expect(screen.queryByRole('columnheader', { name: /actions/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});
