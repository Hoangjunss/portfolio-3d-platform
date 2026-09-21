import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders with required props without throwing', () => {
    render(<Hero headline="Build faster" subhead="A demo site" ctaLabel="Get started" ctaHref="#" />);
  });
});
