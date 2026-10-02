import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About Us' },
    { to: '/story', label: 'Our Story' },
    { to: '/memories', label: 'Memories' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/members', label: 'The Four of Us' },
  ];

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} role="banner">
      <nav className="navbar__inner container" aria-label="Main navigation">
        <Link to="/" className="navbar__logo" aria-label="FANTASTIC FOUR — Home" onClick={() => setIsOpen(false)}>
          <span className="navbar__logo-text">FANTASTIC FOUR</span>
        </Link>

        <ul className={`navbar__links ${isOpen ? 'navbar__links--open' : ''}`} role="menubar">
          {navLinks.map((link) => (
            <li key={link.to} role="none">
              <NavLink
                to={link.to}
                className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                role="menuitem"
                end={link.to === '/'}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          className={`navbar__toggle ${isOpen ? 'navbar__toggle--open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          id="nav-toggle"
        >
          <span className="navbar__toggle-line" />
          <span className="navbar__toggle-line" />
          <span className="navbar__toggle-line" />
        </button>
      </nav>

      {isOpen && <div className="navbar__overlay" onClick={() => setIsOpen(false)} aria-hidden="true" />}
    </header>
  );
}
