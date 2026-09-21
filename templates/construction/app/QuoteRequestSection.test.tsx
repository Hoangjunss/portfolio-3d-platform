import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QuoteRequestSection } from './QuoteRequestSection';
import { PROJECTS } from '../data/seed';

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function requestsPanel() {
  return within(screen.getByRole('complementary', { name: /your requests/i }));
}

function escapeRegex(text: string): RegExp {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

describe('QuoteRequestSection', () => {
  it('shows an empty state before any quote is requested', () => {
    render(<QuoteRequestSection projects={PROJECTS} />);
    expect(requestsPanel().getByText(/no requests yet/i)).toBeInTheDocument();
  });

  it('requesting a quote on a project adds it to the "Your requests" panel and updates aria-pressed', async () => {
    render(<QuoteRequestSection projects={PROJECTS} />);
    const project = PROJECTS[0];
    const card = screen.getByRole('heading', { name: project.title }).closest('li')!;
    const button = within(card).getByRole('button', { name: /request a quote/i });

    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(requestsPanel().getByText(escapeRegex(project.title))).toBeInTheDocument();
    });

    // Clicking again is idempotent
    fireEvent.click(button);
    await waitFor(() => {
      expect(requestsPanel().getAllByText(escapeRegex(project.title))).toHaveLength(1);
    });
  });

  it('persists a submitted quote request across remount (simulated reload)', async () => {
    const { unmount } = render(<QuoteRequestSection projects={PROJECTS} />);
    const project = PROJECTS[1];
    const card = screen.getByRole('heading', { name: project.title }).closest('li')!;
    fireEvent.click(within(card).getByRole('button', { name: /request a quote/i }));

    await waitFor(() => {
      expect(requestsPanel().getByText(escapeRegex(project.title))).toBeInTheDocument();
    });
    unmount();

    render(<QuoteRequestSection projects={PROJECTS} />);
    await waitFor(() => {
      expect(requestsPanel().getByText(escapeRegex(project.title))).toBeInTheDocument();
    });
  });

  it('removing a request from the panel restores button state to unrequested', async () => {
    render(<QuoteRequestSection projects={PROJECTS} />);
    const project = PROJECTS[0];
    const card = screen.getByRole('heading', { name: project.title }).closest('li')!;
    const button = within(card).getByRole('button', { name: /request a quote/i });

    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));

    fireEvent.click(requestsPanel().getByRole('button', { name: /remove/i }));
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(requestsPanel().queryByText(escapeRegex(project.title))).not.toBeInTheDocument();
      expect(requestsPanel().getByText(/no requests yet/i)).toBeInTheDocument();
    });
  });

  it('reset control restores empty requests state', async () => {
    render(<QuoteRequestSection projects={PROJECTS} />);
    const project = PROJECTS[0];
    const card = screen.getByRole('heading', { name: project.title }).closest('li')!;
    fireEvent.click(within(card).getByRole('button', { name: /request a quote/i }));
    await waitFor(() => expect(requestsPanel().getByText(escapeRegex(project.title))).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /reset demo data/i }));
    await waitFor(() => {
      expect(requestsPanel().getByText(/no requests yet/i)).toBeInTheDocument();
      expect(requestsPanel().queryByText(escapeRegex(project.title))).not.toBeInTheDocument();
    });
  });

  it('surfaces visible error message when storage fails and never shows requested state', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    try {
      render(<QuoteRequestSection projects={PROJECTS} />);
      const project = PROJECTS[0];
      const card = screen.getByRole('heading', { name: project.title }).closest('li')!;
      const button = within(card).getByRole('button', { name: /request a quote/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.getByText(/unable to save your request/i)).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(requestsPanel().queryByText(escapeRegex(project.title))).not.toBeInTheDocument();
      expect(requestsPanel().getByText(/no requests yet/i)).toBeInTheDocument();
    } finally {
      spy.mockRestore();
    }
  });
});
