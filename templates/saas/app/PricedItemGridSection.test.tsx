import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { PricedItemGridSection } from './PricedItemGridSection';

beforeEach(() => {
  window.localStorage.clear();
});

describe('PricedItemGridSection', () => {
  it('shows no plan status before a selection', async () => {
    render(<PricedItemGridSection />);

    await waitFor(() => expect(screen.queryByText('Your plan')).not.toBeInTheDocument());
  });

  it('moves the plan status when a visitor selects another tier', async () => {
    render(<PricedItemGridSection />);
    const buttons = screen.getAllByRole('button', { name: 'Start free trial' });

    fireEvent.click(buttons[0]);
    await waitFor(() => expect(screen.getByText('Starter').closest('li')).toHaveTextContent('Your plan'));

    fireEvent.click(buttons[2]);
    await waitFor(() => {
      expect(screen.getByText('Scale').closest('li')).toHaveTextContent('Your plan');
      expect(screen.getByText('Starter').closest('li')).not.toHaveTextContent('Your plan');
    });

    expect(JSON.parse(window.localStorage.getItem('saas-trial-selection') ?? '[]')).toHaveLength(1);
  });

  it('restores a selected tier after remounting', async () => {
    const view = render(<PricedItemGridSection />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Start free trial' })[1]);
    await waitFor(() => expect(screen.getByText('Team').closest('li')).toHaveTextContent('Your plan'));
    view.unmount();

    render(<PricedItemGridSection />);
    await waitFor(() => expect(screen.getByText('Team').closest('li')).toHaveTextContent('Your plan'));
  });
});
