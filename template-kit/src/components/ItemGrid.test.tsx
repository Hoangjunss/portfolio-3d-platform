import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ItemGrid } from './ItemGrid';

describe('ItemGrid', () => {
  it('renders one card per item', () => {
    render(<ItemGrid items={[{ id: '1', title: 'A', description: 'desc' }, { id: '2', title: 'B', description: 'desc' }]} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders without throwing for an empty items array', () => {
    render(<ItemGrid items={[]} />);
  });

  it('accepts a compact six-column grid', () => {
    render(<ItemGrid columns={6} items={[{ id: '1', title: 'Slack', description: '' }]} />);

    expect(screen.getByRole('list')).toHaveAttribute('data-columns', '6');
  });
});
