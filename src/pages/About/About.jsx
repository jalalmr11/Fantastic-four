import SectionHeading from '../../components/SectionHeading/SectionHeading';
import MemberCard from '../../components/MemberCard/MemberCard';
import ArabicReminder from '../../components/ArabicReminder/ArabicReminder';
import { useScrollReveal } from '../../hooks/useEffects';
import members from '../../data/members';
import reminders from '../../data/reminders';
import './About.css';

export default function About() {
  const [introRef, introVisible] = useScrollReveal();

  return (
    <main className="about-page">
      {/* Hero */}
      <section className="page-hero">
        <div className="container text-center">
          <SectionHeading
            label="About Us"
            title="About Us"
            center
          />
        </div>
      </section>

      {/* About Content */}
      <section className="section">
        <div className="container">
          <div ref={introRef} className={`about-intro reveal ${introVisible ? 'visible' : ''}`}>
            <div className="about-intro__content">
              <p className="about-intro__text">
                FANTASTIC FOUR is the story of four friends who came together unexpectedly and built a meaningful friendship through shared experiences, understanding, and the moments we continue to create together.
              </p>
              <p className="about-intro__text">
                What started with a simple meeting during our college days gradually became a strong bond built on trust, respect, mutual understanding, and support. We spend time together, learn from each other, support one another in studies and sports, explore new experiences, and share ideas for the future.
              </p>
              <p className="about-intro__text">
                Each of us has a different area of interest and a different path we are working towards.
              </p>
              <p className="about-intro__text">
                Jalal, a CSE student, is aspiring to become a Cloud Engineer while exploring backend development and cloud computing.
              </p>
              <p className="about-intro__text">
                Nawfal, a CSE student, is aspiring to become a DevOps Engineer, with an interest in automation, infrastructure, and cloud technologies.
              </p>
              <p className="about-intro__text">
                Hashmi, an AI & Data Science student, is aspiring to become an AI Engineer, with an interest in artificial intelligence and data-driven technologies.
              </p>
              <p className="about-intro__text">
                Irshak Hassan, a CSE student, is interested in research, marketing, and developing new business ideas, with a passion for exploring ideas and turning them into something meaningful.
              </p>
              <p className="about-intro__text">
                Although our interests and career paths are different, we support each other and grow together. We believe that friendship is not only about spending time together, but also about encouraging each other, sharing knowledge, respecting differences, and helping one another move forward.
              </p>
              <p className="about-intro__text">
                Our friendship is also connected by something deeper — our focus on Islam and our Deen. We encourage each other to stay grounded in our values, make good decisions, and become better individuals while continuing to work towards our goals.
              </p>
              <p className="about-intro__text">
                We also share ideas and plans for the future, including working together on projects and exploring new possibilities. Every experience adds something new to our friendship and becomes another memory to look back on.
              </p>
              <p className="about-intro__text">
                FANTASTIC FOUR is more than just a name. It represents four different personalities, four different paths, shared values, countless memories, and one friendship that continues to grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ArabicReminder {...reminders[3]} />

      {/* Values */}
      <section className="section">
        <div className="container">
          <SectionHeading
            label="What We Believe"
            title="The things that matter"
            center
          />
          <div className="about-values">
            {[
              { icon: '🤝', title: 'Trust', desc: 'The foundation of everything we share.' },
              { icon: '😂', title: 'Laughter', desc: 'The moments that make the hard times lighter.' },
              { icon: '💬', title: 'Honesty', desc: 'Real conversations, not surface-level talk.' },
              { icon: '⏳', title: 'Time', desc: 'Showing up — not just when it\'s convenient.' },
            ].map((val, i) => (
              <div key={i} className="about-value-card glass">
                <span className="about-value-card__icon">{val.icon}</span>
                <h4 className="about-value-card__title">{val.title}</h4>
                <p className="about-value-card__desc">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Four */}
      <section className="section">
        <div className="container">
          <SectionHeading
            label="The Group"
            title="Meet the four of us"
            center
          />
          <div className="about-members">
            {members.map((m, i) => (
              <MemberCard key={m.id} member={m} index={i} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
