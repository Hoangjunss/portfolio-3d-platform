import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TripPlannerSection } from './TripPlannerSection';
import { ROOMS } from '../data/seed';

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function tripPanel() {
  return within(screen.getByRole('complementary', { name: /my trip/i }));
}

describe('TripPlannerSection', () => {
  it('shows the empty state before any room/package is added', () => {
    render(<TripPlannerSection rooms={ROOMS} />);
    expect(tripPanel().getByText(/trip is empty/i)).toBeInTheDocument();
  });

  it('adding a package shows it in "My trip" with a running subtotal', async () => {
    render(<TripPlannerSection rooms={ROOMS} />);
    const packageRoom = ROOMS.find((room) => room.id === 'pkg-weekend-getaway')!;

    const card = screen.getByRole('heading', { name: packageRoom.title }).closest('li')!;
    fireEvent.click(within(card).getByRole('button', { name: /add to trip/i }));

    await waitFor(() => {
      expect(tripPanel().getByText(new RegExp(packageRoom.title))).toBeInTheDocument();
      expect(tripPanel().getByText(/5[.,]400[.,]000/)).toBeInTheDocument();
    });

    // Clicking "Add to trip" twice on the same package is idempotent
    fireEvent.click(within(card).getByRole('button', { name: /add to trip/i }));
    await waitFor(() => {
      expect(tripPanel().getAllByText(new RegExp(packageRoom.title))).toHaveLength(1);
      expect(tripPanel().getByText(/5[.,]400[.,]000/)).toBeInTheDocument();
    });
  });

  it('persists an added package across remount (simulated reload) and removing it updates the subtotal', async () => {
    const { unmount } = render(<TripPlannerSection rooms={ROOMS} />);
    const packageRoom = ROOMS.find((room) => room.id === 'pkg-weekend-getaway')!;

    const card = screen.getByRole('heading', { name: packageRoom.title }).closest('li')!;
    fireEvent.click(within(card).getByRole('button', { name: /add to trip/i }));
    await waitFor(() => expect(tripPanel().getByText(new RegExp(packageRoom.title))).toBeInTheDocument());
    unmount();

    render(<TripPlannerSection rooms={ROOMS} />);
    await waitFor(() => expect(tripPanel().getByText(new RegExp(packageRoom.title))).toBeInTheDocument());

    fireEvent.click(tripPanel().getByRole('button', { name: /remove/i }));
    await waitFor(() => {
      expect(tripPanel().queryByText(new RegExp(packageRoom.title))).not.toBeInTheDocument();
      expect(tripPanel().getByText(/trip is empty/i)).toBeInTheDocument();
    });
  });

  it('reset control restores empty trip state and 0 subtotal', async () => {
    render(<TripPlannerSection rooms={ROOMS} />);
    const packageRoom = ROOMS.find((room) => room.id === 'pkg-weekend-getaway')!;

    const card = screen.getByRole('heading', { name: packageRoom.title }).closest('li')!;
    fireEvent.click(within(card).getByRole('button', { name: /add to trip/i }));
    await waitFor(() => expect(tripPanel().getByText(new RegExp(packageRoom.title))).toBeInTheDocument());

    fireEvent.click(tripPanel().getByRole('button', { name: /reset demo data/i }));
    await waitFor(() => {
      expect(tripPanel().getByText(/trip is empty/i)).toBeInTheDocument();
      expect(tripPanel().queryByText(new RegExp(packageRoom.title))).not.toBeInTheDocument();
    });
  });

  it('surfaces visible error message when storage fails and never shows added state', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    try {
      render(<TripPlannerSection rooms={ROOMS} />);
      const packageRoom = ROOMS.find((room) => room.id === 'pkg-weekend-getaway')!;
      const card = screen.getByRole('heading', { name: packageRoom.title }).closest('li')!;
      fireEvent.click(within(card).getByRole('button', { name: /add to trip/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.getByText(/unable to save to your trip/i)).toBeInTheDocument();
      expect(tripPanel().queryByText(new RegExp(packageRoom.title))).not.toBeInTheDocument();
      expect(tripPanel().getByText(/trip is empty/i)).toBeInTheDocument();
    } finally {
      spy.mockRestore();
    }
  });
});
