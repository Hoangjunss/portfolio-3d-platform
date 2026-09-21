import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PledgeSection } from './PledgeSection';

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function panel() {
  return within(screen.getByRole('complementary', { name: /running total/i }));
}

describe('PledgeSection', () => {
  it('shows a non-zero running total on first render, from the seeded pledges', () => {
    render(<PledgeSection />);
    // seed total = 500,000 + 1,200,000 + 300,000 = 2,000,000
    expect(panel().getByText(/2[,.]?000[,.]?000/)).toBeInTheDocument();
  });

  it('submitting a pledge increases the running total by the pledged amount', async () => {
    render(<PledgeSection />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Đặng Thu Trang' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'trang.dang@example.com' } });
    fireEvent.change(screen.getByLabelText(/pledge amount/i), { target: { value: '750000' } });
    fireEvent.click(screen.getByRole('button', { name: /^pledge$/i }));

    await waitFor(() => {
      // 2,000,000 (seed) + 750,000 (new pledge) = 2,750,000
      expect(panel().getByText(/2[,.]?750[,.]?000/)).toBeInTheDocument();
    });
    expect(panel().getByText('Đặng Thu Trang')).toBeInTheDocument();
  });

  it("highlights the visitor's own most recent pledge after submitting", async () => {
    render(<PledgeSection />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Đặng Thu Trang' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'trang.dang@example.com' } });
    fireEvent.change(screen.getByLabelText(/pledge amount/i), { target: { value: '750000' } });
    fireEvent.click(screen.getByRole('button', { name: /^pledge$/i }));

    await waitFor(() => {
      const row = panel().getByText('Đặng Thu Trang').closest('li');
      expect(row).toHaveAttribute('data-own-pledge', 'true');
    });
  });

  it('persists a submitted pledge and its contribution to the total across remount (simulated reload)', async () => {
    const { unmount } = render(<PledgeSection />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Hoàng Minh Đức' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'duc.hoang@example.com' } });
    fireEvent.change(screen.getByLabelText(/pledge amount/i), { target: { value: '1000000' } });
    fireEvent.click(screen.getByRole('button', { name: /^pledge$/i }));
    await waitFor(() => expect(panel().getByText(/3[,.]?000[,.]?000/)).toBeInTheDocument());
    unmount();

    render(<PledgeSection />);
    await waitFor(() => {
      expect(panel().getByText('Hoàng Minh Đức')).toBeInTheDocument();
      expect(panel().getByText(/3[,.]?000[,.]?000/)).toBeInTheDocument();
    });
    const row = panel().getByText('Hoàng Minh Đức').closest('li');
    expect(row).toHaveAttribute('data-own-pledge', 'false');
  });

  it('reset control restores seeded pledges and total', async () => {
    render(<PledgeSection />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Đặng Thu Trang' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'trang.dang@example.com' } });
    fireEvent.change(screen.getByLabelText(/pledge amount/i), { target: { value: '750000' } });
    fireEvent.click(screen.getByRole('button', { name: /^pledge$/i }));
    await waitFor(() => expect(panel().getByText(/2[,.]?750[,.]?000/)).toBeInTheDocument());

    fireEvent.click(panel().getByRole('button', { name: /reset demo data/i }));
    await waitFor(() => {
      expect(panel().getByText(/2[,.]?000[,.]?000/)).toBeInTheDocument();
      expect(panel().queryByText('Đặng Thu Trang')).not.toBeInTheDocument();
    });
  });

  it('surfaces visible error message when storage fails and never shows pledged state', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    try {
      render(<PledgeSection />);
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Lê Văn An' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'an.le@example.com' } });
      fireEvent.change(screen.getByLabelText(/pledge amount/i), { target: { value: '500000' } });
      fireEvent.click(screen.getByRole('button', { name: /^pledge$/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.getByText(/unable to save your pledge/i)).toBeInTheDocument();
      expect(panel().queryByText('Lê Văn An')).not.toBeInTheDocument();
      expect(panel().getByText(/2[,.]?000[,.]?000/)).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    } finally {
      spy.mockRestore();
    }
  });
});
