import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { Timeline } from './Timeline';

describe('Timeline', () => {
  it('renders vertical orientation without throwing', () => {
    render(<Timeline orientation="vertical" entries={[{ id: '1', title: 'Step 1', description: 'd' }]} />);
  });

  it('renders horizontal orientation without throwing for an empty list', () => {
    render(<Timeline orientation="horizontal" entries={[]} />);
  });
});
