import { useScrollReveal } from '../../hooks/useEffects';

export default function ArabicReminder({ arabic, meaning, source }) {
  const [ref, isVisible] = useScrollReveal(0.3);

  return (
    <div ref={ref} className={`arabic-reminder reveal ${isVisible ? 'visible' : ''}`}>
      <div className="container container--narrow">
        <p className="arabic-reminder__text">{arabic}</p>
        <p className="arabic-reminder__meaning">"{meaning}"</p>
        {source && <p className="arabic-reminder__source">— {source}</p>}
      </div>
    </div>
  );
}
