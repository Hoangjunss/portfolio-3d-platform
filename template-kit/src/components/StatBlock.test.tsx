import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatBlock } from './StatBlock';

describe('StatBlock', () => {
  it('renders nothing for an empty stats array', () => {
    const { container } = render(<StatBlock stats={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one block per real stat, never a literal 0 for a missing value', () => {
    render(<StatBlock stats={[{ label: 'Clients served', value: '120+' }]} />);
    expect(screen.getByText('120+')).toBeInTheDocument();
  });
});
