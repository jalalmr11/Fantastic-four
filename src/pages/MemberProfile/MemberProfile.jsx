import { useParams, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import Lightbox from '../../components/Lightbox/Lightbox';
import { useTilt, useScrollReveal } from '../../hooks/useEffects';
import members from '../../data/members';
import './MemberProfile.css';

const socialIcons = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="22,4 12,13 2,4" />
    </svg>
  ),
};

function GalleryItem({ image, index, onClick }) {
  const tiltRef = useTilt(6);
  return (
    <button ref={tiltRef} className="profile-gallery-item tilt-card" onClick={onClick} aria-label={`View photo ${index + 1}`}>
      {image.src ? (
        <img src={image.src} alt={image.alt || ''} loading="lazy" />
      ) : (
        <div className="image-placeholder profile-gallery-item__placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
      )}
      <div className="profile-gallery-item__hover">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
    </button>
  );
}

export default function MemberProfile() {
  const { memberId } = useParams();
  const member = members.find((m) => m.id === memberId);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [heroRef, heroVisible] = useScrollReveal(0.1);
  const [aboutRef, aboutVisible] = useScrollReveal();

  if (!member) {
    return <Navigate to="/404" replace />;
  }

  const galleryImages = member.gallery?.length > 0
    ? member.gallery
    : [
        { id: `${member.id}-p1`, src: null, alt: 'Photo 1' },
        { id: `${member.id}-p2`, src: null, alt: 'Photo 2' },
        { id: `${member.id}-p3`, src: null, alt: 'Photo 3' },
      ];

  const activeSocials = Object.entries(member.socials || {}).filter(([, value]) => value);

  return (
    <main className="profile-page">
      {/* Hero */}
      <section className="profile-hero" ref={heroRef}>
        <div className={`container reveal ${heroVisible ? 'visible' : ''}`}>
          <div className="profile-hero__layout">
            <div className="profile-hero__avatar">
              {member.photo ? (
                <img src={member.photo} alt={`Photo of ${member.name}`} />
              ) : (
                <div className="image-placeholder profile-hero__placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M20 21a8 8 0 1 0-16 0" />
                  </svg>
                </div>
              )}
            </div>
            <div className="profile-hero__info">
              <h1 className="profile-hero__name">{member.name}</h1>
              <p className="profile-hero__intro">{member.shortIntro}</p>
              <Link to="/members" className="btn btn--ghost profile-hero__back">
                ← Back to The Four of Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="section" ref={aboutRef}>
        <div className={`container container--narrow reveal ${aboutVisible ? 'visible' : ''}`}>
          <SectionHeading title="About Me" />
          <p className="profile-about-text">{member.about}</p>
        </div>
      </section>

      {/* Gallery */}
      <section className="section profile-section-alt">
        <div className="container">
          <SectionHeading label="My Gallery" title="Photos" center />
          <div className="profile-gallery">
            {galleryImages.map((img, i) => (
              <GalleryItem key={img.id} image={img} index={i} onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }} />
            ))}
          </div>
        </div>
      </section>


      {/* Contact */}
      {activeSocials.length > 0 && (
        <section className="section">
          <div className="container container--narrow text-center">
            <SectionHeading label="Contact" title={`Reach ${member.name}`} center />
            <div className="profile-socials">
              {activeSocials.map(([platform, url]) => (
                <a
                  key={platform}
                  href={platform === 'email' ? `mailto:${url}` : url}
                  className="profile-social-link glass"
                  target={platform === 'email' ? undefined : '_blank'}
                  rel={platform === 'email' ? undefined : 'noopener noreferrer'}
                  aria-label={platform}
                >
                  {socialIcons[platform] || null}
                  <span>{platform}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {lightboxOpen && (
        <Lightbox
          images={galleryImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((p) => (p === 0 ? galleryImages.length - 1 : p - 1))}
          onNext={() => setLightboxIndex((p) => (p === galleryImages.length - 1 ? 0 : p + 1))}
        />
      )}
    </main>
  );
}
