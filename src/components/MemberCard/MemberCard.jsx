import { Link } from 'react-router-dom';
import { useTilt, useScrollReveal } from '../../hooks/useEffects';
import './MemberCard.css';

const PlaceholderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
);

export default function MemberCard({ member, index = 0 }) {
  const tiltRef = useTilt(10);
  const [revealRef, isVisible] = useScrollReveal();

  return (
    <div ref={revealRef} className={`reveal reveal--delay-${index + 1} ${isVisible ? 'visible' : ''}`}>
      <Link to={`/members/${member.id}`} className="member-card tilt-card" ref={tiltRef} aria-label={`View ${member.name}'s profile`}>
        <div className="member-card__image">
          {member.photo ? (
            <img src={member.photo} alt={`Photo of ${member.name}`} loading="lazy" decoding="async" />
          ) : (
            <div className="image-placeholder member-card__placeholder">
              <PlaceholderIcon />
            </div>
          )}
          <div className="member-card__overlay" />
        </div>
        <div className="member-card__info">
          <h3 className="member-card__name">{member.name}</h3>
          <p className="member-card__intro">{member.shortIntro}</p>
        </div>
        <div className="member-card__glow" />
      </Link>
    </div>
  );
}
