import SectionHeading from '../../components/SectionHeading/SectionHeading';
import MemberCard from '../../components/MemberCard/MemberCard';
import ArabicReminder from '../../components/ArabicReminder/ArabicReminder';
import members from '../../data/members';
import reminders from '../../data/reminders';
import './Members.css';

export default function Members() {
  return (
    <main className="members-page">
      <section className="page-hero">
        <div className="container text-center">
          <SectionHeading
            label="The Four of Us"
            title="Meet the group"
            subtitle="Click on anyone to explore their personal page — their photos, memories, and story."
            center
          />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="members-grid">
            {members.map((member, i) => (
              <MemberCard key={member.id} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      <ArabicReminder {...reminders[4]} />
    </main>
  );
}
