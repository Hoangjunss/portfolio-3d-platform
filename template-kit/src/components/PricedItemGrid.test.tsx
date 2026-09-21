import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PricedItemGrid } from './PricedItemGrid';

describe('PricedItemGrid', () => {
  it('renders price for each item', () => {
    render(<PricedItemGrid currency="VND" items={[{ id: '1', title: 'Combo A', price: 99000 }]} />);
    expect(screen.getByText(/99[,.]?000/)).toBeInTheDocument();
  });

  it('renders without throwing for an empty items array', () => {
    render(<PricedItemGrid currency="VND" items={[]} />);
  });
});
