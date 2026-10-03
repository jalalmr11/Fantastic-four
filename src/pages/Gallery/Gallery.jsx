import { useState, useEffect } from 'react';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import Lightbox from '../../components/Lightbox/Lightbox';
import { useTilt, useScrollReveal } from '../../hooks/useEffects';
import defaultGallery from '../../data/gallery';
import { getPhotos } from '../../services/photoService';
import './Gallery.css';

function GalleryItem({ image, index, onClick }) {
  const tiltRef = useTilt(8);
  const [revealRef, isVisible] = useScrollReveal();
  const sizeClass = index % 5 === 0 ? 'gallery-item--large' : '';

  return (
    <div ref={revealRef} className={`reveal reveal--delay-${(index % 4) + 1} ${isVisible ? 'visible' : ''}`}>
      <button
        ref={tiltRef}
        className={`gallery-item tilt-card ${sizeClass}`}
        onClick={onClick}
        aria-label={image.alt || `View photo ${index + 1}`}
      >
        {image.src ? (
          <img
            src={image.src}
            alt={image.alt || ''}
            loading={index < 4 ? 'eager' : 'lazy'}
            fetchPriority={index < 2 ? 'high' : 'auto'}
            decoding="async"
          />
        ) : (
          <div className="image-placeholder gallery-item__placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        <div className="gallery-item__hover">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>
      </button>
    </div>
  );
}

export default function Gallery() {
  const [supabasePhotos, setSupabasePhotos] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    getPhotos('gallery').then(({ data }) => {
      if (isMounted && data && data.length > 0) {
        const formatted = data.map((p) => ({
          id: p.id,
          src: p.image_url,
          alt: p.title || 'Gallery photo',
        }));
        setSupabasePhotos(formatted);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Show uploaded photos alongside default photos
  const allPhotos = [...supabasePhotos, ...defaultGallery];

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <main className="gallery-page">
      <section className="page-hero">
        <div className="container text-center">
          <SectionHeading
            label="Gallery"
            title="Our photos"
            subtitle="A collection of moments captured in time. Click any photo to view it."
            center
          />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="gallery-header">
            <p className="gallery-count">{allPhotos.length} photos</p>
          </div>

          <div className="gallery-masonry">
            {allPhotos.map((image, i) => (
              <GalleryItem key={image.id} image={image} index={i} onClick={() => openLightbox(i)} />
            ))}
          </div>
        </div>
      </section>

      {lightboxOpen && (
        <Lightbox
          images={allPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((prev) => (prev === 0 ? allPhotos.length - 1 : prev - 1))}
          onNext={() => setLightboxIndex((prev) => (prev === allPhotos.length - 1 ? 0 : prev + 1))}
        />
      )}
    </main>
  );
}
