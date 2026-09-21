export interface Photo {
  id: string;
  src: string;
  alt: string;
}

export interface PhotoGalleryProps {
  photos: Photo[];
  layout: 'grid' | 'masonry';
  lightbox: boolean;
}

export function PhotoGallery({ photos, layout, lightbox }: PhotoGalleryProps) {
  return (
    <ul className="tk-photo-gallery" data-layout={layout} data-lightbox={lightbox}>
      {photos.map((photo) => (
        <li key={photo.id}>
          <img src={photo.src} alt={photo.alt} />
        </li>
      ))}
    </ul>
  );
}
