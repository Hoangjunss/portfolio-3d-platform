import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartDrawer, CartBadge } from './CartDrawer';

interface CartLine { id: string; title: string; price: number; qty: number; }

describe('CartBadge', () => {
  it('shows the total quantity across all lines', () => {
    render(<CartBadge lines={[{ id: '1', title: 'A', price: 1000, qty: 2 }, { id: '2', title: 'B', price: 500, qty: 1 }] as CartLine[]} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders 0 for an empty cart', () => {
    render(<CartBadge lines={[]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

describe('CartDrawer', () => {
  it('renders an empty-cart message for an empty cart', () => {
    render(<CartDrawer lines={[]} currency="VND" onQtyChange={() => {}} onRemove={() => {}} onCheckout={() => {}} />);
    expect(screen.getByText(/cart is empty/i)).toBeInTheDocument();
  });

  it('calls onQtyChange when the quantity input changes', () => {
    const onQtyChange = vi.fn();
    render(
      <CartDrawer
        lines={[{ id: '1', title: 'Product A', price: 10000, qty: 1 }] as CartLine[]}
        currency="VND"
        onQtyChange={onQtyChange}
        onRemove={() => {}}
        onCheckout={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '3' } });
    expect(onQtyChange).toHaveBeenCalledWith('1', 3);
  });
});
