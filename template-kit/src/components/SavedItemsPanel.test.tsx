import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedItemsPanel } from './SavedItemsPanel';

interface Saved { id: string; label: string; }

describe('SavedItemsPanel', () => {
  it('shows the empty label when there are no saved items', () => {
    render(<SavedItemsPanel items={[]} emptyLabel="Nothing saved yet" onRemove={() => {}} renderItem={(i: Saved) => i.label} />);
    expect(screen.getByText('Nothing saved yet')).toBeInTheDocument();
  });

  it('renders one row per item and calls onRemove with its id', () => {
    const onRemove = vi.fn();
    render(
      <SavedItemsPanel
        items={[{ id: '1', label: 'Item A' }] as Saved[]}
        emptyLabel="Nothing saved yet"
        onRemove={onRemove}
        renderItem={(i: Saved) => i.label}
      />,
    );
    expect(screen.getByText('Item A')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith('1');
  });
});
