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

  it('marks only the selected plan and exposes its status', () => {
    render(
      <PricedItemGrid
        currency="USD"
        selectedItemId="team"
        items={[
          { id: 'starter', title: 'Starter', price: 29 },
          { id: 'team', title: 'Team', price: 79 },
        ]}
      />,
    );

    expect(screen.getByText('Starter').closest('li')).not.toHaveAttribute('data-selected');
    expect(screen.getByText('Team').closest('li')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByText('Team').closest('li')).toHaveTextContent('Your plan');
  });
});
