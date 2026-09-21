'use client';

export interface CartLine {
  id: string;
  title: string;
  price: number;
  qty: number;
}

export interface CartBadgeProps {
  lines: CartLine[];
}

export function CartBadge({ lines }: CartBadgeProps) {
  const total = lines.reduce((sum, line) => sum + line.qty, 0);
  return <span className="tk-cart-badge">{total}</span>;
}

export interface CartDrawerProps {
  lines: CartLine[];
  currency: string;
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(price);
}

export function CartDrawer({ lines, currency, onQtyChange, onRemove, onCheckout }: CartDrawerProps) {
  if (lines.length === 0) {
    return <p className="tk-cart-empty">Your cart is empty</p>;
  }
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  return (
    <div className="tk-cart-drawer">
      <ul>
        {lines.map((line) => (
          <li key={line.id}>
            <span>{line.title}</span>
            <label>
              Quantity
              <input
                type="number"
                min={1}
                value={line.qty}
                onChange={(event) => onQtyChange(line.id, Number(event.target.value))}
              />
            </label>
            <span>{formatPrice(line.price * line.qty, currency)}</span>
            <button type="button" onClick={() => onRemove(line.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <p className="tk-cart-subtotal">{formatPrice(subtotal, currency)}</p>
      <button type="button" onClick={onCheckout}>Checkout</button>
    </div>
  );
}
