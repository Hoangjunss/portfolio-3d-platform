import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ScheduleSection } from './ScheduleSection';
import { AGENDA } from '../data/seed';

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('ScheduleSection', () => {
  it('shows an empty "My schedule" state before any session is added', () => {
    render(<ScheduleSection agenda={AGENDA} />);
    expect(screen.getByText(/schedule is empty/i)).toBeInTheDocument();
  });

  it('adding a session appends it to "My schedule"', async () => {
    render(<ScheduleSection agenda={AGENDA} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`add.*${AGENDA[0].title}`, 'i') }));

    await waitFor(() => {
      expect(screen.getByText(AGENDA[0].title, { selector: '[aria-label="My schedule"] *' })).toBeInTheDocument();
    });
  });

  it('persists an added session across remount (simulated reload)', async () => {
    const { unmount } = render(<ScheduleSection agenda={AGENDA} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`add.*${AGENDA[1].title}`, 'i') }));
    await waitFor(() =>
      expect(screen.getByText(AGENDA[1].title, { selector: '[aria-label="My schedule"] *' })).toBeInTheDocument(),
    );
    unmount();

    render(<ScheduleSection agenda={AGENDA} />);
    await waitFor(() =>
      expect(screen.getByText(AGENDA[1].title, { selector: '[aria-label="My schedule"] *' })).toBeInTheDocument(),
    );
  });

  it('removing a session drops it from "My schedule"', async () => {
    render(<ScheduleSection agenda={AGENDA} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`add.*${AGENDA[2].title}`, 'i') }));
    await waitFor(() =>
      expect(screen.getByText(AGENDA[2].title, { selector: '[aria-label="My schedule"] *' })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => {
      expect(screen.getByText(/schedule is empty/i)).toBeInTheDocument();
    });
  });

  it('clicking Add twice on the same session is idempotent', async () => {
    render(<ScheduleSection agenda={AGENDA} />);
    const button = screen.getByRole('button', { name: new RegExp(`add.*${AGENDA[0].title}`, 'i') });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      const items = screen.getAllByText(AGENDA[0].title, { selector: '[aria-label="My schedule"] *' });
      expect(items).toHaveLength(1);
    });
  });

  it('reset control clears the schedule back to empty', async () => {
    render(<ScheduleSection agenda={AGENDA} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`add.*${AGENDA[0].title}`, 'i') }));

    await waitFor(() => {
      expect(screen.getByText(AGENDA[0].title, { selector: '[aria-label="My schedule"] *' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText(/schedule is empty/i)).toBeInTheDocument();
    });
  });

  it('surfaces a visible error message when writing to schedule fails', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    render(<ScheduleSection agenda={AGENDA} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`add.*${AGENDA[0].title}`, 'i') }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
