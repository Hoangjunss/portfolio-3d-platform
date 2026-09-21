import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RsvpSection } from './RsvpSection';

beforeEach(() => {
  window.localStorage.clear();
});

describe('RsvpSection', () => {
  it('shows 0 guests confirmed before any RSVP is submitted', () => {
    render(<RsvpSection />);
    expect(screen.getByText(/0 guests confirmed/i)).toBeInTheDocument();
  });

  it('submitting an "attending" RSVP for 3 guests updates the live total to 3', async () => {
    render(<RsvpSection />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Trần Bảo Ngọc' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'ngoc.tran@example.com' } });
    fireEvent.change(screen.getByLabelText(/attending/i), { target: { value: 'yes' } });
    fireEvent.change(screen.getByLabelText(/number of guests/i), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /send rsvp/i }));

    await waitFor(() => {
      expect(screen.getByText(/3 guests confirmed/i)).toBeInTheDocument();
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
      expect(screen.getByText(/0 guests confirmed/i)).toBeInTheDocument();
    });
  });

  it('persists the confirmed guest total across remount (simulated reload)', async () => {
    const { unmount } = render(<RsvpSection />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Phạm Thu Trang' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'trang.pham@example.com' } });
    fireEvent.change(screen.getByLabelText(/attending/i), { target: { value: 'yes' } });
    fireEvent.change(screen.getByLabelText(/number of guests/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /send rsvp/i }));
    await waitFor(() => expect(screen.getByText(/2 guests confirmed/i)).toBeInTheDocument());
    unmount();

    render(<RsvpSection />);
    await waitFor(() => expect(screen.getByText(/2 guests confirmed/i)).toBeInTheDocument());
  });

  it('surfaces visible error message when storage fails', async () => {
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };

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
      expect(screen.getByText(/0 guests confirmed/i)).toBeInTheDocument();
    } finally {
      window.localStorage.setItem = originalSetItem;
    }
  });
});
