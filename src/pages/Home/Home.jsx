import { Link } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useEffects';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import ArabicReminder from '../../components/ArabicReminder/ArabicReminder';
import MemberCard from '../../components/MemberCard/MemberCard';
import members from '../../data/members';
import reminders from '../../data/reminders';
import aboutus1 from '../../assets/images/aboutus1.jpeg';
import aboutus2 from '../../assets/images/aboutus2.jpeg';
import './Home.css';

export default function Home() {
  const [heroRef, heroVisible] = useScrollReveal(0.1);
  const [featRef, featVisible] = useScrollReveal();

  return (
    <main className="home-page">
      {/* ===== HERO ===== */}
      <section className="hero" aria-label="Welcome to FANTASTIC FOUR">
        <div className="hero__bg">
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__orb hero__orb--3" />
          <div className="hero__grid" />
        </div>

        <div className="container hero__content" ref={heroRef}>
          <div className={`hero__text reveal ${heroVisible ? 'visible' : ''}`}>
            <p className="hero__label">Welcome to</p>
            <h1 className="hero__title">
              <span className="hero__title-line hero__title-line--1">FANTASTIC</span>
              <span className="hero__title-line hero__title-line--2">FOUR</span>
            </h1>
            <p className="hero__subtitle">Four People. One Friendship. Countless Memories.</p>
            <p className="hero__desc">
              We created this space to preserve the moments, memories and stories
              that made our friendship special. A small corner of the internet,
              just for us.
            </p>
            <div className="hero__actions">
              <Link to="/story" className="btn btn--primary" id="hero-explore-story">
                Explore Our Story
              </Link>
              <Link to="/memories" className="btn btn--secondary" id="hero-view-memories">
                View Memories
              </Link>
            </div>
          </div>
        </div>

        <div className="hero__scroll-hint" aria-hidden="true">
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* ===== ARABIC REMINDER 1 ===== */}
      <ArabicReminder {...reminders[0]} />

      {/* ===== ABOUT PREVIEW ===== */}
      <section className="section home-about">
        <div className="container">
          <div className="home-about__grid">
            <div className="home-about__visual">
              <div className="home-about__card home-about__card--1">
                <img src={aboutus1} alt="About us photo 1" loading="lazy" decoding="async" />
              </div>
              <div className="home-about__card home-about__card--2">
                <img src={aboutus2} alt="About us photo 2" loading="lazy" decoding="async" />
              </div>
            </div>
            <div className="home-about__text">
              <SectionHeading
                label="About Us"
                title="Four friends, one bond"
                subtitle="We are four friends who met by chance and became close through the moments we shared together. From our first days in college to the memories we continue to create, our friendship has grown through understanding, trust, and mutual support."
              />
              <p className="home-about__desc">
                We enjoy spending time together, learning new things, supporting each other in studies and sports, and working on new ideas. We also share a common focus on <strong>Islam and our Deen</strong>, which is an important part of our friendship.
              </p>
              <p className="home-about__desc">
                <strong>FANTASTIC FOUR</strong> is more than just a name. It represents four friends, countless memories, shared dreams, and a bond that continues to grow.
              </p>
              <Link to="/about" className="btn btn--secondary" id="home-about-link" style={{ marginTop: '24px' }}>
                Learn more about us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED MEMBERS ===== */}
      <section className="section home-members" ref={featRef}>
        <div className="container">
          <SectionHeading
            label="The Four of Us"
            title="Meet the group"
            subtitle="Four different people. One incredible friendship."
            center
          />
          <div className={`home-members__grid reveal ${featVisible ? 'visible' : ''}`}>
            {members.map((member, i) => (
              <MemberCard key={member.id} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== ARABIC REMINDER 2 ===== */}
      <ArabicReminder {...reminders[1]} />

      {/* ===== CTA ===== */}
      <section className="section home-cta">
        <div className="container text-center">
          <SectionHeading
            title="Ready to explore?"
            subtitle="Dive into our memories, browse the gallery, or read our story from the beginning."
            center
          />
          <div className="home-cta__actions" style={{ marginTop: '32px' }}>
            <Link to="/memories" className="btn btn--primary" id="home-cta-memories">Memories</Link>
            <Link to="/gallery" className="btn btn--secondary" id="home-cta-gallery">Gallery</Link>
            <Link to="/story" className="btn btn--ghost" id="home-cta-story">Our Story</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
