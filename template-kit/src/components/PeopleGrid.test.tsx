import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { PeopleGrid } from './PeopleGrid';

describe('PeopleGrid', () => {
  it('renders without throwing for an empty people array', () => {
    render(<PeopleGrid roleLabel="Team" people={[]} />);
  });

  it('renders without throwing with real people', () => {
    render(<PeopleGrid roleLabel="Leadership" people={[{ id: '1', name: 'A', role: 'CEO' }]} />);
  });
});
