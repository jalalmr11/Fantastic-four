import { useState, useEffect, useRef, useCallback } from 'react';
import { useTilt, useScrollReveal } from '../../hooks/useEffects';
import './MemoryCard.css';

const PhotoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);

export default function MemoryCard({ memory, index = 0 }) {
  const tiltRef = useTilt(8);
  const [revealRef, isVisible] = useScrollReveal();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Support both old 'photo' and new 'photos' format
  const photos = memory.photos || (memory.photo ? [memory.photo] : []);
  const totalSlides = photos.length;
  const hasMultiple = totalSlides > 1;

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (!hasMultiple || isPaused) {
      clearInterval(autoPlayRef.current);
      return;
    }
    autoPlayRef.current = setInterval(goNext, 4000);
    return () => clearInterval(autoPlayRef.current);
  }, [hasMultiple, isPaused, goNext]);

  // Pause on interaction, resume after 6 seconds
  const pauseAutoPlay = useCallback(() => {
    setIsPaused(true);
    const timeout = setTimeout(() => setIsPaused(false), 6000);
    return () => clearTimeout(timeout);
  }, []);

  const handlePrev = (e) => {
    e.stopPropagation();
    goPrev();
    pauseAutoPlay();
  };

  const handleNext = (e) => {
    e.stopPropagation();
    goNext();
    pauseAutoPlay();
  };

  const handleDotClick = (e, i) => {
    e.stopPropagation();
    setCurrentSlide(i);
    pauseAutoPlay();
  };

  // Touch/swipe support
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
      pauseAutoPlay();
    }
  };

  // Mouse drag support
  const handleMouseDown = (e) => {
    touchStartX.current = e.clientX;
  };

  const handleMouseUp = (e) => {
    const diff = touchStartX.current - e.clientX;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
      pauseAutoPlay();
    }
  };

  return (
    <div ref={revealRef} className={`reveal reveal--delay-${(index % 4) + 1} ${isVisible ? 'visible' : ''}`}>
      <article
        className="memory-card tilt-card"
        ref={tiltRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="memory-card__image">
          {totalSlides > 0 ? (
            <div
              className="memory-card__slider"
              onTouchStart={hasMultiple ? handleTouchStart : undefined}
              onTouchMove={hasMultiple ? handleTouchMove : undefined}
              onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
              onMouseDown={hasMultiple ? handleMouseDown : undefined}
              onMouseUp={hasMultiple ? handleMouseUp : undefined}
            >
              <div
                className="memory-card__slides"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {photos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt={`${memory.title} - ${i + 1}`}
                    loading={index < 3 && i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable="false"
                  />
                ))}
              </div>

              {hasMultiple && (
                <>
                  <button className="memory-card__arrow memory-card__arrow--prev" onClick={handlePrev} aria-label="Previous photo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button className="memory-card__arrow memory-card__arrow--next" onClick={handleNext} aria-label="Next photo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <polyline points="9 6 15 12 9 18" />
                    </svg>
                  </button>
                  <div className="memory-card__dots">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        className={`memory-card__dot ${i === currentSlide ? 'active' : ''}`}
                        onClick={(e) => handleDotClick(e, i)}
                        aria-label={`Go to photo ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="image-placeholder memory-card__placeholder">
              <PhotoIcon />
            </div>
          )}
        </div>
        <div className="memory-card__content">
          <h3 className="memory-card__title">{memory.title}</h3>
          <p className="memory-card__desc">{memory.description}</p>
          {(memory.date || memory.location) && (
            <div className="memory-card__meta">
              {memory.date && <span className="memory-card__date">{memory.date}</span>}
              {memory.date && memory.location && <span className="memory-card__sep">·</span>}
              {memory.location && <span className="memory-card__location">{memory.location}</span>}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
