import { useState } from 'react';
import { Edit, Settings, Star, Video, Bookmark } from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('videos');

  const userProfile = {
    name: 'Sarah Chen',
    role: 'Full-Stack Developer',
    bio: 'Passionate developer with 3+ years experience building scalable web applications. Love working with React, Node.js, and cloud technologies.',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker'],
    rating: 4.9,
    completedProjects: 24,
    videoCount: 12,
    savedJobs: 8,
  };

  const mockVideos = [
    { id: '1', title: 'React Performance Tips', views: 1200, likes: 89 },
    { id: '2', title: 'My Development Setup', views: 850, likes: 67 },
    { id: '3', title: 'Building APIs with Node.js', views: 2100, likes: 156 },
  ];

  const savedJobs = [
    { id: '1', company: 'TechStart', role: 'Senior React Developer', salary: '$90k-120k' },
    { id: '2', company: 'WebCorp', role: 'Full-Stack Engineer', salary: '$80k-110k' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-20 px-4 max-w-md mx-auto">
        {/* Profile header */}
        <div className="profile-header mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20 border-4 border-white/20">
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                SC
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{userProfile.name}</h1>
              <p className="text-white/90">{userProfile.role}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white/90 text-sm">{userProfile.rating}</span>
                </div>
                <div className="text-white/90 text-sm">
                  {userProfile.completedProjects} projects
                </div>
              </div>
            </div>
            <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <p className="text-white/90 text-sm mb-4">{userProfile.bio}</p>
          
          <div className="flex flex-wrap gap-2">
            {userProfile.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-white/20 text-white px-3 py-1 rounded-full text-sm border border-white/30"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl p-4 text-center shadow-soft">
            <div className="text-2xl font-bold text-primary">{userProfile.videoCount}</div>
            <div className="text-sm text-muted-foreground">Videos</div>
          </div>
          <div className="bg-card rounded-xl p-4 text-center shadow-soft">
            <div className="text-2xl font-bold text-success">{userProfile.completedProjects}</div>
            <div className="text-sm text-muted-foreground">Projects</div>
          </div>
          <div className="bg-card rounded-xl p-4 text-center shadow-soft">
            <div className="text-2xl font-bold text-accent">{userProfile.savedJobs}</div>
            <div className="text-sm text-muted-foreground">Saved</div>
          </div>
        </div>

        {/* Content tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary rounded-xl">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              My Videos
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Saved Jobs
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              {mockVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-card rounded-xl overflow-hidden shadow-soft"
                >
                  <div className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium line-clamp-2">
                        {video.title}
                      </p>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{video.views} views</span>
                      <span>{video.likes} likes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="saved" className="mt-6">
            <div className="space-y-4">
              {savedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-card rounded-xl p-4 shadow-soft border border-border"
                >
                  <h3 className="font-semibold text-foreground">{job.role}</h3>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                  <p className="text-sm font-medium text-primary mt-2">{job.salary}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Profile;