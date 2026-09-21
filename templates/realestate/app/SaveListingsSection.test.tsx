import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { SaveListingsSection } from './SaveListingsSection';

beforeEach(() => {
  window.localStorage.clear();
});

describe('SaveListingsSection', () => {
  it('shows the empty state before any listing is saved', () => {
    render(<SaveListingsSection />);
    expect(screen.getByText(/no saved listings yet/i)).toBeInTheDocument();
  });

  it('saving a listing adds it to the saved-listings panel', async () => {
    render(<SaveListingsSection />);
    fireEvent.click(screen.getByRole('button', { name: /save 12 đường nguyễn huệ/i }));

    await waitFor(() => {
      const panel = screen.getByRole('complementary', { name: /saved listings/i });
      expect(within(panel).getByText(/12 đường nguyễn huệ/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saved 12 đường nguyễn huệ/i })).toBeInTheDocument();
    });
  });

  it('persists a saved listing across remount (simulated reload)', async () => {
    const { unmount } = render(<SaveListingsSection />);
    fireEvent.click(screen.getByRole('button', { name: /save 45 đường trần não/i }));
    await waitFor(() => {
      const panel = screen.getByRole('complementary', { name: /saved listings/i });
      expect(within(panel).getByText(/45 đường trần não/i)).toBeInTheDocument();
    });
    unmount();

    render(<SaveListingsSection />);
    await waitFor(() => {
      const panel = screen.getByRole('complementary', { name: /saved listings/i });
      expect(within(panel).getByText(/45 đường trần não/i)).toBeInTheDocument();
    });
  });

  it('unsaving a listing removes it from the panel and flips the toggle back', async () => {
    render(<SaveListingsSection />);
    fireEvent.click(screen.getByRole('button', { name: /save 12 đường nguyễn huệ/i }));
    await waitFor(() => {
      const panel = screen.getByRole('complementary', { name: /saved listings/i });
      expect(within(panel).getByText(/12 đường nguyễn huệ/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /saved 12 đường nguyễn huệ/i }));
    await waitFor(() => {
      const panel = screen.getByRole('complementary', { name: /saved listings/i });
      expect(within(panel).queryByText(/12 đường nguyễn huệ/i)).not.toBeInTheDocument();
      expect(screen.getByText(/no saved listings yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save 12 đường nguyễn huệ/i })).toBeInTheDocument();
    });
  });

  it('unsaving from the panel itself also flips the card toggle back', async () => {
    render(<SaveListingsSection />);
    fireEvent.click(screen.getByRole('button', { name: /save 12 đường nguyễn huệ/i }));
    await waitFor(() => {
      const panel = screen.getByRole('complementary', { name: /saved listings/i });
      expect(within(panel).getByText(/12 đường nguyễn huệ/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    await waitFor(() => {
      expect(screen.getByText(/no saved listings yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save 12 đường nguyễn huệ/i })).toBeInTheDocument();
    });
  });
});
