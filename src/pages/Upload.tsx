
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Button } from '@/components/ui/button';
import { VideoUploader } from '@/components/upload/VideoUploader';
import { useAuth } from '@/hooks/useAuth';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Sign in Required</h2>
          <p className="text-muted-foreground mb-4">You need to sign in to upload videos.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-20 px-4 max-w-md mx-auto">
        <VideoUploader onSuccess={handleSuccess} />
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Upload;
