import { useState } from 'react';
import VideoCard from './VideoCard';

// Mock data for demonstration
const mockVideos = [
  {
    id: '1',
    title: 'Full-Stack Developer Showcase',
    user: {
      name: 'Sarah Chen',
      role: 'Full-Stack Developer',
      avatar: undefined,
    },
    description: 'Building a React app with Node.js backend. 3+ years experience in MERN stack, passionate about clean code and user experience.',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
    likes: 127,
    comments: 23,
    isEmployer: false,
  },
  {
    id: '2',
    title: 'Senior UX Designer Available',
    user: {
      name: 'Marcus Johnson',
      role: 'UX Designer',
      avatar: undefined,
    },
    description: 'Creating intuitive user experiences for mobile apps. Led design for 50+ successful projects, specializing in fintech and e-commerce.',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    likes: 89,
    comments: 15,
    isEmployer: false,
  },
  {
    id: '3',
    title: 'Hiring: React Developer',
    user: {
      name: 'TechCorp',
      role: 'Startup',
      avatar: undefined,
    },
    description: 'Looking for a passionate React developer to join our remote team. Competitive salary, equity, and flexible hours. Help us build the future!',
    skills: ['React', 'Remote Work', '$80k-120k', 'Equity'],
    likes: 234,
    comments: 67,
    isEmployer: true,
  },
  {
    id: '4',
    title: 'Data Scientist Portfolio',
    user: {
      name: 'Dr. Emily Park',
      role: 'Data Scientist',
      avatar: undefined,
    },
    description: 'ML engineer with PhD in Statistics. Built predictive models for healthcare and finance. Love solving complex problems with data.',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics'],
    likes: 156,
    comments: 31,
    isEmployer: false,
  },
];

const VideoFeed = () => {
  const [currentVideo, setCurrentVideo] = useState(0);

  const handleScroll = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentVideo < mockVideos.length - 1) {
      setCurrentVideo(currentVideo + 1);
    } else if (e.deltaY < 0 && currentVideo > 0) {
      setCurrentVideo(currentVideo - 1);
    }
  };

  return (
    <div 
      className="h-screen overflow-hidden relative"
      onWheel={handleScroll}
    >
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateY(-${currentVideo * 100}vh)` }}
      >
        {mockVideos.map((video, index) => (
          <div key={video.id} className="w-full h-screen flex-shrink-0">
            <VideoCard video={video} />
          </div>
        ))}
      </div>
      
      {/* Scroll indicators */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
        {mockVideos.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-8 rounded-full transition-colors ${
              index === currentVideo ? 'bg-white' : 'bg-white/40'
            }`}
            onClick={() => setCurrentVideo(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoFeed;