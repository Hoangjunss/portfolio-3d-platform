import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BookingSection } from './BookingSection';
import { SCHEDULE } from '../data/seed';

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('BookingSection', () => {
  it('shows an empty state before any class is booked', () => {
    render(<BookingSection />);
    expect(screen.getByText(/no bookings yet/i)).toBeInTheDocument();
  });

  it('booking a class adds it to the "My classes" panel', async () => {
    render(<BookingSection />);
    const button = screen.getByRole('button', { name: new RegExp(`book.*${SCHEDULE[0].className}`, 'i') });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/sunrise hiit/i)).toBeInTheDocument();
    });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('persists a booking across remount (simulated reload)', async () => {
    const { unmount } = render(<BookingSection />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`book.*${SCHEDULE[0].className}`, 'i') }));
    await waitFor(() => expect(screen.getByText(/sunrise hiit/i)).toBeInTheDocument());
    unmount();

    render(<BookingSection />);
    await waitFor(() => expect(screen.getByText(/sunrise hiit/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: new RegExp(`book.*${SCHEDULE[0].className}`, 'i') })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('cancelling a booking removes it from the panel', async () => {
    render(<BookingSection />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`book.*${SCHEDULE[0].className}`, 'i') }));
    await waitFor(() => expect(screen.getByText(/sunrise hiit/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => {
      expect(screen.queryByText(/sunrise hiit/i)).not.toBeInTheDocument();
      expect(screen.getByText(/no bookings yet/i)).toBeInTheDocument();
    });
  });

  it('clicking book twice toggles the booking off', async () => {
    render(<BookingSection />);
    const button = screen.getByRole('button', { name: new RegExp(`book.*${SCHEDULE[0].className}`, 'i') });
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByText(/sunrise hiit/i)).toBeInTheDocument());
    expect(button).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByText(/sunrise hiit/i)).not.toBeInTheDocument();
      expect(screen.getByText(/no bookings yet/i)).toBeInTheDocument();
    });
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('reset control clears the bookings back to empty', async () => {
    render(<BookingSection />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`book.*${SCHEDULE[0].className}`, 'i') }));
    await waitFor(() => expect(screen.getByText(/sunrise hiit/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    await waitFor(() => {
      expect(screen.queryByText(/sunrise hiit/i)).not.toBeInTheDocument();
      expect(screen.getByText(/no bookings yet/i)).toBeInTheDocument();
    });
  });

  it('surfaces visible error message when storage fails and never shows booked state', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    try {
      render(<BookingSection />);
      const button = screen.getByRole('button', { name: new RegExp(`book.*${SCHEDULE[0].className}`, 'i') });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.queryByText(/sunrise hiit/i)).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'false');
    } finally {
      spy.mockRestore();
    }
  });
});
