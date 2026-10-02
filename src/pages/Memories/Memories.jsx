import { useState, useEffect } from 'react';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import MemoryCard from '../../components/MemoryCard/MemoryCard';
import ArabicReminder from '../../components/ArabicReminder/ArabicReminder';
import defaultMemories from '../../data/memories';
import reminders from '../../data/reminders';
import { getPhotos, parsePhotoUrls } from '../../services/photoService';
import './Memories.css';

export default function Memories() {
  const [supabaseMemories, setSupabaseMemories] = useState([]);

  useEffect(() => {
    let isMounted = true;
    getPhotos('memories').then(({ data }) => {
      if (isMounted && data && data.length > 0) {
        const formatted = data.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          photos: parsePhotoUrls(p.image_url),
          date: p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
          location: '',
        }));
        setSupabaseMemories(formatted);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const allMemories = [...supabaseMemories, ...defaultMemories];

  return (
    <main className="memories-page">
      <section className="page-hero">
        <div className="container text-center">
          <SectionHeading
            label="Memories"
            title="Moments that matter"
            subtitle="Every memory here tells a piece of our story. Photos and the stories behind them."
            center
          />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="memories-header">
            <p className="memories-count">
              {allMemories.length} {allMemories.length === 1 ? 'memory' : 'memories'}
            </p>
          </div>

          <div className="memories-grid">
            {allMemories.map((memory, i) => (
              <MemoryCard key={memory.id} memory={memory} index={i} />
            ))}
          </div>
        </div>
      </section>

      <ArabicReminder {...reminders[2]} />
    </main>
  );
}
