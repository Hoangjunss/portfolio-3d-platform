import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { PhotoGallery } from './PhotoGallery';

describe('PhotoGallery', () => {
  it('renders without throwing for an empty photos array', () => {
    render(<PhotoGallery layout="grid" photos={[]} lightbox={false} />);
  });

  it('renders without throwing with real photos', () => {
    render(<PhotoGallery layout="masonry" photos={[{ id: '1', src: '/a.webp', alt: 'A photo' }]} lightbox />);
  });
});
