import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkSection } from './WorkSection';

const items = [
  { id: 'brand', title: 'Brand project', description: 'Identity work.', category: 'branding' as const, image: '/brand.webp' },
  { id: 'product', title: 'Product project', description: 'Product work.', category: 'product' as const, image: '/product.webp' },
];

describe('WorkSection filter tabs', () => {
  it('shows every work item by default', () => {
    render(<WorkSection items={items} />);

    expect(screen.getByText('Brand project')).toBeInTheDocument();
    expect(screen.getByText('Product project')).toBeInTheDocument();
  });

  it('shows only the selected category after a filter is clicked', () => {
    render(<WorkSection items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Branding' }));

    expect(screen.getByText('Brand project')).toBeInTheDocument();
    expect(screen.queryByText('Product project')).not.toBeInTheDocument();
  });

  it('restores every work item when All is clicked', () => {
    render(<WorkSection items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Branding' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));

    expect(screen.getByText('Brand project')).toBeInTheDocument();
    expect(screen.getByText('Product project')).toBeInTheDocument();
  });
});

describe('WorkSection shortlist', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds a saved project to the shortlist panel', async () => {
    render(<WorkSection items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Brand project' }));

    await waitFor(() => {
      expect(screen.getAllByText('Brand project')).toHaveLength(2);
    });
  });

  it('restores a saved project after remounting', async () => {
    const view = render(<WorkSection items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Brand project' }));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem('agency-shortlist') ?? '[]')).toHaveLength(1));
    view.unmount();

    render(<WorkSection items={items} />);
    await waitFor(() => expect(screen.getAllByText('Brand project')).toHaveLength(2));
  });

  it('removes a saved project from the panel and local storage', async () => {
    render(<WorkSection items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Brand project' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem('agency-shortlist') ?? '[]')).toHaveLength(0);
      expect(screen.getByText(/nothing saved yet/i)).toBeInTheDocument();
    });
  });
});
