import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ShortlistPanel } from './ShortlistPanel';

describe('ShortlistPanel', () => {
  it('shows an empty-shortlist message when no project is saved', () => {
    render(<ShortlistPanel items={[]} onRemove={() => {}} />);

    expect(screen.getByText(/nothing saved yet/i)).toBeInTheDocument();
  });

  it('renders one saved project row for each shortlist entry', () => {
    render(
      <ShortlistPanel
        items={[{ id: 'harborline', title: 'Harborline Rebrand', savedAt: '2026-09-20T00:00:00.000Z' }]}
        onRemove={() => {}}
      />,
    );

    expect(screen.getByText('Harborline Rebrand')).toBeInTheDocument();
  });
});
