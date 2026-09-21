import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompareTray } from './CompareTray';

interface Vehicle { id: string; label: string; }

describe('CompareTray', () => {
  it('renders without throwing for an empty comparison', () => {
    render(<CompareTray items={[]} onRemove={() => {}} renderItem={(v: Vehicle) => v.label} />);
  });

  it('renders up to the items given, one column each', () => {
    render(
      <CompareTray
        items={[{ id: '1', label: 'Car A' }, { id: '2', label: 'Car B' }] as Vehicle[]}
        onRemove={() => {}}
        renderItem={(v: Vehicle) => v.label}
      />,
    );
    expect(screen.getByText('Car A')).toBeInTheDocument();
    expect(screen.getByText('Car B')).toBeInTheDocument();
  });
});
