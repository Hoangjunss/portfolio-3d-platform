import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CallbackSection } from './CallbackSection';

beforeEach(() => {
  window.localStorage.clear();
});

describe('CallbackSection', () => {
  it('shows an empty state before any request is submitted', () => {
    render(<CallbackSection />);
    expect(screen.getByText(/no requests yet/i)).toBeInTheDocument();
  });

  it('submitting the form adds the request to the "Your requests" panel', async () => {
    render(<CallbackSection />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Đỗ Văn Nam' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'nam.do@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '0901234567' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Interested in strategy advisory.' } });
    fireEvent.click(screen.getByRole('button', { name: /request a callback/i }));

    await waitFor(() => {
      expect(screen.getByText('Đỗ Văn Nam')).toBeInTheDocument();
    });
  });

  it('persists a submitted request across remount (simulated reload)', async () => {
    const { unmount } = render(<CallbackSection />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Bùi Thị Lan' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'lan.bui@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /request a callback/i }));
    await waitFor(() => expect(screen.getByText('Bùi Thị Lan')).toBeInTheDocument());
    unmount();

    render(<CallbackSection />);
    await waitFor(() => expect(screen.getByText('Bùi Thị Lan')).toBeInTheDocument());
  });
});
