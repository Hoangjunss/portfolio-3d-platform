import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RsvpSection } from './RsvpSection';

beforeEach(() => {
  window.localStorage.clear();
});

// The live total renders as <strong>N</strong> guests confirmed, so its text spans two elements and
// getByText cannot match across that boundary. Read the element's own textContent instead.
function guestCountText(): string {
  const el = document.querySelector('.guest-count');
  if (!el) throw new Error('.guest-count not found');
  return el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('RsvpSection', () => {
  it('shows 0 guests confirmed before any RSVP is submitted', () => {
    render(<RsvpSection />);
    expect(guestCountText()).toBe('0 guests confirmed');
  });

  it('submitting an "attending" RSVP for 3 guests updates the live total to 3', async () => {
    render(<RsvpSection />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Trần Bảo Ngọc' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'ngoc.tran@example.com' } });
    fireEvent.change(screen.getByLabelText(/attending/i), { target: { value: 'yes' } });
    fireEvent.change(screen.getByLabelText(/number of guests/i), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /send rsvp/i }));

    await waitFor(() => {
      expect(guestCountText()).toBe('3 guests confirmed');
    });
  });

  it('an RSVP with attending="no" does not add to the confirmed guest total', async () => {
    render(<RsvpSection />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Lê Quang Vinh' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'vinh.le@example.com' } });
    fireEvent.change(screen.getByLabelText(/attending/i), { target: { value: 'no' } });
    fireEvent.change(screen.getByLabelText(/number of guests/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /send rsvp/i }));

    await waitFor(() => {
      expect(guestCountText()).toBe('0 guests confirmed');
    });
  });

  it('persists the confirmed guest total across remount (simulated reload)', async () => {
    const { unmount } = render(<RsvpSection />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Phạm Thu Trang' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'trang.pham@example.com' } });
    fireEvent.change(screen.getByLabelText(/attending/i), { target: { value: 'yes' } });
    fireEvent.change(screen.getByLabelText(/number of guests/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /send rsvp/i }));
    await waitFor(() => expect(guestCountText()).toBe('2 guests confirmed'));
    unmount();

    render(<RsvpSection />);
    await waitFor(() => expect(guestCountText()).toBe('2 guests confirmed'));
  });

  it('surfaces visible error message when storage fails', async () => {
    // Assigning window.localStorage.setItem does not take effect in jsdom -- the method lives on
    // Storage.prototype and the instance assignment is ignored, so the write never threw and the
    // test passed through the happy path. Spy on the prototype, as the event site's test does.
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    try {
      render(<RsvpSection />);
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Trần Bảo Ngọc' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'ngoc.tran@example.com' } });
      fireEvent.change(screen.getByLabelText(/attending/i), { target: { value: 'yes' } });
      fireEvent.change(screen.getByLabelText(/number of guests/i), { target: { value: '3' } });
      fireEvent.click(screen.getByRole('button', { name: /send rsvp/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(guestCountText()).toBe('0 guests confirmed');
    } finally {
      spy.mockRestore();
    }
  });
});
