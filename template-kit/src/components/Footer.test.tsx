import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders without throwing with an empty link set and social off', () => {
    render(<Footer links={[]} showSocial={false} />);
  });
});
