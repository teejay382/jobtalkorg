import { useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';

const PostDetail = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <Header />
      <main className="pt-20 pb-20 px-4 max-w-2xl mx-auto animate-fade-in">
        <div className="glass-card-premium rounded-2xl p-6 border border-primary/15 shadow-glass">
          <h1 className="text-xl font-semibold text-foreground">Post</h1>
          <p className="text-muted-foreground text-sm mt-2">ID: {id}</p>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default PostDetail;
