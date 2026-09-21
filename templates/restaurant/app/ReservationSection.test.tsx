import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReservationSection } from './ReservationSection';

beforeEach(() => {
  window.localStorage.clear();
});

describe('ReservationSection', () => {
  it('shows an empty "Your reservations" list on first visit', () => {
    render(<ReservationSection />);
    expect(screen.getByText(/no reservations yet/i)).toBeInTheDocument();
  });

  it('submitting the reservation form adds it to "Your reservations" and to localStorage', async () => {
    render(<ReservationSection />);

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Alex Tran' } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText(/^phone/i), { target: { value: '0900000000' } });
    fireEvent.change(screen.getByLabelText(/party size/i), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText(/time/i), { target: { value: '19:30' } });
    fireEvent.click(screen.getByRole('button', { name: /reserve/i }));

    await waitFor(() => {
      expect(screen.getByText(/Alex Tran/)).toBeInTheDocument();
      expect(screen.getByText(/4 guests/i)).toBeInTheDocument();
    });

    const stored = JSON.parse(window.localStorage.getItem('restaurant-reservations')!);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ name: 'Alex Tran', phone: '0900000000', partySize: 4, date: '2026-10-01', time: '19:30' });
    expect(stored[0]).not.toHaveProperty('email');
  });

  it('a reservation persists across remount (simulating reload)', async () => {
    const { unmount } = render(<ReservationSection />);
    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Mai Le' } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'mai@example.com' } });
    fireEvent.change(screen.getByLabelText(/^phone/i), { target: { value: '0911111111' } });
    fireEvent.change(screen.getByLabelText(/party size/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-11-05' } });
    fireEvent.change(screen.getByLabelText(/time/i), { target: { value: '20:00' } });
    fireEvent.click(screen.getByRole('button', { name: /reserve/i }));
    await waitFor(() => expect(screen.getByText(/Mai Le/)).toBeInTheDocument());
    unmount();

    render(<ReservationSection />);
    await waitFor(() => expect(screen.getByText(/Mai Le/)).toBeInTheDocument());
  });

  it('reset clears the reservations list and local storage', async () => {
    render(<ReservationSection />);
    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Alex Tran' } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText(/^phone/i), { target: { value: '0900000000' } });
    fireEvent.change(screen.getByLabelText(/party size/i), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText(/time/i), { target: { value: '19:30' } });
    fireEvent.click(screen.getByRole('button', { name: /reserve/i }));

    await waitFor(() => expect(screen.getByText(/Alex Tran/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /reset demo data/i }));
    await waitFor(() => {
      expect(screen.getByText(/no reservations yet/i)).toBeInTheDocument();
    });
  });
});
