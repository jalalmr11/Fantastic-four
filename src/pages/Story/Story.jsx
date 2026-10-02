import SectionHeading from '../../components/SectionHeading/SectionHeading';
import { useScrollReveal } from '../../hooks/useEffects';
import storyData from '../../data/story';
import './Story.css';

function TimelineItem({ item, index }) {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div ref={ref} className={`timeline-item reveal ${isVisible ? 'visible' : ''}`}>
      <div className="timeline-item__marker">
        <div className="timeline-item__dot" />
        <div className="timeline-item__line" />
      </div>
      <div className="timeline-item__content glass">
        <span className="timeline-item__number">0{index + 1}</span>
        <h3 className="timeline-item__title">{item.title}</h3>
        <p className="timeline-item__text">{item.text}</p>
      </div>
    </div>
  );
}

export default function Story() {
  const storyItems = [
    storyData.howWeMet,
    storyData.howWeBecameClose,
    storyData.whatMakesUsSpecial,
  ];

  return (
    <main className="story-page">
      <section className="page-hero">
        <div className="container text-center">
          <SectionHeading
            label="Our Story"
            title="How it all began"
            subtitle="The story of how four people became something more than just friends."
            center
          />
        </div>
      </section>

      <section className="section">
        <div className="container container--narrow">
          <div className="timeline">
            {storyItems.map((item, i) => (
              <TimelineItem key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
