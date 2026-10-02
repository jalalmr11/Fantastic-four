import { Link } from 'react-router-dom';
import './Footer.css';

const currentYear = new Date().getFullYear();

export default function Footer() {
  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About Us' },
    { to: '/story', label: 'Our Story' },
    { to: '/memories', label: 'Memories' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/members', label: 'The Four of Us' },
  ];

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand">
            <h2 className="footer__logo">FANTASTIC FOUR</h2>
            <p className="footer__tagline">Four people. One friendship. Countless memories.</p>
          </div>

          <nav className="footer__nav" aria-label="Footer navigation">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="footer__link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            &copy; {currentYear} FANTASTIC FOUR — Made with love.
          </p>
        </div>
      </div>
    </footer>
  );
}
