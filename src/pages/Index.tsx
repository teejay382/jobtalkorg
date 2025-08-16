import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import VideoFeed from '@/components/feed/VideoFeed';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main content */}
      <main className="pt-16 pb-16">
        <VideoFeed />
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Index;
