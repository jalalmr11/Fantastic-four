import { useEffect, useCallback } from 'react';
import './Lightbox.css';

export default function Lightbox({ images, currentIndex, onClose, onPrev, onNext }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const current = images[currentIndex];
  if (!current) return null;

  return (
    <div className="lightbox" role="dialog" aria-label="Image viewer" aria-modal="true">
      <div className="lightbox__backdrop" onClick={onClose} />

      <div className="lightbox__content">
        <div className="lightbox__image-wrapper">
          {current.src ? (
            <img src={current.src} alt={current.alt || 'Photo'} className="lightbox__image" />
          ) : (
            <div className="lightbox__placeholder">
              <p>No image available</p>
            </div>
          )}
        </div>

        <div className="lightbox__counter">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      <button className="lightbox__close" onClick={onClose} aria-label="Close viewer" id="lightbox-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {images.length > 1 && (
        <>
          <button className="lightbox__nav lightbox__nav--prev" onClick={onPrev} aria-label="Previous image" id="lightbox-prev">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="lightbox__nav lightbox__nav--next" onClick={onNext} aria-label="Next image" id="lightbox-next">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
