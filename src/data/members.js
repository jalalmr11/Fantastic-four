import jalalPhoto from '../assets/images/jalal.jpeg';
import nawfalPhoto from '../assets/images/Nawfal.jpeg';
import hashmiPhoto from '../assets/images/hashmi.jpeg';
import irshakPhoto from '../assets/images/irshak hassan.jpeg';

// Gallery images
import jalalGal1 from '../assets/images/jalalmygallery1.jpeg';
import jalalGal2 from '../assets/images/jalalmygallery2.jpeg';
import jalalGal3 from '../assets/images/jalalmygallery3.jpeg';
import nawfalGal1 from '../assets/images/nawfalmygallery1.jpeg';
import nawfalGal2 from '../assets/images/nawfalmygallery2.jpeg';
import nawfalGal3 from '../assets/images/nawfalmygallery3.jpeg';
import hashmiGal1 from '../assets/images/hashmi mygallery1.jpeg';
import hashmiGal2 from '../assets/images/hashmi mygallery2.jpeg';
import hashmiGal3 from '../assets/images/hashmi mygallery3.jpeg';
import irshakGal1 from '../assets/images/irshak hassan mygallery1.jpeg';
import irshakGal2 from '../assets/images/irshak hassan mygallery2.jpeg';
import irshakGal3 from '../assets/images/irshak hassan mygallery3.jpeg';

const members = [
  {
    id: 'jalal',
    name: 'Jalal',
    shortIntro: 'CSE student Aspiring cloud computing and backend development.',
    about: "I'm Jalal, a Computer Science & Engineering student who is currently exploring cloud computing and backend development. I enjoy learning new technologies, building small projects, and improving myself step by step.",
    photo: jalalPhoto,
    gallery: [
      { id: 'jalal-g1', src: jalalGal1, alt: 'Jalal photo 1' },
      { id: 'jalal-g2', src: jalalGal2, alt: 'Jalal photo 2' },
      { id: 'jalal-g3', src: jalalGal3, alt: 'Jalal photo 3' },
    ],
    socials: {
      github: '#',
      linkedin: '#',
      instagram: '#',
      email: 'jalal@example.com',
    },
  },
  {
    id: 'nawfal',
    name: 'Nawfal',
    shortIntro: 'CSE student Aspiring DevOps.',
    about: "I'm Nawfal, a Computer Science & Engineering student who is currently exploring DevOps Engineer and backend development. I enjoy learning new technologies, building small projects, and improving myself step by step.",
    photo: nawfalPhoto,
    gallery: [
      { id: 'nawfal-g1', src: nawfalGal1, alt: 'Nawfal photo 1' },
      { id: 'nawfal-g2', src: nawfalGal2, alt: 'Nawfal photo 2' },
      { id: 'nawfal-g3', src: nawfalGal3, alt: 'Nawfal photo 3' },
    ],
    socials: {
      github: '#',
      linkedin: '#',
      instagram: '#',
      email: 'nawfal@example.com',
    },
  },
  {
    id: 'hashmi',
    name: 'Hashmi',
    shortIntro: 'AI & Data Science student aspiring to be an AI engineer.',
    about: "I'm Hashmi, from artificial intelligence and data science and aspiring as a AI engineer, currently exploring web development and I enjoying to explore new technologies and build small projects and improving myself step by step.",
    photo: hashmiPhoto,
    gallery: [
      { id: 'hashmi-g1', src: hashmiGal1, alt: 'Hashmi photo 1' },
      { id: 'hashmi-g2', src: hashmiGal2, alt: 'Hashmi photo 2' },
      { id: 'hashmi-g3', src: hashmiGal3, alt: 'Hashmi photo 3' },
    ],
    socials: {
      github: '#',
      linkedin: '#',
      instagram: '#',
      email: 'hashmi@example.com',
    },
  },
  {
    id: 'irshak-hassan',
    name: 'Irshak Hassan',
    shortIntro: 'CSE student Passionate about research, marketing, and new business ideas.',
    about: "I'm Irshak Hassan, interested in research, marketing, and creating new business ideas. I enjoy exploring new things, learning from different ideas, and thinking about how simple ideas can become something useful.",
    photo: irshakPhoto,
    gallery: [
      { id: 'irshak-g1', src: irshakGal1, alt: 'Irshak Hassan photo 1' },
      { id: 'irshak-g2', src: irshakGal2, alt: 'Irshak Hassan photo 2' },
      { id: 'irshak-g3', src: irshakGal3, alt: 'Irshak Hassan photo 3' },
    ],
    socials: {
      github: '#',
      linkedin: '#',
      instagram: '#',
      email: 'irshakhassan@example.com',
    },
  },
];

export default members;


