import { useScrollReveal } from '../../hooks/useEffects';

export default function SectionHeading({ label, title, subtitle, center = false }) {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div ref={ref} className={`reveal ${isVisible ? 'visible' : ''} ${center ? 'text-center' : ''}`}>
      {label && <p className="section-label">{label}</p>}
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
}
